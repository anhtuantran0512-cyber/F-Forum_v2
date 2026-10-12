import Phaser from 'phaser';
import { TILE, TILE_FRAME } from '../art.js';
import {
  buildMap, MAP_W, MAP_H, HOUSE, DAY_LENGTH,
  tideLevel, tideHalfWidth, tideRising, nextLowTide, isFordRow, distToRiver, TIDE_PERIOD,
} from '../world.js';
import { Survival } from '../survival.js';

const VIEW_W = 1280;
const VIEW_H = 720;
const ZOOM = 3;
const WALK_SPEED = 62;     // px thế giới / giây
const SPRINT_MULT = 1.55;
const SEED = 2026;
const CRAB_COUNT = 3;
const CRAB_RESPAWN = 25;
const RESOURCE_RESPAWN = 90;
const PLATFORM_MAX_D = 5;  // khoảng cách tối đa từ tâm sông mà mực triều cường có thể tới
const MOSQUITO_RANGE = 8;  // muỗi hoạt động trong phạm vi này quanh sông

const SKILL_NAME = { dive: 'Lặn', herb: 'Thảo dược', fish: 'Chài lưới' };

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
    this.inv = {
      wood: 2, reed: 4, herb: 1, fish: 0, cafish: 0, goldfish: 0,
      cua: 0, remedy: 0, feverMed: 0,
    };
    this.skills = { dive: 0, herb: 0, fish: 0 }; // XP; cấp = floor(XP / 20), tối đa 20
    this.hasSpear = false;
    this.weapon = 0;          // 0 = mã tấu, 1 = giáo
    this.hud = [];
    this.helpVisible = true;

    this.createTiles();
    this.createPlayer();
    this.createCrabs();
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
    this.msg('Nhấn H để xem điều khiển.', COLOR.dim);
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

  createCrabs() {
    this.crabs = [];
    for (let i = 0; i < CRAB_COUNT; i++) {
      const spr = this.add.sprite(0, 0, 'crab').setOrigin(0.5, 1).setDepth(9).setVisible(false);
      this.crabs.push({ spr, x: 0, y: 0, hp: 25, alive: false, dir: { x: 1, y: 0 }, turnT: 0, respawnAt: i * 4 + 2, cool: 0 });
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

    this.txt = (x, y, str, size = 14, color = COLOR.text, origin = [0, 0]) => {
      const t = this.add.text(x, y, str, {
        fontFamily: 'monospace', fontSize: `${size}px`, color, stroke: '#05121f', strokeThickness: 3,
      }).setOrigin(origin[0], origin[1]).setDepth(200);
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

    this.statLabels = [
      this.txt(16, VIEW_H - 120, 'NO BỤNG', 13, COLOR.hunger),
      this.txt(16, VIEW_H - 94, 'KHÁT', 13, COLOR.thirst),
      this.txt(16, VIEW_H - 68, 'THỂ LỰC', 13, COLOR.stamina),
      this.txt(16, VIEW_H - 42, 'THÂN NHIỆT', 13, COLOR.temp),
    ];
    this.statValues = [];
    for (let i = 0; i < 4; i++) this.statValues.push(this.txt(298, VIEW_H - 120 + i * 26, '', 13, COLOR.dim));

    this.invText = this.txt(VIEW_W - 16, VIEW_H - 262, '', 14, COLOR.text, [1, 0]);
    this.helpText = this.txt(VIEW_W / 2, VIEW_H - 16, '', 13, COLOR.dim, [0.5, 1]);
    this.helpPanel = this.txt(VIEW_W / 2, VIEW_H / 2, '', 16, COLOR.text, [0.5, 0.5]);
    this.deadText = this.txt(VIEW_W / 2, VIEW_H / 2, '', 26, COLOR.hp, [0.5, 0.5]);
    this.deadText.setVisible(false);

    this.helpPanel.setText([
      'ĐIỀU KHIỂN',
      '',
      'WASD / Mũi tên   Đi bộ            Shift  Chạy (tốn thể lực)',
      'Space            Hái / chặt / cắt  X      Đánh (vũ khí đang cầm)',
      'V                Đổi vũ khí (mã tấu / giáo)',
      'G                Chế giáo (3 gỗ + 2 sậy) — giáo mạnh khi đứng cạnh nước',
      'F                Câu cá (quay mặt về nước; cá vàng khi nước lớn)',
      'E                Uống nước sông (CÓ THỂ trúng nước độc!)',
      '1 / 2 / 3        Ăn cá (nướng ưu tiên) / ăn cua / ăn cá vàng',
      'K                Dựng bếp lửa (2 gỗ + 2 sậy) — sưởi ấm, nướng cá',
      'T                Nướng cá sống (đứng gần bếp lửa)',
      'C                Chế Nước Lá Rừng (2 thảo dược + 1 sậy)',
      'Q                Uống Nước Lá Rừng (chữa bệnh cơ bản)',
      'M                Pha Thuốc Sốt (3 thảo dược + 1 gỗ, cần Thảo dược Lv10)',
      'N                Uống Thuốc Sốt (chữa sốt rét)',
      'B                Dựng sàn tre (3 sậy + 2 gỗ) ở ô đang quay mặt',
      'R                Ngủ (nhà sàn an toàn hơn; ngủ tới lúc triều xuống)',
      'H                Ẩn/hiện bảng này',
      '',
      'Mẹo: triều cường ngập tới ~5 ô từ sông — đừng dựng sàn gần mép nước.',
      'Muỗi bay quanh bờ sông ban đêm — ở trong nhà sàn để tránh sốt rét.',
    ].join('\n'));
    this.helpPanel.setBackgroundColor('rgba(5,18,31,0.85)');
    this.helpPanel.setPadding(20, 16, 20, 16);
  }

  createInput() {
    const KC = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard;
    this.cursors = kb.createCursorKeys();
    this.keys = kb.addKeys({
      W: KC.W, A: KC.A, S: KC.S, D: KC.D,
      SPACE: KC.SPACE, SHIFT: KC.SHIFT,
      X: KC.X, F: KC.F, E: KC.E, Q: KC.Q, C: KC.C, B: KC.B, R: KC.R, H: KC.H,
      V: KC.V, G: KC.G, K: KC.K, T: KC.T, M: KC.M, N: KC.N,
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

  blocked(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return true;
    const t = this.grid[ty][tx];
    if (t === 'T' || t === 'R' || t === 'X' || t === 'K') return true;
    return this.isWater(tx, ty);
  }

  // Hộp va chạm: x±4, y-4..y (y là đáy chân).
  collides(x, y) {
    const l = Math.floor((x - 4) / TILE), r = Math.floor((x + 3.99) / TILE);
    const top = Math.floor((y - 4) / TILE), bot = Math.floor((y - 0.01) / TILE);
    for (let ty = top; ty <= bot; ty++) {
      for (let tx = l; tx <= r; tx++) {
        if (this.blocked(tx, ty)) return true;
      }
    }
    return false;
  }

  movePlayer(dx, dy) {
    if (!this.collides(this.px + dx, this.py)) this.px += dx;
    if (!this.collides(this.px, this.py + dy)) this.py += dy;
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
    switch (t) {
      case 'G': return ((tx * 7 + ty * 13) % 5 === 0) ? TILE_FRAME.GRASS2 : TILE_FRAME.GRASS1;
      case 'B': return (isFordRow(ty) || distToRiver(tx) >= 4) ? TILE_FRAME.SAND : TILE_FRAME.MUD;
      case 'S': return TILE_FRAME.REED;
      case 'T': return TILE_FRAME.TREE;
      case 'R': return TILE_FRAME.ROCK;
      case 'H': return TILE_FRAME.HERB;
      case 'P': return TILE_FRAME.PLANK;
      case 'X': return TILE_FRAME.WALL;
      case 'F': return TILE_FRAME.FLOOR;
      case 'K': return TILE_FRAME.FIRE;
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

    // Người chơi đang đứng trong nước → bị đẩy về bờ và ướt.
    if (this.isWater(Math.floor(this.px / TILE), Math.floor((this.py - 2) / TILE))) {
      const p = this.nearestLand(this.px, this.py);
      this.px = p.x; this.py = p.y;
      this.wetT = 4;
      this.msg('Nước lên! Bạn bị cuốn về bờ, người ướt sũng.', COLOR.warn);
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

  // ---------------- Kỹ năng ----------------

  lvl(k) {
    return Math.min(20, Math.floor(this.skills[k] / 20));
  }

  addXp(k, n) {
    const before = this.lvl(k);
    this.skills[k] += n;
    const after = this.lvl(k);
    if (after > before) this.msg(`Kỹ năng ${SKILL_NAME[k]} lên cấp ${after}!`, COLOR.gold);
  }

  // ---------------- Hành động ----------------

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
    if (this.survival.stamina < 4) { this.msg('Quá mệt để làm việc...', COLOR.warn); return; }
    const { tx, ty } = this.frontTile();
    const t = this.grid[ty]?.[tx];
    if (t === 'T') {
      this.grid[ty][tx] = 'G';
      this.inv.wood++;
      this.survival.stamina -= 6;
      this.respawnLater(tx, ty, 'T', RESOURCE_RESPAWN);
      this.msg('+1 Gỗ (chặt cây)', COLOR.good);
      this.refreshCell(tx, ty);
      this.gatherCD = 0.6;
    } else if (t === 'S') {
      this.inv.reed++;
      this.survival.stamina -= 2;
      this.msg('+1 Sậy (cắt sậy)', COLOR.good);
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
      this.msg('Đá quá cứng, chưa có công cụ đập đá.', COLOR.dim);
      this.gatherCD = 0.4;
    } else {
      this.msg('Không có gì để thu thập ở đây.', COLOR.dim);
      this.gatherCD = 0.3;
    }
  }

  // Tạo ô đặt được ở vị trí đang quay mặt (dùng cho sàn tre và bếp lửa).
  placeInFront(newType, cost, okMsg, warnMsg) {
    const { tx, ty } = this.frontTile();
    const t = this.grid[ty]?.[tx];
    if (!(t === 'G' || t === 'B' || t === 'S')) { this.msg('Không thể đặt ở đây.', COLOR.dim); return false; }
    if (this.isWater(tx, ty)) { this.msg('Không thể đặt trên nước.', COLOR.dim); return false; }
    if (this.inv.reed < cost.reed || this.inv.wood < cost.wood) {
      this.msg(`Cần ${cost.reed} Sậy + ${cost.wood} Gỗ.`, COLOR.warn);
      return false;
    }
    this.inv.reed -= cost.reed;
    this.inv.wood -= cost.wood;
    this.grid[ty][tx] = newType;
    this.refreshCell(tx, ty);
    this.msg(okMsg ?? '', COLOR.good);
    if (warnMsg) warnMsg(tx, ty);
    return true;
  }

  doBuild() {
    this.placeInFront('P', { reed: 3, wood: 2 }, 'Đã dựng sàn tre.', (tx) => {
      if (distToRiver(tx) <= PLATFORM_MAX_D) this.msg('⚠ Ô này ngập khi triều cường — sàn sẽ bị cuốn trôi!', COLOR.warn);
      else this.msg('Sàn tre cao hơn mực triều — an toàn.', COLOR.good);
    });
  }

  doFire() {
    this.placeInFront('K', { reed: 2, wood: 2 }, 'Đã dựng bếp lửa — sưởi ấm và nướng cá.', null);
  }

  doCook() {
    if (!this.nearTile('K', 2)) { this.msg('Phải đứng gần bếp lửa để nướng cá.', COLOR.dim); return; }
    if (this.inv.fish <= 0) { this.msg('Không có cá sống để nướng.', COLOR.dim); return; }
    this.inv.fish--;
    this.inv.cafish++;
    this.addXp('fish', 2);
    this.msg('Nướng xong cá — an toàn để ăn.', COLOR.good);
  }

  doDrinkRiver() {
    const { tx, ty } = this.frontTile();
    if (!this.isWater(tx, ty)) { this.msg('Quay mặt về phía nước để uống.', COLOR.dim); return; }
    this.survival.drinkRiver();
    this.msg('Uống nước sông chưa lọc...', COLOR.thirst);
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
        this.inv.goldfish++;
        this.msg('Nước lớn — câu được CÁ VÀNG hiếm!', COLOR.gold);
      } else {
        this.inv.fish++;
        this.msg('Câu được một con cá sông!', COLOR.good);
      }
    } else {
      this.msg(this.survival.insomnia ? 'Tay run quá, cá tuột mất...' : 'Cá đã chạy mất.', COLOR.dim);
    }
  }

  doEatFish() {
    if (this.inv.cafish > 0) {
      this.inv.cafish--;
      this.survival.eatCooked();
      this.msg('Ăn cá nướng — no bụng, an toàn.', COLOR.good);
      return;
    }
    if (this.inv.fish <= 0) { this.msg('Không có cá.', COLOR.dim); return; }
    this.inv.fish--;
    this.survival.eatFish();
    this.msg('Ăn cá sống. (Có thể ngộ độc cá!)', COLOR.warn);
  }

  doEatCrab() {
    if (this.inv.cua <= 0) { this.msg('Không có cua.', COLOR.dim); return; }
    this.inv.cua--;
    this.survival.eatCrab();
    this.msg('Ăn cua đá — no hơn.', COLOR.good);
  }

  doEatGoldfish() {
    if (this.inv.goldfish <= 0) { this.msg('Không có cá vàng.', COLOR.dim); return; }
    this.inv.goldfish--;
    this.survival.eatGoldfish();
    this.msg('Ăn cá vàng — no và hồi máu!', COLOR.gold);
  }

  doCraft() {
    const herbNeed = this.lvl('herb') >= 15 ? 1 : 2; // Thảo dược Lv15: chỉ cần 1 thảo dược
    if (this.inv.herb < herbNeed || this.inv.reed < 1) {
      this.msg(`Cần ${herbNeed} Thảo dược + 1 Sậy để chế Nước Lá Rừng.`, COLOR.warn);
      return;
    }
    this.inv.herb -= herbNeed;
    this.inv.reed -= 1;
    this.inv.remedy++;
    this.addXp('herb', 8);
    this.msg('Đã chế Nước Lá Rừng.', COLOR.good);
  }

  doFeverMed() {
    if (this.lvl('herb') < 10) { this.msg('Cần Thảo dược Lv10 để pha Thuốc Sốt.', COLOR.warn); return; }
    if (this.inv.herb < 3 || this.inv.wood < 1) { this.msg('Cần 3 Thảo dược + 1 Gỗ.', COLOR.warn); return; }
    this.inv.herb -= 3;
    this.inv.wood -= 1;
    this.inv.feverMed++;
    this.addXp('herb', 12);
    this.msg('Đã pha Thuốc Sốt (vỏ cây đắng).', COLOR.good);
  }

  doRemedy() {
    if (this.inv.remedy <= 0) { this.msg('Không có Nước Lá Rừng.', COLOR.dim); return; }
    if (!this.survival.ill) { this.msg('Bạn không đang đau ốm.', COLOR.dim); return; }
    this.inv.remedy--;
    this.survival.drinkRemedy();
    this.msg('Uống Nước Lá Rừng — bệnh đã thuyên giảm.', COLOR.good);
  }

  doFeverCure() {
    if (!this.survival.malaria) { this.msg('Bạn không bị sốt rét.', COLOR.dim); return; }
    if (this.inv.feverMed <= 0) { this.msg('Cần Thuốc Sốt (phím M để pha).', COLOR.warn); return; }
    this.inv.feverMed--;
    this.survival.cureMalaria();
    this.msg('Uống Thuốc Sốt — cơn sốt đã lui.', COLOR.good);
  }

  doCraftSpear() {
    if (this.hasSpear) { this.msg('Đã có giáo rồi.', COLOR.dim); return; }
    if (this.inv.wood < 3 || this.inv.reed < 2) { this.msg('Cần 3 Gỗ + 2 Sậy để làm giáo.', COLOR.warn); return; }
    this.inv.wood -= 3;
    this.inv.reed -= 2;
    this.hasSpear = true;
    this.weapon = 1;
    this.msg('Đã làm giáo tre. Giáo mạnh dưới nước, yếu trên cạn.', COLOR.good);
  }

  doSwapWeapon() {
    if (!this.hasSpear) { this.msg('Chỉ có mã tấu. Chế giáo bằng phím G.', COLOR.dim); return; }
    this.weapon = 1 - this.weapon;
    this.msg(`Cầm ${this.weapon === 0 ? 'mã tấu' : 'giáo'}.`, COLOR.text);
  }

  weaponStats() {
    const dive = this.lvl('dive');
    if (this.weapon === 1) {
      const dmg = 20 + (this.nearWater(1) ? 15 : 0) + (dive >= 10 ? 5 : 0);
      return { name: 'Giáo', dmg, range: 34, cost: 8 };
    }
    const dmg = 25 + (dive >= 5 ? 5 : 0) + (dive >= 10 ? 5 : 0);
    return { name: 'Mã tấu', dmg, range: 24, cost: 10 };
  }

  doAttack() {
    if (this.attackCD > 0) return;
    const w = this.weaponStats();
    if (this.survival.stamina < w.cost) { this.msg('Không đủ sức để vung vũ khí.', COLOR.warn); return; }
    let best = null, bestD = w.range;
    for (const c of this.crabs) {
      if (!c.alive) continue;
      const d = Phaser.Math.Distance.Between(this.px, this.py - 6, c.x, c.y - 6);
      if (d < bestD) { bestD = d; best = c; }
    }
    this.attackCD = 0.45;
    this.survival.stamina -= w.cost;
    if (!best) { this.msg(`Vung ${w.name} vào khoảng không.`, COLOR.dim); return; }
    best.hp -= w.dmg;
    best.spr.setTint(0xff7070);
    this.time.delayedCall(120, () => best.spr.clearTint());
    if (best.hp <= 0) {
      best.alive = false;
      best.spr.setVisible(false);
      best.respawnAt = this.t + CRAB_RESPAWN;
      this.inv.cua++;
      this.addXp('dive', 10);
      this.msg(`Hạ được cua đá bằng ${w.name}! +1 Cua`, COLOR.good);
    } else {
      this.addXp('dive', 3);
      this.msg(`${w.name} trúng cua đá (-${w.dmg})!`, COLOR.text);
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
          const keys = Object.keys(this.inv).filter((k) => this.inv[k] > 0);
          if (keys.length) {
            const k = Phaser.Utils.Array.GetRandom(keys);
            this.inv[k]--;
            this.msg(`⚠ Ngủ ngoài trời, bị trộm mất 1 ${k}!`, COLOR.warn);
          }
        }
        this.msg('Dậy mệt rã rời...', COLOR.warn);
      }
      cam.fadeIn(500, 10, 20, 40);
      cam.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => { this.busy = false; });
    });
  }

  handleActions() {
    const k = this.keys;
    const J = Phaser.Input.Keyboard.JustDown;
    if (J(k.H)) this.helpVisible = !this.helpVisible;
    if (J(k.SPACE)) this.doGather();
    if (J(k.X)) this.doAttack();
    if (J(k.F)) this.doFish();
    if (J(k.E)) this.doDrinkRiver();
    if (J(k.ONE)) this.doEatFish();
    if (J(k.TWO)) this.doEatCrab();
    if (J(k.THREE)) this.doEatGoldfish();
    if (J(k.C)) this.doCraft();
    if (J(k.Q)) this.doRemedy();
    if (J(k.M)) this.doFeverMed();
    if (J(k.N)) this.doFeverCure();
    if (J(k.B)) this.doBuild();
    if (J(k.K)) this.doFire();
    if (J(k.T)) this.doCook();
    if (J(k.G)) this.doCraftSpear();
    if (J(k.V)) this.doSwapWeapon();
    if (J(k.R)) this.doSleep();
  }

  // ---------------- Vòng lặp ----------------

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
    let speed = WALK_SPEED * this.survival.speedMult();
    if (this.sprinting) speed *= SPRINT_MULT;
    this.movePlayer(dx * speed * dt, dy * speed * dt);
  }

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

    this.t += dt;
    this.attackCD = Math.max(0, this.attackCD - dt);
    this.fishCD = Math.max(0, this.fishCD - dt);
    this.gatherCD = Math.max(0, this.gatherCD - dt);
    this.wetT = Math.max(0, this.wetT - dt);

    this.updateTide();
    this.updateWeather(dt);
    this.processRespawns();

    this.handleActions();
    this.handleMovement(dt);

    // Đồng bộ vị trí nhân vật + hoạt ảnh đi bộ.
    if (this.moving) this.walkT += dt; else this.walkT = 0;
    this.player.setPosition(this.px, this.py);
    this.player.setFrame(this.moving ? String(Math.floor(this.walkT / 0.18) % 2) : '0');
    this.player.setFlipX(this.face.x < 0);

    // Muỗi: ban đêm ven sông, ngoài nhà, có thể đốt → sốt rét.
    const { tx, ty } = this.playerTile();
    const here = this.grid[ty]?.[tx];
    const night = this.darkness() > 0.5;
    if (night && here !== 'F' && distToRiver(tx) <= MOSQUITO_RANGE && !this.survival.malaria) {
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
    });
    for (const ev of this.survival.flashEvents()) this.handleSurvivalEvent(ev);

    this.updateCrabs(dt);
    this.updateFx(dt);

    if (this.survival.hp <= 0) this.die();
    this.updateHud();
  }

  handleSurvivalEvent(ev) {
    switch (ev.type) {
      case 'sick':
        this.msg('Bạn bị CẢM TRIỀU! Thân nhiệt xuống quá thấp. Cần Nước Lá Rừng (Q).', COLOR.hp);
        break;
      case 'poison':
        this.msg('Trúng NƯỚC ĐỘC! Máu đang mất dần. Cần Nước Lá Rừng (Q).', COLOR.hp);
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

  // ---------------- Cua đá ----------------

  updateCrabs(dt) {
    const alivePlayer = !this.dead;
    for (const c of this.crabs) {
      if (!c.alive) {
        if (this.t >= c.respawnAt) this.spawnCrab(c);
        continue;
      }
      c.cool = Math.max(0, c.cool - dt);
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
      // Cắn khi đủ gần
      if (alivePlayer && dist < 14 && c.cool <= 0) {
        c.cool = 1.5;
        this.survival.hp = Math.max(0, this.survival.hp - 8);
        this.msg('Cua đá kẹp bạn! -8 máu', COLOR.hp);
        this.cameras.main.shake(120, 0.003);
      }
    }
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
      // Không spawn quá gần người chơi.
      if (Phaser.Math.Distance.Between(tx * TILE, ty * TILE, this.px, this.py) < 80) continue;
      c.x = tx * TILE + 8; c.y = ty * TILE + 12;
      c.hp = 25; c.alive = true; c.turnT = 0;
      c.spr.setVisible(true).setPosition(c.x, c.y);
      return;
    }
    c.respawnAt = this.t + 5;
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
    this.msg('Bạn đã gục ngã vì kiệt sức...', COLOR.hp);
  }

  revive() {
    this.dead = false;
    this.survival.reviveAtHouse();
    for (const k of ['wood', 'reed', 'herb', 'fish', 'cafish', 'goldfish', 'cua', 'remedy', 'feverMed']) {
      this.inv[k] = Math.floor(this.inv[k] / 2);
    }
    this.px = (HOUSE.x + Math.floor(HOUSE.w / 2)) * TILE + 8;
    this.py = (HOUSE.y + HOUSE.h + 1) * TILE + 12;
    this.wetT = 0;
    this.msg('Người dân làng nhặt bạn về nhà sàn. Mất một nửa vật phẩm.', COLOR.warn);
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

  updateHud() {
    const s = this.survival;
    const g = this.hudG;
    g.clear();

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

    // Tình trạng bệnh
    const flags = [];
    if (s.sick) flags.push('CẢM TRIỀU');
    if (s.poisonT > 0) flags.push('NƯỚC ĐỘC');
    if (s.fishPoisonT > 0) flags.push('NGỘ ĐỘC CÁ');
    if (s.malaria) flags.push(s.feverNow ? 'SỐT RÉT (đang sốt cao!)' : 'SỐT RÉT');
    if (s.insomnia) flags.push('THỨC TRẮNG');
    if (this.wetT > 0) flags.push('ƯỚT');
    if (this.nearTile('K', 2)) flags.push('ẤM BẾP LỬA');
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
    // Vạch đỏ: mức triều mà sàn tre ở khoảng cách <= PLATFORM_MAX_D sẽ bị ngập.
    const dangerLevel = (PLATFORM_MAX_D + 0.5 - 1) / 4.5;
    const markX = VIEW_W - 196 + 2 + Math.round((180 - 4) * dangerLevel);
    g.lineStyle(2, 0xff6b35, 1);
    g.lineBetween(markX, 56, markX, 74);

    // Nhật ký (góc trên trái, dưới HP)
    for (let i = 0; i < this.logTexts.length; i++) {
      const entry = this.log[i];
      const t = this.logTexts[i];
      if (!entry) { t.setText(''); continue; }
      const age = this.t - entry.t;
      const a = age < 6 ? 1 : Phaser.Math.Clamp(1 - (age - 6) / 3, 0.25, 1);
      t.setText(entry.text).setColor(entry.color).setAlpha(a);
    }

    // Túi đồ + vũ khí + kỹ năng
    const iv = this.inv;
    const w = this.weaponStats();
    this.invText.setText([
      'TÚI ĐỒ',
      `Gỗ: ${iv.wood}   Sậy: ${iv.reed}   Thảo dược: ${iv.herb}`,
      `Cá sống: ${iv.fish}   Cá nướng: ${iv.cafish}   Cá vàng: ${iv.goldfish}`,
      `Cua: ${iv.cua}   Nước Lá Rừng: ${iv.remedy}   Thuốc Sốt: ${iv.feverMed}`,
      `Vũ khí: ${w.name}${this.hasSpear ? '  (V đổi)' : ''}`,
      '',
      'KỸ NĂNG',
      `Lặn Lv${this.lvl('dive')}  ·  Thảo dược Lv${this.lvl('herb')}  ·  Chài lưới Lv${this.lvl('fish')}`,
    ].join('\n'));

    this.helpPanel.setVisible(this.helpVisible);
    this.helpText.setText('H: điều khiển · Space: hái/chặt · X: đánh · F: câu · E: uống · B: dựng sàn · K: bếp · R: ngủ');
    this.deadText.setVisible(this.dead).setText('BẠN ĐÃ GỤC NGÃ\nĐang được đưa về nhà sàn...');
    if (this.dead) {
      g.fillStyle(0x000000, 0.45);
      g.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }
}
