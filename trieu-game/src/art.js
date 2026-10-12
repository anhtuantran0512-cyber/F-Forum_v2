// Sinh toàn bộ sprite pixel bằng code (không cần file ảnh ngoài).
// Palette bám theo bản thiết kế: tông nước #0a2e4d → #4a9eb5, bùn #5c4423 → #c9a876, đèn #ff6b35 → #ffd23f.

export const TILE = 16;

// Chỉ số frame trong tileset 'tiles' (mỗi frame 16x16, xếp ngang).
export const TILE_FRAME = {
  WATER0: 0, // 0..3 = 4 frame sóng
  GRASS1: 4,
  GRASS2: 5,
  MUD: 6,
  SAND: 7,
  REED: 8,
  TREE: 9,
  ROCK: 10,
  HERB: 11,
  PLANK: 12,
  WALL: 13,
  FLOOR: 14,
  FIRE: 15,
  SPIKE: 16,
  LAMP: 17,
  DRY: 18,
  FLAG: 19,
  TRAP: 20,
  MARSH: 21,
  COC: 22,
};

const PAL = {
  deep: '#0a2e4d',
  water: '#1d5a7a',
  foam: '#4a9eb5',
  grassA: '#3f6b2e',
  grassB: '#4f8a3a',
  grassDark: '#2f5222',
  mudA: '#5c4423',
  mudB: '#6e5430',
  mudDark: '#473419',
  sandA: '#c9a876',
  sandB: '#d9bd8c',
  sandDark: '#b08f5e',
  reedA: '#8aa64a',
  reedB: '#c9c86a',
  trunk: '#4a3218',
  canopy: '#1f4a1f',
  canopyLight: '#2f6b2a',
  rockA: '#7a7f86',
  rockLight: '#a4a9b0',
  rockDark: '#4a4e55',
  leaf: '#6fbf4a',
  flower: '#ffd23f',
  plankA: '#8a6a3a',
  plankLine: '#5c4423',
  wallA: '#c9a876',
  wallLine: '#8a6a3a',
  floorA: '#a0784a',
  floorB: '#8a6a3a',
  ember: '#ff6b35',
};

// Hash đơn giản để có biến thể ổn định (không random mỗi lần vẽ).
function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  h = h ^ (h >>> 16);
  return (h >>> 0) % 1000;
}

function px(ctx, x, y, col) {
  ctx.fillStyle = col;
  ctx.fillRect(x, y, 1, 1);
}

function fillTile(ctx, ox, base) {
  ctx.fillStyle = base;
  ctx.fillRect(ox, 0, TILE, TILE);
}

function speckle(ctx, ox, colors, density, seed = 0) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const h = hash(x, y, seed);
      if (h < density) px(ctx, ox + x, y, colors[h % colors.length]);
    }
  }
}

function drawWater(ctx, ox, frame) {
  fillTile(ctx, ox, PAL.deep);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      // Sóng gợn: vệt sáng dịch chuyển theo frame → hiệu ứng sprite animation 4 frame.
      const wave = (y + ((x + frame * 4) >> 2)) % 4;
      if (wave === 0 && hash(x, y, 3) < 500) px(ctx, ox + x, y, PAL.water);
      if (((x * 3 + y * 5 + frame * 7) % 23) === 0) px(ctx, ox + x, y, PAL.foam);
    }
  }
}

function drawGrass(ctx, ox, variant) {
  fillTile(ctx, ox, variant ? PAL.grassB : PAL.grassA);
  speckle(ctx, ox, [PAL.grassDark, PAL.grassB, PAL.leaf], 120, variant + 1);
}

function drawMud(ctx, ox) {
  fillTile(ctx, ox, PAL.mudA);
  speckle(ctx, ox, [PAL.mudB, PAL.mudDark], 110, 7);
}

function drawSand(ctx, ox) {
  fillTile(ctx, ox, PAL.sandA);
  speckle(ctx, ox, [PAL.sandB, PAL.sandDark], 100, 9);
}

