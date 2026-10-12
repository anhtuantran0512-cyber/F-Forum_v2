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

export function generateTextures(scene) {
  const tex = scene.textures;

  // ---- Tileset ----
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = TILE * 16;
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
  tex.addCanvas('tiles', tileCanvas);
  const tTex = tex.get('tiles');
  for (let i = 0; i < 16; i++) tTex.add(String(i), 0, i * TILE, 0, TILE, TILE);

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
