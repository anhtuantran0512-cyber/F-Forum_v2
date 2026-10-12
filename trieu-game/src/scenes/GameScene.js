import Phaser from 'phaser';
import { TILE, TILE_FRAME } from '../art.js';
import {
  buildMap, MAP_W, MAP_H, HOUSE, DAY_LENGTH,
  tideLevel, tideHalfWidth, tideRising, nextLowTide, isFordRow, distToRiver, TIDE_PERIOD,
} from '../world.js';
import { Survival } from '../survival.js';
import { ITEMS, RECIPES, CAT_NAME, recipeName, recipeDesc } from '../items.js';
import ListMenu from '../ui/menu.js';

const VIEW_W = 1280;
const VIEW_H = 720;
const ZOOM = 3;
const WALK_SPEED = 62;     // px thế giới / giây
const SPRINT_MULT = 1.55;
const BOAT_SPEED_MULT = 1.1;
const SEED = 2026;
const CRAB_COUNT = 3;
const CRAB_RESPAWN = 25;
const SNAKE_COUNT = 2;
const SNAKE_RESPAWN = 30;
const RESOURCE_RESPAWN = 90;
const ROCK_RESPAWN = 120;
const PLATFORM_MAX_D = 5;  // khoảng cách tối đa từ tâm sông mà mực triều cường có thể tới
const MOSQUITO_RANGE = 8;  // muỗi hoạt động trong phạm vi này quanh sông
const LAMP_RANGE = 4;      // đèn xua muỗi
const SPIKE_DMG = 6;

const SKILL_NAME = { dive: 'Lặn', herb: 'Thảo dược', fish: 'Chài lưới' };
const BLOCK_TYPES = new Set(['T', 'R', 'X', 'K', 'SP', 'LM', 'DR', 'FLAG']);
const TYPE_FRAME = { P: TILE_FRAME.PLANK, K: TILE_FRAME.FIRE, SP: TILE_FRAME.SPIKE, LM: TILE_FRAME.LAMP, DR: TILE_FRAME.DRY, FLAG: TILE_FRAME.FLAG };
const RESOURCE_CATS = new Set(['resource', 'rare', 'food', 'medicine', 'ammo']);
const MENU_TITLE = { craft: 'CHẾ TẠO  (C)', build: 'XÂY DỰNG  (B)', inv: 'TÚI ĐỒ  (I)' };