function drawReed(ctx, ox) {
  drawGrass(ctx, ox, 0);
  for (let i = 0; i < 6; i++) {
    const x = 2 + i * 2 + (i % 2);
    const top = 3 + (hash(i, 1, 4) % 5);
    for (let y = top; y < 16; y++) px(ctx, ox + x, y, PAL.reedA);
    px(ctx, ox + x, top, PAL.reedB);
    px(ctx, ox + x, top + 1, PAL.reedB);
  }
}

function drawTree(ctx, ox) {
  drawGrass(ctx, ox, 1);
  // Thân
  ctx.fillStyle = PAL.trunk;
  ctx.fillRect(ox + 7, 9, 2, 7);
  // Tán lá (hình tròn thô)
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x - 7.5, dy = y - 5;
      if (dx * dx + dy * dy <= 30) {
        px(ctx, ox + x, y + 1, (dx * dx + dy * dy < 9 && y < 6) ? PAL.canopyLight : PAL.canopy);
      }
    }
  }
  // Bóng dưới gốc
  px(ctx, ox + 5, 15, PAL.grassDark);
  px(ctx, ox + 10, 15, PAL.grassDark);
}

function drawRock(ctx, ox) {
  drawGrass(ctx, ox, 0);
  for (let y = 5; y < 14; y++) {
    for (let x = 2; x < 14; x++) {
      const dx = (x - 7.5) / 6, dy = (y - 9.5) / 4.5;
      if (dx * dx + dy * dy <= 1) {
        const shade = (dy > 0.4) ? PAL.rockDark : (dx < -0.3 && dy < 0) ? PAL.rockLight : PAL.rockA;
        px(ctx, ox + x, y, shade);
      }
    }
  }
}

function drawHerb(ctx, ox) {
  drawGrass(ctx, ox, 1);
  const leaves = [[7, 9], [5, 10], [9, 10], [6, 12], [8, 12]];
  for (const [x, y] of leaves) px(ctx, ox + x, y, PAL.leaf);
  px(ctx, ox + 7, 8, PAL.flower);
  px(ctx, ox + 7, 7, PAL.leaf);
  px(ctx, ox + 7, 11, PAL.grassDark);
  px(ctx, ox + 7, 13, PAL.leaf);
}

function drawPlank(ctx, ox) {
  fillTile(ctx, ox, PAL.plankA);
  for (let y = 0; y < TILE; y++) {
    if (y % 4 === 0) for (let x = 0; x < TILE; x++) px(ctx, ox + x, y, PAL.plankLine);
  }
  for (let y = 0; y < TILE; y++) {
    if (y % 4 === 0) continue;
    px(ctx, ox + 3, y, PAL.plankLine);
    px(ctx, ox + 11, y, PAL.plankLine);
  }
}

function drawWall(ctx, ox) {
  fillTile(ctx, ox, PAL.wallA);
  for (let x = 0; x < TILE; x += 4) {
    for (let y = 0; y < TILE; y++) px(ctx, ox + x, y, PAL.wallLine);
  }
  ctx.fillStyle = PAL.wallLine;
  ctx.fillRect(ox, 0, TILE, 1);
  ctx.fillRect(ox, TILE - 1, TILE, 1);
}

function drawFire(ctx, ox) {
  drawGrass(ctx, ox, 0);
  // Vòng đá quanh bếp
  const stone = '#7a7f86', stoneD = '#4a4e55';
  for (let x = 3; x < 13; x++) { px(ctx, ox + x, 11, stone); px(ctx, ox + x, 12, stoneD); }
  px(ctx, ox + 3, 10, stone); px(ctx, ox + 12, 10, stone);
  // Củi
  ctx.fillStyle = PAL.mudA;
  ctx.fillRect(ox + 4, 12, 8, 2);
  // Lửa: lõi vàng, ngoài cam/đỏ
  const flame = [[7, 4], [8, 4], [6, 6], [7, 6], [8, 6], [9, 6], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8], [10, 8], [6, 10], [7, 10], [8, 10], [9, 10]];
  for (const [x, y] of flame) px(ctx, ox + x, y, PAL.ember);
  for (const [x, y] of [[7, 7], [8, 7], [7, 9], [8, 9]]) px(ctx, ox + x, y, PAL.flower);
}

function drawSpikes(ctx, ox) {
  drawGrass(ctx, ox, 0);
  for (let i = 0; i < 4; i++) {
    const x = 2 + i * 4;
    for (let y = 5; y < 15; y++) {
      const w = Math.max(0, 1 - Math.floor((y - 5) / 4));
      for (let k = -w; k <= w; k++) px(ctx, ox + x + k + 1, y, PAL.plankA);
    }
    px(ctx, ox + x + 1, 4, PAL.plankLine);
  }
  ctx.fillStyle = PAL.plankLine;
  ctx.fillRect(ox, 14, TILE, 1);
}

function drawLamp(ctx, ox) {
  drawGrass(ctx, ox, 1);
  ctx.fillStyle = PAL.plankLine;
  ctx.fillRect(ox + 7, 7, 2, 9);
  ctx.fillStyle = PAL.ember;
  ctx.fillRect(ox + 5, 3, 6, 5);
  px(ctx, ox + 7, 4, PAL.flower);
  px(ctx, ox + 8, 4, PAL.flower);
  px(ctx, ox + 6, 5, PAL.flower);
  px(ctx, ox + 9, 5, PAL.flower);
  ctx.fillStyle = PAL.plankLine;
  ctx.fillRect(ox + 5, 2, 6, 1);
  ctx.fillRect(ox + 5, 8, 6, 1);
}

function drawDrying(ctx, ox) {
  drawGrass(ctx, ox, 0);
  ctx.fillStyle = PAL.plankLine;
  ctx.fillRect(ox + 2, 4, 2, 11);
  ctx.fillRect(ox + 12, 4, 2, 11);
  ctx.fillRect(ox + 2, 4, 12, 1);
  for (let i = 0; i < 3; i++) {
    const x = 4 + i * 3;
    ctx.fillStyle = '#c9a876';
    ctx.fillRect(ox + x, 6, 2, 6);
    px(ctx, ox + x, 12, '#8a6a3a');
  }
}

function drawFlag(ctx, ox) {
  drawGrass(ctx, ox, 1);
  ctx.fillStyle = PAL.plankLine;
  ctx.fillRect(ox + 4, 1, 1, 15);
  ctx.fillStyle = '#c0503a';
  ctx.fillRect(ox + 5, 2, 7, 5);
  px(ctx, ox + 8, 4, PAL.flower);
  px(ctx, ox + 7, 3, PAL.flower);
  px(ctx, ox + 9, 3, PAL.flower);
}

function drawSnake(ctx, ox) {
  const body = '#4f7a2e', dark = '#2a4418', belly = '#c9c86a';
  for (let x = 2; x < 13; x++) {
    const y = 4 + Math.round(Math.sin(x * 0.8) * 1.2);
    px(ctx, ox + x, y, body);
    px(ctx, ox + x, y + 1, belly);
    if (x % 3 === 0) px(ctx, ox + x, y, dark);
  }
  px(ctx, ox + 13, 3, body);
  px(ctx, ox + 14, 3, body);
  px(ctx, ox + 14, 2, '#ff6b35');
  px(ctx, ox + 13, 2, '#1a1a1a');
}

function drawTrap(ctx, ox) {
  drawWater(ctx, ox, 0);
  // Lồng tre nổi trên mặt nước
  const cage = PAL.plankA, line = PAL.plankLine;
  ctx.fillStyle = cage;
  ctx.fillRect(ox + 3, 5, 10, 7);
  ctx.fillStyle = line;
  for (let x = 3; x <= 12; x += 3) ctx.fillRect(ox + x, 5, 1, 7);
  for (let y = 5; y <= 11; y += 3) ctx.fillRect(ox + 3, y, 10, 1);
  ctx.fillStyle = PAL.foam;
  ctx.fillRect(ox + 6, 9, 4, 1);
}