const COLOR = {
  text: '#f2e6c9',
  dim: '#b8ab8a',
  hunger: '#ff6b35',
  thirst: '#4a9eb5',
  stamina: '#ffd23f',
  temp: '#9fd3ff',
  hp: '#d64545',
  warn: '#ff8c42',
  good: '#8fd694',
  gold: '#ffd23f',
};

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.grid = buildMap(SEED);
    this.survival = new Survival();
    this.t = 0;               // thời gian trò chơi (giây)
    this.halfW = tideHalfWidth(0);
    this.animFrame = 0;
    this.animT = 0;
    this.walkT = 0;
    this.face = { x: 0, y: 1 };
    this.moving = false;
    this.sprinting = false;
    this.raining = false;
    this.weatherT = 60;       // trời khô 60 giây đầu
    this.wetT = 0;
    this.busy = false;        // đang ngủ (fade)
    this.dead = false;
    this.deadT = 0;
    this.attackCD = 0;
    this.fishCD = 0;
    this.gatherCD = 0;
    this.mosqT = 15;          // đếm ngược lần muỗi đốt tiếp theo
    this.respawns = [];
    this.log = [];
    this.onBoat = false;
    this.helpVisible = true;
    this.menuMode = null;

    // Túi đồ: mọi vật phẩm đều có số lượng (0 nếu chưa có)
    this.inv = {};
    for (const id of Object.keys(ITEMS)) this.inv[id] = 0;
    Object.assign(this.inv, { wood: 2, reed: 4, herb: 1, machete: 1 });
    // Trang bị đang mặc
    this.equip = { weapon: 'machete', head: null, body: null, feet: null };
    this.skills = { dive: 0, herb: 0, fish: 0 }; // XP; cấp = floor(XP / 20), tối đa 20

    this.hud = [];
    this.hudTexts = [];

    this.createTiles();
    this.createPlayer();
    this.createEnemies();
    this.createFx();
    this.createHud();
    this.createInput();

    // Camera chính: zoom pixel, theo người chơi. UI camera: không zoom.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_W * TILE, MAP_H * TILE);
    cam.setZoom(ZOOM);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setBackgroundColor('#05121f');

    this.uiCam = this.cameras.add(0, 0, VIEW_W, VIEW_H);
    this.uiCam.setScroll(0, 0);
    cam.ignore(this.hud);
    const hudSet = new Set(this.hud);
    const worldObjs = this.children.list.filter((o) => !hudSet.has(o));
    this.uiCam.ignore(worldObjs);

    this.msg('Bạn tỉnh dậy bên nhà sàn. Nước đang lên...', COLOR.text);
    this.msg('Nhấn H để xem điều khiển. C = chế tạo, B = xây dựng, I = túi đồ.', COLOR.dim);
  }

  // ---------------- Khởi tạo ----------------

  createTiles() {
    this.tileImgs = [];
    for (let ty = 0; ty < MAP_H; ty++) {
      const row = [];
      for (let tx = 0; tx < MAP_W; tx++) {
        const img = this.add.image(tx * TILE, ty * TILE, 'tiles', String(this.frameFor(tx, ty)))
          .setOrigin(0, 0)
          .setDepth(0);
        row.push(img);
      }
      this.tileImgs.push(row);
    }
    this.frameCache = new Int16Array(MAP_W * MAP_H).fill(-1);
  }

  createPlayer() {
    const startTx = HOUSE.x + Math.floor(HOUSE.w / 2);
    const startTy = HOUSE.y + HOUSE.h + 1;
    this.px = startTx * TILE + 8;
    this.py = startTy * TILE + 12; // vị trí "chân" (đáy hitbox)
    this.player = this.add.sprite(this.px, this.py, 'player', '0')
      .setOrigin(0.5, 20 / 24)
      .setDepth(10);
  }

  createEnemies() {
    this.crabs = [];
    for (let i = 0; i < CRAB_COUNT; i++) {
      const spr = this.add.sprite(0, 0, 'crab').setOrigin(0.5, 1).setDepth(9).setVisible(false);
      this.crabs.push({ kind: 'crab', spr, x: 0, y: 0, hp: 25, maxHp: 25, alive: false, dir: { x: 1, y: 0 }, turnT: 0, respawnAt: i * 4 + 2, cool: 0, spikeCD: 0 });
    }
    this.snakes = [];
    for (let i = 0; i < SNAKE_COUNT; i++) {
      const spr = this.add.sprite(0, 0, 'snake').setOrigin(0.5, 0.5).setDepth(8).setVisible(false);
      this.snakes.push({ kind: 'snake', spr, x: 0, y: 0, hp: 30, maxHp: 30, alive: false, dir: { x: 1, y: 0 }, turnT: 0, respawnAt: 8 + i * 10, cool: 0 });
    }
  }

  createFx() {
    // Lớp tối ban đêm (world-space, phủ kín khung nhìn).
    this.night = this.add.rectangle(0, 0, 10, 10, 0x06102a, 0).setDepth(40);
    // Mưa: các hạt rơi trong khung nhìn.
    this.rainG = this.add.graphics().setDepth(41);
    this.drops = [];
    for (let i = 0; i < 110; i++) {
      this.drops.push({ x: Math.random(), y: Math.random(), s: 0.8 + Math.random() * 0.6 });
    }
  }

  createHud() {
    this.hudG = this.add.graphics().setDepth(200);
    this.hud.push(this.hudG);

    // Chữ HUD thường (ẩn khi đang mở menu).
    this.txt = (x, y, str, size = 14, color = COLOR.text, origin = [0, 0]) => {
      const t = this.add.text(x, y, str, {
        fontFamily: 'monospace', fontSize: `${size}px`, color, stroke: '#05121f', strokeThickness: 3,
      }).setOrigin(origin[0], origin[1]).setDepth(200);
      this.hud.push(t);
      this.hudTexts.push(t);
      return t;
    };
    // Chữ của menu (luôn hiển thị khi menu mở).
    this.menuTxt = (x, y, str, size = 14, color = COLOR.text, origin = [0, 0]) => {
      const t = this.add.text(x, y, str, {
        fontFamily: 'monospace', fontSize: `${size}px`, color, stroke: '#05121f', strokeThickness: 3,
      }).setOrigin(origin[0], origin[1]).setDepth(205);
      this.hud.push(t);
      return t;
    };

    this.hpText = this.txt(16, 14, '', 13);
    this.clockText = this.txt(VIEW_W / 2, 14, '', 15, COLOR.text, [0.5, 0]);
    this.tideTitle = this.txt(VIEW_W - 16, 14, '', 15, COLOR.thirst, [1, 0]);
    this.tideInfo = this.txt(VIEW_W - 16, 36, '', 13, COLOR.dim, [1, 0]);
    this.statusText = this.txt(VIEW_W / 2, 52, '', 14, COLOR.warn, [0.5, 0]);

    this.logTexts = [];
    for (let i = 0; i < 5; i++) this.logTexts.push(this.txt(16, 40 + i * 20, '', 14));

    this.txt(16, VIEW_H - 120, 'NO BỤNG', 13, COLOR.hunger);
    this.txt(16, VIEW_H - 94, 'KHÁT', 13, COLOR.thirst);
    this.txt(16, VIEW_H - 68, 'THỂ LỰC', 13, COLOR.stamina);
    this.txt(16, VIEW_H - 42, 'THÂN NHIỆT', 13, COLOR.temp);
    this.statValues = [];
    for (let i = 0; i < 4; i++) this.statValues.push(this.txt(298, VIEW_H - 120 + i * 26, '', 13, COLOR.dim));

    this.invText = this.txt(VIEW_W - 16, VIEW_H - 16, '', 14, COLOR.text, [1, 1]);
    this.helpText = this.txt(VIEW_W / 2, VIEW_H - 16, '', 13, COLOR.dim, [0.5, 1]);
    this.helpPanel = this.txt(VIEW_W / 2, VIEW_H / 2, '', 15, COLOR.text, [0.5, 0.5]);
    this.deadText = this.txt(VIEW_W / 2, VIEW_H / 2, '', 26, COLOR.hp, [0.5, 0.5]);
    this.deadText.setVisible(false);

    this.helpPanel.setText([
      'ĐIỀU KHIỂN',
      '',
      'WASD / Mũi tên  Đi bộ          Shift  Chạy (tốn thể lực)',
      'Space           Hái / chặt / đào   X  Đánh (vũ khí đang cầm)',
      'V               Đổi vũ khí        O  Lên / xuống thuyền (cạnh nước)',
      'C               CHẾ TẠO (menu)    B  XÂY DỰNG (menu, đặt ô đang quay mặt)',
      'I               TÚI ĐỒ (dùng, mặc trang bị)',
      'F               Câu cá (quay mặt về nước; cá vàng khi nước lớn)',
      'E               Uống nước sông (CÓ THỂ trúng nước độc!)',
      '1 / 2 / 3       Ăn nhanh: cá / cua / cá vàng     T  Nướng cá (gần bếp)',
      'Q / N           Uống Nước Lá Rừng / Thuốc Sốt',
      'R               Ngủ (nhà sàn an toàn hơn; ngủ tới lúc triều xuống)',
      'H               Ẩn/hiện bảng này',
      '',
      'Trong menu: ↑↓ hoặc W/S chọn · Enter thực hiện · Esc hoặc phím mở để đóng.',
      'Mẹo: triều cường ngập ~5 ô từ sông; muỗi bay ven sông ban đêm (đèn xua muỗi giúp).',
    ].join('\n'));
    this.helpPanel.setBackgroundColor('rgba(5,18,31,0.85)');
    this.helpPanel.setPadding(20, 16, 20, 16);

    // Menu danh sách (chế tạo / xây dựng / túi đồ)
    this.menu = new ListMenu(this.menuTxt, { title: '', rows: 11 });
  }

  createInput() {
    const KC = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard;
    this.cursors = kb.createCursorKeys();
    this.keys = kb.addKeys({
      W: KC.W, A: KC.A, S: KC.S, D: KC.D,
      SPACE: KC.SPACE, SHIFT: KC.SHIFT, ENTER: KC.ENTER, ESC: KC.ESC,
      X: KC.X, F: KC.F, E: KC.E, Q: KC.Q, C: KC.C, B: KC.B, R: KC.R, H: KC.H,
      V: KC.V, I: KC.I, O: KC.O, T: KC.T, N: KC.N,
      ONE: KC.ONE, TWO: KC.TWO, THREE: KC.THREE,
    });
  }

  // ---------------- Bản đồ / triều ----------------

  isWater(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
    const t = this.grid[ty][tx];
    if (t === 'W') return true;
    if ((t === 'B' || t === 'P') && !isFordRow(ty)) return distToRiver(tx) <= this.halfW;
    return false;
  }

  // boat = true: thuyền đi được trên nước.
  blocked(tx, ty, boat = false) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
    const t = this.grid[ty][tx];
    if (BLOCK_TYPES.has(t)) return true;
    if (this.isWater(tx, ty)) return !boat;
    return false;
  }

  // Hộp va chạm: x±4, y-4..y (y là đáy chân).
  collides(x, y, boat = false) {
    const l = Math.floor((x - 4) / TILE), r = Math.floor((x + 3.99) / TILE);
    const top = Math.floor((y - 4) / TILE), bot = Math.floor((y - 0.01) / TILE);
    for (let ty = top; ty <= bot; ty++) {
      for (let tx = l; tx <= r; tx++) {
        if (this.blocked(tx, ty, boat)) return true;
      }
    }
    return false;
  }

  movePlayer(dx, dy) {
    if (!this.collides(this.px + dx, this.py, this.onBoat)) this.px += dx;
    if (!this.collides(this.px, this.py + dy, this.onBoat)) this.py += dy;
  }

  // Có loại ô `type` trong bán kính r (Chebyshev) quanh người chơi không?
  nearTile(type, r) {
    const { tx, ty } = this.playerTile();
    for (let y = ty - r; y <= ty + r; y++) {
      for (let x = tx - r; x <= tx + r; x++) {
        if (this.grid[y]?.[x] === type) return true;
      }
    }
    return false;
  }

  nearWater(r) {
    const { tx, ty } = this.playerTile();
    for (let y = ty - r; y <= ty + r; y++) {
      for (let x = tx - r; x <= tx + r; x++) {
        if (this.isWater(x, y)) return true;
      }
    }
    return false;
  }

  frameFor(tx, ty) {
    if (this.isWater(tx, ty)) return this.animFrame;
    const t = this.grid[ty][tx];
    if (TYPE_FRAME[t] !== undefined) return TYPE_FRAME[t];
    switch (t) {
      case 'G': return ((tx * 7 + ty * 13) % 5 === 0) ? TILE_FRAME.GRASS2 : TILE_FRAME.GRASS1;
      case 'B': return (isFordRow(ty) || distToRiver(tx) >= 4) ? TILE_FRAME.SAND : TILE_FRAME.MUD;
      case 'S': return TILE_FRAME.REED;
      case 'T': return TILE_FRAME.TREE;
      case 'R': return TILE_FRAME.ROCK;
      case 'H': return TILE_FRAME.HERB;
      case 'X': return TILE_FRAME.WALL;
      case 'F': return TILE_FRAME.FLOOR;
      default: return TILE_FRAME.WATER0;
    }
  }

  refreshCell(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return;
    const idx = ty * MAP_W + tx;
    const f = this.frameFor(tx, ty);
    if (this.frameCache[idx] !== f) {
      this.frameCache[idx] = f;
      this.tileImgs[ty][tx].setFrame(String(f));
    }
  }

  // Tìm ô đất gần nhất để đẩy nhân vật/cua ra khỏi nước.
  nearestLand(x, y) {
    const sx = Math.floor(x / TILE), sy = Math.floor(y / TILE);
    for (let r = 0; r <= 12; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const tx = sx + dx, ty = sy + dy;
          if (!this.blocked(tx, ty)) return { x: tx * TILE + 8, y: ty * TILE + 12 };
        }
      }
    }
    return { x, y };
  }

  // Tìm ô nước gần nhất (cho rắn nước).
  nearestWater(x, y) {
    const sx = Math.floor(x / TILE), sy = Math.floor(y / TILE);
    for (let r = 0; r <= 14; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (this.isWater(sx + dx, sy + dy)) return { x: (sx + dx) * TILE + 8, y: (sy + dy) * TILE + 8 };
        }
      }
    }
    return { x, y };
  }

  updateTide() {
    this.halfW = tideHalfWidth(this.t);

    // Cập nhật ô trong dải ngập (|x - tâm| <= 7). Nước sóng lấp lánh cũng đi qua đây.
    const cx = 32;
    for (let tx = cx - 7; tx <= cx + 7; tx++) {
      for (let ty = 0; ty < MAP_H; ty++) {
        if (this.grid[ty][tx] === 'P' && this.isWater(tx, ty)) {
          // Sàn tre bị ngập: bị cuốn trôi, ô trở lại thành bờ.
          this.grid[ty][tx] = 'B';
          this.msg('⚠ Nước triều cường cuốn trôi một sàn tre!', COLOR.warn);
        }
        this.refreshCell(tx, ty);
      }
    }

    // Người chơi đứng trong nước (không có thuyền) → bị đẩy về bờ và ướt.
    if (this.isWater(Math.floor(this.px / TILE), Math.floor((this.py - 2) / TILE))) {
      if (this.onBoat) {
        this.wetT = 2;
      } else {
        const p = this.nearestLand(this.px, this.py);
        this.px = p.x; this.py = p.y;
        this.wetT = 4;
        this.msg('Nước lên! Bạn bị cuốn về bờ, người ướt sũng.', COLOR.warn);
      }
    }
    // Cua trong nước → đẩy ra bờ.
    for (const c of this.crabs) {
      if (!c.alive) continue;
      if (this.isWater(Math.floor(c.x / TILE), Math.floor((c.y - 2) / TILE))) {
        const p = this.nearestLand(c.x, c.y);
        c.x = p.x; c.y = p.y;
      }
    }
  }

  updateWeather(dt) {
    this.weatherT -= dt;
    if (this.weatherT <= 0) {
      this.raining = !this.raining;
      if (this.raining) {
        this.weatherT = 25 + Math.random() * 15;
        this.msg('Trời bắt đầu mưa lớn...', COLOR.thirst);
      } else {
        this.weatherT = 70 + Math.random() * 60;
        this.msg('Mưa tạnh, trời quang dần.', COLOR.dim);
      }
    }
  }

  // ---------------- Thời gian / hiển thị ----------------

  dayFrac() {
    return ((this.t / DAY_LENGTH) + 7 / 24) % 1; // t = 0 là 07:00
  }

  clock() {
    const f = this.dayFrac();
    const hour = f * 24;
    const hh = Math.floor(hour);
    const mm = Math.floor((hour - hh) * 60);
    const day = Math.floor((this.t / DAY_LENGTH) + 7 / 24) + 1;
    return { day, hh, mm, hour };
  }

  darkness() {
    // 1 lúc nửa đêm, 0 lúc trưa
    return 0.5 + 0.5 * Math.cos(2 * Math.PI * this.dayFrac());
  }

  msg(text, color = COLOR.text) {
    this.log.unshift({ text, color, t: this.t });
    if (this.log.length > 30) this.log.length = 30;
  }

  // ---------------- Kỹ năng / trang bị ----------------

  lvl(k) {
    return Math.min(20, Math.floor(this.skills[k] / 20));
  }

  addXp(k, n) {
    const before = this.lvl(k);
    this.skills[k] += n;
    const after = this.lvl(k);
    if (after > before) this.msg(`Kỹ năng ${SKILL_NAME[k]} lên cấp ${after}!`, COLOR.gold);
  }

  armorMods() {
    const m = { rainTemp: 1, wet: 1, dmgTaken: 1, speed: 1 };
    for (const slot of ['head', 'body', 'feet']) {
      const id = this.equip[slot];
      if (!id) continue;
      const mods = ITEMS[id].mods ?? {};
      for (const k of Object.keys(mods)) m[k] *= mods[k];
    }
    return m;
  }

  ownedWeapons() {
    return Object.keys(ITEMS).filter((id) => ITEMS[id].weapon && this.inv[id] > 0);
  }

  cycleWeapon() {
    const list = this.ownedWeapons();
    if (list.length <= 1) { this.msg('Chưa có vũ khí nào khác. Chế thêm trong menu C.', COLOR.dim); return; }
    const i = list.indexOf(this.equip.weapon);
    this.equip.weapon = list[(i + 1) % list.length];
    this.msg(`Cầm ${ITEMS[this.equip.weapon].name}.`, COLOR.text);
  }

  // ---------------- Hành động cơ bản ----------------

  frontTile() {
    const cx = this.px, cy = this.py - 6;
    const fx = cx + this.face.x * 12, fy = cy + this.face.y * 12;
    return { tx: Math.floor(fx / TILE), ty: Math.floor(fy / TILE) };
  }

  playerTile() {
    return { tx: Math.floor(this.px / TILE), ty: Math.floor((this.py - 4) / TILE) };
  }

  respawnLater(tx, ty, type, delay) {
    this.respawns.push({ tx, ty, type, at: this.t + delay });
  }

  doGather() {
    if (this.gatherCD > 0) return;
    if (this.survival.stamina < 2) { this.msg('Quá mệt để làm việc...', COLOR.warn); return; }
    const { tx, ty } = this.frontTile();
    const t = this.grid[ty]?.[tx];
    const dive = this.lvl('dive');
    if (t === 'T') {
      this.grid[ty][tx] = 'G';
      this.inv.wood++;
      let extra = '';
      if (Math.random() < 0.25) { this.inv.bark++; extra = ' +1 Vỏ cây đắng'; }
      this.survival.stamina -= 6;
      this.respawnLater(tx, ty, 'T', RESOURCE_RESPAWN);
      this.msg(`+1 Gỗ (chặt cây)${extra}`, COLOR.good);
      this.refreshCell(tx, ty);
      this.gatherCD = 0.6;
    } else if (t === 'S') {
      this.inv.reed++;
      let extra = '';
      if (Math.random() < 0.3) { this.inv.vine++; extra = ' +1 Dây gai'; }
      this.survival.stamina -= 2;
      this.msg(`+1 Sậy (cắt sậy)${extra}`, COLOR.good);
      this.gatherCD = 0.5;
    } else if (t === 'H') {
      this.grid[ty][tx] = 'G';
      this.inv.herb++;
      let got = 1;
      if (this.lvl('herb') >= 5 && Math.random() < 0.3) { this.inv.herb++; got = 2; }
      this.addXp('herb', 5);
      this.survival.stamina -= 2;
      this.respawnLater(tx, ty, 'H', RESOURCE_RESPAWN);
      this.msg(`+${got} Thảo dược (hái lá)`, COLOR.good);
      this.refreshCell(tx, ty);
      this.gatherCD = 0.4;
    } else if (t === 'R') {
      this.grid[ty][tx] = 'G';
      this.inv.stone += 1 + (Math.random() < 0.4 ? 1 : 0);
      let extra = '';
      if (dive >= 5 && Math.random() < 0.15) { this.inv.coral++; extra = ' +1 San hô!'; this.addXp('dive', 4); }
      this.survival.stamina -= 5;
      this.respawnLater(tx, ty, 'R', ROCK_RESPAWN);
      this.msg(`Đập đá lấy đá${extra}`, COLOR.good);
      this.refreshCell(tx, ty);
      this.gatherCD = 0.7;
    } else if (t === 'B' && isFordRow(ty)) {
      if (tideLevel(this.t) > 0.35) {
        this.msg('Triều đang lên — chờ nước rút mới mò được ốc hến.', COLOR.dim);
        this.gatherCD = 0.5;
        return;
      }
      if (Math.random() < 0.03) { this.inv.pearl++; this.msg('Mò được một NGỌC TRAI!', COLOR.gold); }
      else if (Math.random() < 0.6) { this.inv.shell++; this.msg('+1 Ốc hến (triều thấp)', COLOR.good); }
      else this.msg('Mò mãi chẳng thấy gì.', COLOR.dim);
      this.survival.stamina -= 2;
      this.gatherCD = 0.8;
    } else {
      this.msg('Không có gì để thu thập ở đây.', COLOR.dim);
      this.gatherCD = 0.3;
    }
  }

  doAttack() {
    if (this.attackCD > 0) return;
    const id = this.equip.weapon;
    const def = ITEMS[id]?.weapon;
    if (!def) return;
    if (this.survival.stamina < def.cost) { this.msg('Không đủ sức để vung vũ khí.', COLOR.warn); return; }
    const ranged = def.kind === 'ranged';
    if (ranged && this.inv[def.ammo] <= 0) { this.msg('Hết mũi tên!', COLOR.warn); return; }

    const range = def.range;
    let best = null, bestD = range;
    for (const e of [...this.crabs, ...this.snakes]) {
      if (!e.alive) continue;
      const d = Phaser.Math.Distance.Between(this.px, this.py - 6, e.x, e.y - 6);
      if (d >= bestD) continue;
      if (ranged) {
        const dx = (e.x - this.px) / (d || 1), dy = (e.y - (this.py - 6)) / (d || 1);
        if (dx * this.face.x + dy * this.face.y < 0.7) continue; // phải nằm trong hướng nhắm
      }
      bestD = d; best = e;
    }

    this.attackCD = def.cd;
    this.survival.stamina -= def.cost;
    if (ranged) this.inv[def.ammo]--;
    if (!best) {
      this.msg(ranged ? 'Bắn trượt — không có mục tiêu.' : `Vung ${ITEMS[id].name} vào khoảng không.`, COLOR.dim);
      return;
    }

    let dmg = def.dmg;
    if (!ranged) {
      const dive = this.lvl('dive');
      if (dive >= 5) dmg += 5;
      if (dive >= 10) dmg += 5;
      if (def.waterBonus && this.nearWater(1)) dmg += def.waterBonus;
    }
    best.hp -= dmg;
    best.spr.setTint(0xff7070);
    const target = best;
    this.time.delayedCall(120, () => target.spr.clearTint());
    if (best.hp <= 0) {
      this.killEnemy(best, ITEMS[id].name);
    } else {
      this.addXp('dive', 3);
      this.msg(`${ITEMS[id].name} trúng ${best.kind === 'crab' ? 'cua đá' : 'rắn nước'} (-${dmg})!`, COLOR.text);
    }
  }

  killEnemy(e, weaponName) {
    e.alive = false;
    e.spr.setVisible(false);
    e.respawnAt = this.t + (e.kind === 'crab' ? CRAB_RESPAWN : SNAKE_RESPAWN);
    if (e.kind === 'crab') {
      this.inv.cua++;
      this.msg(`Hạ được cua đá bằng ${weaponName}! +1 Thịt cua`, COLOR.good);
    } else {
      this.inv.thitran++;
      this.msg(`Hạ được rắn nước! +1 Thịt rắn`, COLOR.good);
    }
    this.addXp('dive', 10);
  }

  // Tạo ô đặt được ở vị trí đang quay mặt.
  frontTarget() {
    const { tx, ty } = this.frontTile();
    const pt = this.playerTile();
    const t = this.grid[ty]?.[tx];
    if (!(t === 'G' || t === 'B' || t === 'S')) return { ok: false, reason: 'Không thể đặt ở ô này.' };
    if (this.isWater(tx, ty)) return { ok: false, reason: 'Không thể đặt trên nước.' };
    if (tx === pt.tx && ty === pt.ty) return { ok: false, reason: 'Không thể đặt ngay dưới chân.' };
    return { ok: true, tx, ty };
  }

  doFish() {
    if (this.fishCD > 0) return;
    const { tx, ty } = this.frontTile();
    if (!this.isWater(tx, ty)) { this.msg('Phải quay mặt về phía nước để câu.', COLOR.dim); return; }
    this.fishCD = 1.8;
    this.survival.stamina = Math.max(0, this.survival.stamina - 3);
    const fl = this.lvl('fish');
    let chance = Math.min(0.95, 0.7 + 0.02 * fl);
    if (this.survival.insomnia) chance *= 0.5; // thức trắng: tay run, khó câu
    if (Math.random() < chance) {
      this.addXp('fish', 6);
      // Cá vàng chỉ xuất hiện khi nước lớn (tài nguyên theo triều).
      const highTide = tideLevel(this.t) > 0.75;
      if (highTide && Math.random() < 0.12 + 0.01 * fl) {
        this.inv.cagold++;
        this.msg('Nước lớn — câu được CÁ VÀNG hiếm!', COLOR.gold);
      } else {
        this.inv.fish++;
        this.msg('Câu được một con cá sông!', COLOR.good);
      }
    } else {
      this.msg(this.survival.insomnia ? 'Tay run quá, cá tuột mất...' : 'Cá đã chạy mất.', COLOR.dim);
    }
  }

  doDrinkRiver() {
    const { tx, ty } = this.frontTile();
    if (!this.isWater(tx, ty)) { this.msg('Quay mặt về phía nước để uống.', COLOR.dim); return; }
    this.survival.drinkRiver();
    this.msg('Uống nước sông chưa lọc...', COLOR.thirst);
  }

  toggleBoat() {
    if (this.onBoat) {
      if (this.isWater(Math.floor(this.px / TILE), Math.floor((this.py - 2) / TILE))) {
        this.msg('Phải cập bờ trước khi xuống thuyền.', COLOR.warn);
        return;
      }
      this.onBoat = false;
      this.msg('Bạn bước lên bờ.', COLOR.text);
      return;
    }
    if (this.inv.boat <= 0) { this.msg('Chưa có thuyền. Chế Thuyền độc mộc trong menu C.', COLOR.dim); return; }
    if (!this.nearWater(1)) { this.msg('Phải đứng cạnh nước để lên thuyền.', COLOR.dim); return; }
    this.onBoat = true;
    this.msg('Bạn chèo thuyền. Đi trên sông nhanh hơn một chút.', COLOR.good);
  }

  // ---------------- Chế tạo / xây dựng / dùng vật phẩm ----------------

  recipeNeed(r, k) {
    if (r.perk === 'herb15' && k === 'herb' && this.lvl('herb') >= 15) return 1;
    return r.need[k];
  }

  hasIngredients(r) {
    return Object.keys(r.need).every((k) => this.inv[k] >= this.recipeNeed(r, k));
  }

  stationOk(r) {
    return !r.station || this.nearTile(r.station, 2);
  }

  skillOk(r) {
    return !r.skill || this.lvl(r.skill.k) >= r.skill.lv;
  }

  canDoNow(r) {
    return this.hasIngredients(r) && this.stationOk(r) && this.skillOk(r);
  }

  consume(r) {
    for (const k of Object.keys(r.need)) this.inv[k] -= this.recipeNeed(r, k);
  }

  // Mô tả nguyên liệu, trạm và điều kiện cho menu.
  recipeInfo(r) {
    const parts = Object.keys(r.need).map((k) => {
      const need = this.recipeNeed(r, k);
      const have = this.inv[k];
      return `${ITEMS[k].name} ${have}/${need}${have >= need ? '' : ' ✗'}`;
    });
    const extra = [];
    if (r.station) extra.push(`Trạm: ${r.station === 'K' ? 'bếp lửa' : 'giàn phơi'} ${this.stationOk(r) ? '✓' : '✗ (đứng gần)'}`);
    if (r.skill) extra.push(`Cần ${SKILL_NAME[r.skill.k]} Lv${r.skill.lv} ${this.skillOk(r) ? '✓' : '✗'}`);
    return `${recipeDesc(r)}\nNguyên liệu: ${parts.join(' · ')}${extra.length ? '\n' + extra.join(' · ') : ''}`;
  }

  craftRecipe(r) {
    if (!this.hasIngredients(r)) { this.msg('Thiếu nguyên liệu để chế.', COLOR.warn); return false; }
    if (!this.stationOk(r)) { this.msg('Phải đứng gần trạm cần thiết.', COLOR.warn); return false; }
    if (!this.skillOk(r)) { this.msg('Chưa đủ cấp kỹ năng.', COLOR.warn); return false; }
    this.consume(r);
    this.inv[r.out] += r.n;
    if (['medicine', 'food'].includes(ITEMS[r.out].cat)) this.addXp('herb', 2);
    this.msg(`Đã chế ${ITEMS[r.out].name}${r.n > 1 ? ' x' + r.n : ''}.`, COLOR.good);
    return true;
  }

  placeRecipe(r) {
    const tgt = this.frontTarget();
    if (!tgt.ok) { this.msg(tgt.reason, COLOR.dim); return false; }
    if (!this.hasIngredients(r)) { this.msg('Thiếu nguyên liệu để xây.', COLOR.warn); return false; }
    this.consume(r);
    this.grid[tgt.ty][tgt.tx] = r.place;
    this.refreshCell(tgt.tx, tgt.ty);
    this.msg(`Đã dựng ${r.name}.`, COLOR.good);
    if (r.place === 'P') {
      if (distToRiver(tgt.tx) <= PLATFORM_MAX_D) this.msg('⚠ Ô này ngập khi triều cường — sàn sẽ bị cuốn trôi!', COLOR.warn);
      else this.msg('Sàn tre cao hơn mực triều — an toàn.', COLOR.good);
    }
    return true;
  }

  // Dùng vật phẩm (ăn/uống/thuốc). Trả về true nếu đã dùng.
  useItem(id) {
    const def = ITEMS[id];
    if (!def?.use || this.inv[id] <= 0) return false;
    if (id === 'remedy' && !this.survival.ill) { this.msg('Bạn không đang đau ốm.', COLOR.dim); return false; }
    if (id === 'feverMed' && !this.survival.malaria) { this.msg('Bạn không bị sốt rét.', COLOR.dim); return false; }
    this.inv[id]--;
    this.survival.applyEffect(def.use);
    this.msg(`Dùng ${def.name}.`, COLOR.good);
    if (def.risk && Math.random() < def.risk.p) this.survival.addStatus(def.risk.type, def.risk.secs);
    return true;
  }

  quickUse(ids, emptyMsg) {
    for (const id of ids) {
      if (this.inv[id] > 0) { if (this.useItem(id)) return; else return; }
    }
    this.msg(emptyMsg, COLOR.dim);
  }

  equipItem(id) {
    const def = ITEMS[id];
    if (def.weapon) {
      this.equip.weapon = id;
      this.msg(`Cầm ${def.name}.`, COLOR.text);
    } else if (def.slot) {
      this.equip[def.slot] = this.equip[def.slot] === id ? null : id;
      this.msg(this.equip[def.slot] ? `Mặc ${def.name}.` : `Cởi ${def.name}.`, COLOR.text);
    }
  }

  doSleep() {
    if (this.busy) return;
    const { tx, ty } = this.playerTile();
    const here = this.grid[ty]?.[tx];
    const sheltered = here === 'F';
    const safe = here === 'F' || here === 'P';
    this.busy = true;
    this.msg(safe ? 'Lên giường nhà sàn...' : 'Nằm ngủ tạm ngoài trời...', COLOR.dim);
    const cam = this.cameras.main;
    cam.fadeOut(500, 10, 20, 40);
    cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      let target = nextLowTide(this.t);
      if (target - this.t < 20) target += TIDE_PERIOD;
      const skipped = target - this.t;
      this.t = target;
      this.survival.sleep(sheltered);
      this.msg(`Ngủ ${Math.round(skipped)} giây — triều đã đổi chiều.`, COLOR.good);
      if (!safe) {
        if (Math.random() < 0.5) {
          const keys = Object.keys(this.inv).filter((k) => this.inv[k] > 0 && RESOURCE_CATS.has(ITEMS[k].cat));
          if (keys.length) {
            const k = Phaser.Utils.Array.GetRandom(keys);
            this.inv[k]--;
            this.msg(`⚠ Ngủ ngoài trời, bị trộm mất 1 ${ITEMS[k].name}!`, COLOR.warn);
          }
        }
        this.msg('Dậy mệt rã rời...', COLOR.warn);
      }
      cam.fadeIn(500, 10, 20, 40);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => { this.busy = false; });
    });
  }

  // ---------------- Menu ----------------

  buildMenuItems(mode) {
    if (mode === 'craft') {
      return RECIPES.filter((r) => !r.build).map((r) => ({
        label: `${recipeName(r)}${r.n > 1 ? ' x' + r.n : ''}`,
        ok: this.canDoNow(r),
        detail: this.recipeInfo(r),
        data: r,
      }));
    }
    if (mode === 'build') {
      const tgt = this.frontTarget();
      return RECIPES.filter((r) => r.build).map((r) => ({
        label: recipeName(r),
        ok: this.hasIngredients(r) && tgt.ok,
        detail: `${this.recipeInfo(r)}\nÔ đặt: ${tgt.ok ? 'hợp lệ — Enter để đặt' : tgt.reason}`,
        data: r,
      }));
    }
    // Túi đồ
    const items = [];
    for (const id of Object.keys(ITEMS)) {
      if (this.inv[id] <= 0) continue;
      const d = ITEMS[id];
      let tag = '';
      if (d.weapon && this.equip.weapon === id) tag = '  [đang cầm]';
      if (d.slot && this.equip[d.slot] === id) tag = '  [đang mặc]';
      if (d.vehicle && this.onBoat) tag = '  [đang lái]';
      let act = '';
      if (d.use) act = 'Enter: dùng';
      else if (d.weapon) act = 'Enter: cầm';
      else if (d.slot) act = 'Enter: mặc / cởi';
      else if (d.vehicle) act = 'Enter: lên / xuống thuyền (hoặc phím O)';
      const effects = d.use ? Object.entries(d.use).map(([k, v]) => `${k}:${Array.isArray(v) ? v.join(',') : v}`).join(' ') : '';
      items.push({
        label: `${d.name} x${this.inv[id]}${tag}`,
        ok: true,
        detail: `${d.desc}\n${act}${effects ? '  · hiệu quả: ' + effects : ''}`,
        data: id,
      });
    }
    return items.length ? items : [{ label: 'Túi đồ trống.', ok: false, detail: 'Hãy đi hái, chặt, câu cá...', data: null }];
  }

  openMenu(mode) {
    this.menuMode = mode;
    this.menu.show(this.buildMenuItems(mode), '↑↓ / W S chọn · Enter thực hiện · Esc hoặc phím mở để đóng', MENU_TITLE[mode]);
  }

  closeMenu() {
    this.menuMode = null;
    this.menu.close();
  }

  toggleMenu(mode) {
    if (this.menu.open && this.menuMode === mode) this.closeMenu();
    else this.openMenu(mode);
  }

  refreshMenu() {
    this.menu.setItems(this.buildMenuItems(this.menuMode));
  }

  menuActivate() {
    const it = this.menu.current();
    if (!it || it.data == null) return;
    if (this.menuMode === 'craft') this.craftRecipe(it.data);
    else if (this.menuMode === 'build') this.placeRecipe(it.data);
    else {
      const id = it.data;
      const d = ITEMS[id];
      if (d.use) this.useItem(id);
      else if (d.weapon || d.slot) this.equipItem(id);
      else if (d.vehicle) this.toggleBoat();
      else this.msg('Vật phẩm này dùng để chế tạo hoặc xây dựng.', COLOR.dim);
    }
    this.refreshMenu();
  }

  handleMenuInput() {
    const J = Phaser.Input.Keyboard.JustDown;
    const k = this.keys, c = this.cursors;
    if (J(c.up) || J(k.W)) this.menu.move(-1);
    if (J(c.down) || J(k.S)) this.menu.move(1);
    if (J(k.ENTER)) this.menuActivate();
    if (J(k.ESC)) this.closeMenu();
    if (J(k.C)) this.toggleMenu('craft');
    if (J(k.B)) this.toggleMenu('build');
    if (J(k.I)) this.toggleMenu('inv');
  }

  // ---------------- Phím tắt trong thế giới ----------------

  handleActions() {
    const k = this.keys;
    const J = Phaser.Input.Keyboard.JustDown;
    if (J(k.H)) this.helpVisible = !this.helpVisible;
    if (J(k.C)) this.toggleMenu('craft');
    if (J(k.B)) this.toggleMenu('build');
    if (J(k.I)) this.toggleMenu('inv');
    if (J(k.V)) this.cycleWeapon();
    if (J(k.O)) this.toggleBoat();
    if (J(k.SPACE)) this.doGather();
    if (J(k.X)) this.doAttack();
    if (J(k.F)) this.doFish();
    if (J(k.E)) this.doDrinkRiver();
    if (J(k.ONE)) this.quickUse(['cafish', 'fish'], 'Không có cá.');
    if (J(k.TWO)) this.quickUse(['cuanuong', 'cua', 'thitran'], 'Không có thịt để ăn.');
    if (J(k.THREE)) this.quickUse(['cagold'], 'Không có cá vàng.');
    if (J(k.Q)) this.quickUse(['remedy'], 'Không có Nước Lá Rừng.');
    if (J(k.N)) this.quickUse(['feverMed'], 'Không có Thuốc Sốt.');
    if (J(k.T)) this.cookFish();
    if (J(k.R)) this.doSleep();
  }

  cookFish() {
    if (!this.nearTile('K', 2)) { this.msg('Phải đứng gần bếp lửa để nướng cá.', COLOR.dim); return; }
    if (this.inv.fish <= 0) { this.msg('Không có cá sống để nướng.', COLOR.dim); return; }
    this.craftRecipe(RECIPES.find((r) => r.out === 'cafish'));
  }

  // ---------------- Di chuyển ----------------

  handleMovement(dt) {
    const k = this.keys, c = this.cursors;
    let dx = 0, dy = 0;
    if (c.left.isDown || k.A.isDown) dx -= 1;
    if (c.right.isDown || k.D.isDown) dx += 1;
    if (c.up.isDown || k.W.isDown) dy -= 1;
    if (c.down.isDown || k.S.isDown) dy += 1;
    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      const len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
      this.face = { x: dx, y: dy };
      // Ưu tiên hướng chính để quay mặt rõ ràng.
      if (Math.abs(dx) > Math.abs(dy) * 1.5) this.face = { x: Math.sign(dx), y: 0 };
      else if (Math.abs(dy) > Math.abs(dx) * 1.5) this.face = { x: 0, y: Math.sign(dy) };
    }
    this.sprinting = this.moving && k.SHIFT.isDown && this.survival.stamina > 5 && this.survival.hunger > 0;
    const armor = this.armorMods();
    let speed = WALK_SPEED * this.survival.speedMult() * armor.speed;
    if (this.sprinting) speed *= SPRINT_MULT;
    if (this.onBoat) speed *= BOAT_SPEED_MULT;
    this.movePlayer(dx * speed * dt, dy * speed * dt);
  }

  // ---------------- Vòng lặp ----------------

  update(_time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.animT += dt;
    if (this.animT >= 0.22) { this.animT = 0; this.animFrame = (this.animFrame + 1) % 4; }

    if (this.dead) {
      this.deadT -= dt;
      if (this.deadT <= 0) this.revive();
      this.updateHud();
      return;
    }
    if (this.busy) {
      this.updateHud();
      return;
    }
    // Khi đang mở menu, thế giới tạm dừng.
    if (this.menu.open) {
      this.handleMenuInput();
      this.updateHud();
      return;
    }

    this.t += dt;
    this.attackCD = Math.max(0, this.attackCD - dt);
    this.fishCD = Math.max(0, this.fishCD - dt);
    this.gatherCD = Math.max(0, this.gatherCD - dt);
    this.wetT = Math.max(0, this.wetT - dt);

    this.updateTide();
    this.updateWeather(dt);
    this.processRespawns();

    this.handleActions();
    if (this.menu.open) { this.updateHud(); return; }
    this.handleMovement(dt);

    // Đồng bộ vị trí nhân vật + hoạt ảnh đi bộ.
    if (this.moving) this.walkT += dt; else this.walkT = 0;
    this.player.setPosition(this.px, this.py);
    this.player.setFrame(this.moving ? String(Math.floor(this.walkT / 0.18) % 2) : '0');
    this.player.setFlipX(this.face.x < 0);
    this.player.setTint(this.onBoat ? 0xbfe6ff : 0xffffff);

    // Muỗi: ban đêm ven sông, ngoài nhà, không có đèn xua muỗi → có thể đốt.
    const { tx, ty } = this.playerTile();
    const here = this.grid[ty]?.[tx];
    const night = this.darkness() > 0.5;
    if (night && here !== 'F' && distToRiver(tx) <= MOSQUITO_RANGE && !this.survival.malaria && !this.nearTile('LM', LAMP_RANGE)) {
      this.mosqT -= dt;
      if (this.mosqT <= 0) {
        this.mosqT = 12 + Math.random() * 10;
        this.survival.bitten();
      }
    }

    // Sinh tồn
    const nearFire = this.nearTile('K', 2);
    this.survival.update(dt, {
      moving: this.moving,
      sprinting: this.sprinting,
      raining: this.raining,
      sheltered: here === 'F',
      night,
      sunny: !this.raining && this.clock().hour >= 6 && this.clock().hour < 18,
      wet: this.wetT > 0,
      sleeping: false,
      nearFire,
      armor: this.armorMods(),
    });
    for (const ev of this.survival.flashEvents()) this.handleSurvivalEvent(ev);

    this.updateEnemies(dt);
    this.updateFx(dt);

    if (this.survival.hp <= 0) this.die();
    this.updateHud();
  }

  handleSurvivalEvent(ev) {
    switch (ev.type) {
      case 'sick':
        this.msg('Bạn bị CẢM TRIỀU! Thân nhiệt quá thấp. Uống Nước Lá Rừng (Q) hoặc Trà gừng.', COLOR.hp);
        break;
      case 'poison':
        this.msg('Trúng NƯỚC ĐỘC! Máu đang mất dần. Cần Nước Lá Rừng (Q) hoặc Viên than hoạt.', COLOR.hp);
        break;
      case 'fishpoison':
        this.msg('Ngộ độc cá sống! Buồn nôn, mất máu dần.', COLOR.hp);
        break;
      case 'bite':
        this.msg('Muỗi đốt bạn ven sông ban đêm...', COLOR.dim);
        break;
      case 'malaria':
        this.msg('Bạn bị SỐT RÉT! Sốt cao theo từng cơn. Cần Thuốc Sốt (N).', COLOR.hp);
        break;
      default:
        break;
    }
  }

  processRespawns() {
    this.respawns = this.respawns.filter((r) => {
      if (this.t < r.at) return true;
      if (this.grid[r.ty][r.tx] === 'G') {
        this.grid[r.ty][r.tx] = r.type;
        this.refreshCell(r.tx, r.ty);
      }
      return false;
    });
  }

  // ---------------- Sinh vật: cua đá & rắn nước ----------------

  updateEnemies(dt) {
    const alivePlayer = !this.dead;
    for (const c of this.crabs) {
      if (!c.alive) {
        if (this.t >= c.respawnAt) this.spawnCrab(c);
        continue;
      }
      c.cool = Math.max(0, c.cool - dt);
      c.spikeCD = Math.max(0, c.spikeCD - dt);
      const dist = Phaser.Math.Distance.Between(this.px, this.py, c.x, c.y);
      let sx = 0, sy = 0;
      if (alivePlayer && dist < 56) {
        const ang = Math.atan2(this.py - c.y, this.px - c.x);
        sx = Math.cos(ang) * 20; sy = Math.sin(ang) * 20;
      } else {
        c.turnT -= dt;
        if (c.turnT <= 0) {
          const a = Math.random() * Math.PI * 2;
          c.dir = { x: Math.cos(a), y: Math.sin(a) };
          c.turnT = 1.5 + Math.random() * 2;
        }
        sx = c.dir.x * 10; sy = c.dir.y * 10;
      }
      const before = { x: c.x, y: c.y };
      if (!this.collides(c.x + sx * dt, c.y)) c.x += sx * dt;
      if (!this.collides(c.x, c.y + sy * dt)) c.y += sy * dt;
      if (before.x === c.x && before.y === c.y) c.turnT = 0; // kẹt thì đổi hướng
      c.spr.setPosition(c.x, c.y).setFlipX(sx < 0);

      // Cọc nhọn đâm cua đi sát
      const { tx, ty } = { tx: Math.floor(c.x / TILE), ty: Math.floor((c.y - 4) / TILE) };
      if (c.spikeCD <= 0 && this.nearTile('SP', 1) && this.isSpikeAt(tx, ty)) {
        c.spikeCD = 1.5;
        c.hp -= SPIKE_DMG;
        if (c.hp <= 0) this.killEnemy(c, 'cọc nhọn');
      }

      // Cắn khi đủ gần
      if (c.alive && alivePlayer && dist < 14 && c.cool <= 0) {
        c.cool = 1.5;
        const dmg = 8 * this.armorMods().dmgTaken;
        this.survival.hp = Math.max(0, this.survival.hp - dmg);
        this.msg(`Cua đá kẹp bạn! -${Math.round(dmg)} máu`, COLOR.hp);
        this.cameras.main.shake(120, 0.003);
      }
    }

    for (const s of this.snakes) {
      if (!s.alive) {
        if (this.t >= s.respawnAt) this.spawnSnake(s);
        continue;
      }
      s.cool = Math.max(0, s.cool - dt);
      // Rắn chỉ bơi trong nước; nước rút thì tìm lại sông.
      if (!this.isWater(Math.floor(s.x / TILE), Math.floor(s.y / TILE))) {
        const p = this.nearestWater(s.x, s.y);
        s.x = p.x; s.y = p.y;
      }
      const dist = Phaser.Math.Distance.Between(this.px, this.py, s.x, s.y);
      let sx = 0, sy = 0;
      if (alivePlayer && dist < 70) {
        const ang = Math.atan2(this.py - s.y, this.px - s.x);
        sx = Math.cos(ang) * 26; sy = Math.sin(ang) * 26;
      } else {
        s.turnT -= dt;
        if (s.turnT <= 0) {
          const a = Math.random() * Math.PI * 2;
          s.dir = { x: Math.cos(a), y: Math.sin(a) };
          s.turnT = 1.5 + Math.random() * 2;
        }
        sx = s.dir.x * 12; sy = s.dir.y * 12;
      }
      const nx = s.x + sx * dt, ny = s.y + sy * dt;
      if (this.isWater(Math.floor(nx / TILE), Math.floor(s.y / TILE))) s.x = nx;
      if (this.isWater(Math.floor(s.x / TILE), Math.floor(ny / TILE))) s.y = ny;
      s.spr.setPosition(s.x, s.y).setFlipX(sx < 0);

      if (alivePlayer && dist < 12 && s.cool <= 0) {
        s.cool = 2;
        const dmg = 10 * this.armorMods().dmgTaken;
        this.survival.hp = Math.max(0, this.survival.hp - dmg);
        this.survival.addStatus('poison', 6);
        this.msg(`Rắn nước cắn bạn! -${Math.round(dmg)} máu và trúng độc`, COLOR.hp);
        this.cameras.main.shake(150, 0.004);
      }
    }
  }

  isSpikeAt(tx, ty) {
    for (let y = ty - 1; y <= ty + 1; y++) {
      for (let x = tx - 1; x <= tx + 1; x++) {
        if (this.grid[y]?.[x] === 'SP') return true;
      }
    }
    return false;
  }

  spawnCrab(c) {
    for (let tries = 0; tries < 200; tries++) {
      const tx = 32 + Phaser.Math.Between(-12, 12);
      const ty = Phaser.Math.Between(2, MAP_H - 3);
      const d = distToRiver(tx);
      if (d < 3 || d > 12) continue;
      if (this.blocked(tx, ty)) continue;
      const t = this.grid[ty][tx];
      if (t !== 'B' && t !== 'S' && t !== 'G') continue;
      if (Phaser.Math.Distance.Between(tx * TILE, ty * TILE, this.px, this.py) < 80) continue;
      c.x = tx * TILE + 8; c.y = ty * TILE + 12;
      c.hp = c.maxHp; c.alive = true; c.turnT = 0;
      c.spr.setVisible(true).setPosition(c.x, c.y);
      return;
    }
    c.respawnAt = this.t + 5;
  }

  spawnSnake(s) {
    for (let tries = 0; tries < 200; tries++) {
      const tx = 32 + Phaser.Math.Between(-3, 3);
      const ty = Phaser.Math.Between(2, MAP_H - 3);
      if (!this.isWater(tx, ty)) continue;
      const x = tx * TILE + 8, y = ty * TILE + 8;
      if (Phaser.Math.Distance.Between(x, y, this.px, this.py) < 90) continue;
      s.x = x; s.y = y; s.hp = s.maxHp; s.alive = true; s.turnT = 0;
      s.spr.setVisible(true).setPosition(s.x, s.y);
      return;
    }
    s.respawnAt = this.t + 5;
  }

  // ---------------- Hiệu ứng ----------------

  updateFx(dt) {
    const cam = this.cameras.main;
    const v = cam.worldView;
    const cx = v.centerX, cy = v.centerY;

    // Đêm
    const dark = Phaser.Math.Clamp((this.darkness() - 0.3) / 0.7, 0, 1);
    let alpha = dark * 0.55 + (this.raining ? 0.1 : 0);
    if (this.survival.insomnia) alpha += 0.06 + 0.04 * Math.sin(this.t * 17);
    this.night.setPosition(cx, cy).setSize(v.width + 40, v.height + 40).setAlpha(Phaser.Math.Clamp(alpha, 0, 0.85));

    // Mưa
    this.rainG.clear();
    if (this.raining) {
      this.rainG.lineStyle(1, 0x9fc7e0, 0.45);
      for (const d of this.drops) {
        d.y += dt * 1.1 * d.s;
        d.x -= dt * 0.12 * d.s;
        if (d.y > 1) { d.y = 0; d.x = Math.random() + 0.1; }
        if (d.x < 0) d.x += 1;
        const x = v.x + d.x * v.width;
        const y = v.y + d.y * v.height;
        this.rainG.lineBetween(x, y, x - 3, y + 7);
      }
    }

    // Thức trắng: màn hình rung định kỳ (mỗi 15 giây).
    if (this.survival.insomnia && this.t - (this.lastShakeT ?? 0) > 15) {
      this.lastShakeT = this.t;
      cam.shake(300, 0.004);
    }
  }

  // ---------------- Chết / hồi sinh ----------------

  die() {
    this.dead = true;
    this.deadT = 3.5;
    this.onBoat = false;
    this.msg('Bạn đã gục ngã vì kiệt sức...', COLOR.hp);
  }

  revive() {
    this.dead = false;
    this.survival.reviveAtHouse();
    for (const k of Object.keys(this.inv)) {
      if (RESOURCE_CATS.has(ITEMS[k].cat)) this.inv[k] = Math.floor(this.inv[k] / 2);
    }
    this.px = (HOUSE.x + Math.floor(HOUSE.w / 2)) * TILE + 8;
    this.py = (HOUSE.y + HOUSE.h + 1) * TILE + 12;
    this.wetT = 0;
    this.msg('Người dân làng nhặt bạn về nhà sàn. Mất một nửa vật phẩm thường.', COLOR.warn);
  }

  // ---------------- HUD ----------------

  drawBar(g, x, y, w, h, ratio, color) {
    g.fillStyle(0x05121f, 0.9);
    g.fillRect(x, y, w, h);
    const fw = Math.max(0, Math.round((w - 4) * Phaser.Math.Clamp(ratio, 0, 1)));
    if (fw > 0) {
      g.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
      g.fillRect(x + 2, y + 2, fw, h - 4);
      g.fillStyle(0xffffff, 0.25);
      g.fillRect(x + 2, y + 2, fw, 1);
    }
    g.lineStyle(2, 0x000000, 1);
    g.strokeRect(x, y, w, h);
  }

  invLines() {
    const lines = ['TÚI ĐỒ  (I)'];
    const nonzero = Object.keys(ITEMS).filter((id) => this.inv[id] > 0 && ITEMS[id].cat !== 'weapon' && ITEMS[id].cat !== 'armor' && ITEMS[id].cat !== 'vehicle');
    const shown = nonzero.slice(0, 12);
    for (const id of shown) lines.push(`${ITEMS[id].name}: ${this.inv[id]}`);
    if (nonzero.length > shown.length) lines.push(`… +${nonzero.length - shown.length} loại khác`);
    lines.push(`Cầm: ${ITEMS[this.equip.weapon].name}${this.onBoat ? '  · đang lái thuyền' : ''}`);
    const worn = ['head', 'body', 'feet'].map((s) => this.equip[s] ? ITEMS[this.equip[s]].name : null).filter(Boolean);
    lines.push(`Mặc: ${worn.length ? worn.join(', ') : 'không có'}`);
    lines.push(`Kỹ năng: Lặn ${this.lvl('dive')} · Thảo dược ${this.lvl('herb')} · Chài ${this.lvl('fish')}`);
    return lines.join('\n');
  }

  updateHud() {
    const s = this.survival;
    const g = this.hudG;
    g.clear();
    const menuOpen = this.menu.open;

    // Ẩn chữ HUD khi đang mở menu
    for (const t of this.hudTexts) t.setVisible(!menuOpen);
    if (menuOpen) {
      this.menu.render(g);
      this.helpPanel.setVisible(false);
      this.deadText.setVisible(false);
      return;
    }

    // Máu (góc trên trái)
    this.drawBar(g, 16, 36, 180, 10, s.hp / 100, COLOR.hp);
    this.hpText.setText(`MÁU ${Math.ceil(s.hp)}`);

    // 4 thanh sinh tồn (góc dưới trái)
    const bars = [
      [s.hunger, COLOR.hunger],
      [s.thirst, COLOR.thirst],
      [s.stamina, COLOR.stamina],
      [s.temp, s.temp < 35 ? '#d64545' : COLOR.temp],
    ];
    bars.forEach(([v, col], i) => {
      const y = VIEW_H - 120 + i * 26;
      this.drawBar(g, 130, y + 2, 160, 14, v / 100, col);
      this.statValues[i].setText(`${Math.ceil(v)}`);
    });

    // Tình trạng
    const flags = [];
    if (s.sick) flags.push('CẢM TRIỀU');
    if (s.poisonT > 0) flags.push('NƯỚC ĐỘC');
    if (s.fishPoisonT > 0) flags.push('NGỘ ĐỘC CÁ');
    if (s.malaria) flags.push(s.feverNow ? 'SỐT RÉT (đang sốt cao!)' : 'SỐT RÉT');
    if (s.insomnia) flags.push('THỨC TRẮNG');
    if (this.wetT > 0) flags.push('ƯỚT');
    if (this.nearTile('K', 2)) flags.push('ẤM BẾP LỬA');
    if (this.onBoat) flags.push('TRÊN THUYỀN');
    this.statusText.setText(flags.join('  ·  '));

    // Đồng hồ + thời tiết
    const c = this.clock();
    const hh = String(c.hh).padStart(2, '0');
    const mm = String(c.mm).padStart(2, '0');
    this.clockText.setText(`NGÀY ${c.day}  ·  ${hh}:${mm}  ·  ${this.raining ? 'MƯA' : 'TRỜI QUANG'}`);

    // Triều (góc trên phải)
    const rising = tideRising(this.t);
    const level = tideLevel(this.t);
    this.tideTitle.setText(`TRIỀU ${rising ? 'LÊN ▲' : 'XUỐNG ▼'}  ${Math.round(level * 100)}%`);
    this.tideInfo.setText(`Mép nước: cách sông ${this.halfW.toFixed(1)} ô`);
    this.drawBar(g, VIEW_W - 196, 60, 180, 10, level, COLOR.thirst);
    const dangerLevel = (PLATFORM_MAX_D + 0.5 - 1) / 4.5;
    const markX = VIEW_W - 196 + 2 + Math.round((180 - 4) * dangerLevel);
    g.lineStyle(2, 0xff6b35, 1);
    g.lineBetween(markX, 56, markX, 74);

    // Nhật ký
    for (let i = 0; i < this.logTexts.length; i++) {
      const entry = this.log[i];
      const t = this.logTexts[i];
      if (!entry) { t.setText(''); continue; }
      const age = this.t - entry.t;
      const a = age < 6 ? 1 : Phaser.Math.Clamp(1 - (age - 6) / 3, 0.25, 1);
      t.setText(entry.text).setColor(entry.color).setAlpha(a);
    }

    this.invText.setText(this.invLines());
    this.helpPanel.setVisible(this.helpVisible);
    this.helpText.setText('H: điều khiển · C: chế tạo · B: xây dựng · I: túi đồ · Space: hái · X: đánh · F: câu · E: uống · R: ngủ');
    this.deadText.setVisible(this.dead).setText('BẠN ĐÃ GỤC NGÃ\nĐang được đưa về nhà sàn...');
    if (this.dead) {
      g.fillStyle(0x000000, 0.45);
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }
}