function drawFloor(ctx, ox) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      px(ctx, ox + x, y, ((x >> 2) + (y >> 2)) % 2 ? PAL.floorA : PAL.floorB);
    }
  }
}

// Nhân vật 16x24 (phong cách Stardew: 1 tile rộng, 1.5 tile cao).
// Ký tự: . trong suốt | h nón | H nón tối | s da | e mắt | b áo | B áo tối | w thắt lưng | p quần | k giày
const PLAYER_PALETTE = {
  h: '#d9b25a', H: '#a5813a', s: '#f0c8a0', e: '#1a1a1a',
  b: '#3d6f9e', B: '#2b4f73', w: '#5c4423', p: '#3a3a4a', k: '#2a1d12',
};
const PLAYER_BODY = [
  '.....HHHHHH.....',
  '....HhhhhhhH....',
  '...HhhhhhhhhH...',
  'HHHHHHHHHHHHHHHH',
  '..HHHHHHHHHHHH..',
  '.....ssssss.....',
  '.....sesess.....',
  '.....ssssss.....',
  '.......ss.......',
  '....bbbbbbbb....',
  '...sbbbbbbbbs...',
  '...sbbbbbbbbs...',
  '...sbbbbbbbbs...',
  '...bbwwwwwwbb...',
  '...bBBBBBBBBb...',
  '.....pppppp.....',
];
// Hai frame chân: A (chụm) / B (dang) để tạo cảm giác đi bộ. Mỗi frame 8 hàng (3 quần + 2 giày + 3 trống).
const LEGS_A = [
  '.....ppp.ppp....',
  '.....ppp.ppp....',
  '.....ppp.ppp....',
  '.....kkk.kkk....',
  '.....kkk.kkk....',
  '................',
  '................',
  '................',
];
const LEGS_B = [
  '....ppp...ppp...',
  '....ppp...ppp...',
  '....ppp...ppp...',
  '....kkk...kkk...',
  '....kkk...kkk...',
  '................',
  '................',
  '................',
];

function drawCharArt(ctx, ox, rows, palette) {
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length && x < 16; x++) {
      const c = row[x];
      if (c !== '.' && palette[c]) px(ctx, ox + x, y, palette[c]);
    }
  });
}

function makePlayerFrame(ctx, ox, legs) {
  // Thân (cao 16 hàng) + chân (8 hàng) = 24 hàng.
  const body = PLAYER_BODY.slice(0, 16);
  const full = [...body, ...legs.slice(0, 8)];
  drawCharArt(ctx, ox, full, PLAYER_PALETTE);
}

function drawCrab(ctx, ox) {
  const body = '#c0503a', dark = '#7a2e22', eye = '#1a1a1a';
  // Thân
  ctx.fillStyle = body;
  ctx.fillRect(ox + 4, 4, 8, 5);
  ctx.fillStyle = dark;
  ctx.fillRect(ox + 4, 8, 8, 1);
  // Càng
  ctx.fillStyle = body;
  ctx.fillRect(ox + 0, 3, 3, 3);
  ctx.fillRect(ox + 13, 3, 3, 3);
  px(ctx, ox + 0, 2, body); px(ctx, ox + 15, 2, body);
  // Mắt
  px(ctx, ox + 6, 3, eye);
  px(ctx, ox + 9, 3, eye);
  // Chân
  ctx.fillStyle = dark;
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(ox + 2 + i, 9, 1, 2);
    ctx.fillRect(ox + 11 + i, 9, 1, 2);
  }
}

function drawMarsh(ctx, ox) {
  fillTile(ctx, ox, '#3d4a2a');
  speckle(ctx, ox, ['#4f5e33', '#2e3820', '#5b6b3a'], 90, 21);
  // bong bóng khí và vệt nước đọng
  px(ctx, ox + 4, 6, '#8fb3a0');
  px(ctx, ox + 11, 11, '#8fb3a0');
  for (let x = 2; x < 14; x++) px(ctx, ox + x, 13, (x % 3) ? '#2a3a4a' : '#3d5566');
}

function drawCoc(ctx, ox) {
  drawMarsh(ctx, ox);
  // thân và tán cây cốc (lá dài, hoa tím nhạt)
  ctx.fillStyle = '#4a6a2a';
  ctx.fillRect(ox + 7, 8, 2, 7);
  const leaves = [[4, 7], [5, 6], [6, 5], [9, 5], [10, 6], [11, 7], [3, 9], [12, 9]];
  for (const [x, y] of leaves) px(ctx, ox + x, y, '#7fae4a');
  px(ctx, ox + 7, 4, '#b58ad6');
  px(ctx, ox + 8, 3, '#b58ad6');
  px(ctx, ox + 6, 14, '#6b4a2a');
  px(ctx, ox + 9, 14, '#6b4a2a');
}

export function generateTextures(scene) {
  const tex = scene.textures;

  // ---- Tileset ----
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = TILE * 23;
  tileCanvas.height = TILE;
  const tctx = tileCanvas.getContext('2d');
  for (let f = 0; f < 4; f++) drawWater(tctx, f * TILE, f);
  drawGrass(tctx, 4 * TILE, 0);
  drawGrass(tctx, 5 * TILE, 1);
  drawMud(tctx, 6 * TILE);
  drawSand(tctx, 7 * TILE);
  drawReed(tctx, 8 * TILE);
  drawTree(tctx, 9 * TILE);
  drawRock(tctx, 10 * TILE);
  drawHerb(tctx, 11 * TILE);
  drawPlank(tctx, 12 * TILE);
  drawWall(tctx, 13 * TILE);
  drawFloor(tctx, 14 * TILE);
  drawFire(tctx, 15 * TILE);
  drawSpikes(tctx, 16 * TILE);
  drawLamp(tctx, 17 * TILE);
  drawDrying(tctx, 18 * TILE);
  drawFlag(tctx, 19 * TILE);
  drawTrap(tctx, 20 * TILE);
  drawMarsh(tctx, 21 * TILE);
  drawCoc(tctx, 22 * TILE);
  tex.addCanvas('tiles', tileCanvas);
  const tTex = tex.get('tiles');
  for (let i = 0; i < 23; i++) tTex.add(String(i), 0, i * TILE, 0, TILE, TILE);

  // ---- Nhân vật: 2 frame đi bộ (32x24 gồm 2 ô 16x24) ----
  const pCanvas = document.createElement('canvas');
  pCanvas.width = 32;
  pCanvas.height = 24;
  const pctx = pCanvas.getContext('2d');
  makePlayerFrame(pctx, 0, LEGS_A);
  makePlayerFrame(pctx, 16, LEGS_B);
  tex.addCanvas('player', pCanvas);
  const pTex = tex.get('player');
  pTex.add('0', 0, 0, 0, 16, 24);
  pTex.add('1', 0, 16, 0, 16, 24);

  // ---- Cua đá ----
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 16;
  cCanvas.height = 12;
  drawCrab(cCanvas.getContext('2d'), 0);
  tex.addCanvas('crab', cCanvas);

  // ---- Rắn nước ----
  const sCanvas = document.createElement('canvas');
  sCanvas.width = 16;
  sCanvas.height = 8;
  drawSnake(sCanvas.getContext('2d'), 0);
  tex.addCanvas('snake', sCanvas);

  // ---- Hạt mưa (1 pixel) ----
  const rCanvas = document.createElement('canvas');
  rCanvas.width = 1;
  rCanvas.height = 1;
  const rctx = rCanvas.getContext('2d');
  rctx.fillStyle = '#9fc7e0';
  rctx.fillRect(0, 0, 1, 1);
  tex.addCanvas('drop', rCanvas);
}

export const PALETTE_HEX = PAL;
