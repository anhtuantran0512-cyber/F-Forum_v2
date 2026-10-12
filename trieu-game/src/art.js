// Sinh toàn bộ sprite pixel bằng code (không cần file ảnh ngoài).
// Phong cách: ô 16px, ánh sáng chiếu từ trên-trái, viền tối cho nhân vật và sinh vật,
// hoạt hình cho nước, lửa, cờ, cua và rắn.

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
  FIRE2: 23, // khung 2 của lửa (nhấp nháy)
  FLAG2: 24, // khung 2 của cờ (phất gió)
  DECK: 25,  // sàn chợ
  STALL: 26, // quầy hàng của thương lái
};
export const TILE_COUNT = 27;

const PAL = {
  deep: '#0a2e4d',
  deep2: '#0d3a5e',
  water: '#1d5a7a',
  foam: '#4a9eb5',
  glint: '#9fe3ef',
  foamW: '#e4f8fb',
  grassA: '#3f6b2e',
  grassB: '#4f8a3a',
  grassDark: '#2f5222',
  grassLight: '#5d9e45',
  mudA: '#5c4423',
  mudB: '#6e5430',
  mudDark: '#473419',
  mudPuddle: '#3a2b17',
  sandA: '#c9a876',
  sandB: '#d9bd8c',
  sandDark: '#b08f5e',
  sandLine: '#a8875a',
  reedA: '#8aa64a',
  reedB: '#c9c86a',
  reedDark: '#5f7a2a',
  trunk: '#4a3218',
  trunkLight: '#6b4a26',
  trunkDark: '#2e1f0e',
  canopy: '#1f4a1f',
  canopyMid: '#2f6b2a',
  canopyLight: '#4a8c3a',
  canopyDark: '#163516',
  canopyLine: '#0f2a10',
  rockA: '#7a7f86',
  rockLight: '#a4a9b0',
  rockDark: '#4a4e55',
  rockLine: '#2f3338',
  leaf: '#6fbf4a',
  leafDark: '#4f9a3a',
  flower: '#ffd23f',
  plankA: '#8a6a3a',
  plankLight: '#a88a52',
  plankLine: '#5c4423',
  plankGrain: '#7a5a30',
  wallA: '#c9a876',
  wallLine: '#8a6a3a',
  wallLight: '#dcc294',
  floorA: '#a0784a',
  floorB: '#8a6a3a',
  floorLine: '#6a4e2a',
  ember: '#ff6b35',
  emberDark: '#c0392b',
  emberMid: '#ff9a3c',
  emberCore: '#ffd23f',
  outline: '#14100b',
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

// Ma trận ô sprite: null = trong suốt.
function blank(w, h) {
  return Array.from({ length: h }, () => new Array(w).fill(null));
}
function rectCells(c, x, y, w, h, col) {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) {
      if (c[j] && i >= 0 && i < c[0].length) c[j][i] = col;
    }
  }
}
function setCell(c, x, y, col) {
  if (c[y] && x >= 0 && x < c[0].length) c[y][x] = col;
}
// Vẽ ma trận kèm viền tối quanh phần đặc (4 hướng).
function drawCells(ctx, ox, cells, outline = PAL.outline) {
  const h = cells.length, w = cells[0].length;
  const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && cells[y][x] != null;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (solid(x, y)) continue;
      if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
        px(ctx, ox + x, y, outline);
      }
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (cells[y][x] != null) px(ctx, ox + x, y, cells[y][x]);
    }
  }
}

// ---------------- Ô địa hình ----------------

function drawWater(ctx, ox, frame) {
  // Nền hai dải sâu/nông xen kẽ (chu kỳ 8px, ghép ô liền mạch)
  for (let y = 0; y < TILE; y++) {
    ctx.fillStyle = y % 8 < 4 ? PAL.deep : PAL.deep2;
    ctx.fillRect(ox, y, TILE, 1);
  }
  // Vệt sóng ngang, quấn vòng theo x để hoạt hình lặp mượt
  for (let k = 0; k < 5; k++) {
    const y = (k * 3 + 1 + (k % 2) * 6) % TILE;
    const x0 = (k * 5 + frame * 4) % TILE;
    for (let i = 0; i < 5; i++) {
      const xx = (x0 + i) % TILE;
      px(ctx, ox + xx, y, i === 0 || i === 4 ? PAL.water : PAL.foam);
    }
  }
  // Lấp lánh nhấp nháy
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      if (hash(x, y, 5) % 37 === 0 && (hash(x, y, 6) + frame) % 4 === 0) px(ctx, ox + x, y, PAL.glint);
    }
  }
}

function drawGrass(ctx, ox, variant) {
  fillTile(ctx, ox, variant ? PAL.grassB : PAL.grassA);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const h = hash(x, y, variant + 11);
      if (h < 60) px(ctx, ox + x, y, PAL.grassDark);
      else if (h > 960) px(ctx, ox + x, y, PAL.grassLight);
    }
  }
  // Chùm cỏ hình chữ V
  for (let i = 0; i < 6; i++) {
    const x = 1 + (hash(i, 3, variant + 2) % 13);
    const y = 4 + (hash(i, 7, variant + 2) % 10);
    px(ctx, ox + x - 1, y, PAL.grassDark);
    px(ctx, ox + x, y - 1, PAL.leafDark);
    px(ctx, ox + x, y, PAL.leaf);
    px(ctx, ox + x + 1, y, PAL.grassDark);
  }
  if (hash(variant, 9, 2) % 4 === 0) {
    px(ctx, ox + 2 + (hash(9, variant, 3) % 12), 2 + (hash(variant, 5, 3) % 12), PAL.flower);
  }
}

function drawMud(ctx, ox) {
  fillTile(ctx, ox, PAL.mudA);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const h = hash(x, y, 7);
      if (h < 90) px(ctx, ox + x, y, PAL.mudDark);
      else if (h > 955) px(ctx, ox + x, y, PAL.mudB);
    }
  }
  // Vũng nước đọng và hạt sỏi
  for (const [x, y, w] of [[3, 5, 4], [10, 11, 3]]) {
    ctx.fillStyle = PAL.mudPuddle;
    ctx.fillRect(ox + x, y, w, 2);
    px(ctx, ox + x, y, PAL.water);
  }
  px(ctx, ox + 12, 3, '#8a7450');
  px(ctx, ox + 13, 3, '#6a5a3a');
  px(ctx, ox + 2, 13, '#8a7450');
}

function drawMarsh(ctx, ox) {
  fillTile(ctx, ox, '#3d4a2a');
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const h = hash(x, y, 21);
      if (h < 80) px(ctx, ox + x, y, '#2e3820');
      else if (h > 950) px(ctx, ox + x, y, '#5b6b3a');
    }
  }
  // Vũng nước tối phản chiếu
  ctx.fillStyle = '#2a3a4a';
  ctx.fillRect(ox + 9, 9, 5, 2);
  px(ctx, ox + 10, 9, '#3d5566');
  px(ctx, ox + 12, 9, '#3d5566');
  // Bong bóng khí
  px(ctx, ox + 4, 6, '#8fb3a0');
  px(ctx, ox + 5, 13, '#8fb3a0');
  // Lá cỏ đầm
  for (const [x, y] of [[2, 12], [13, 4], [6, 2]]) {
    px(ctx, ox + x, y, '#5b7a2a');
    px(ctx, ox + x + 1, y - 1, '#7a9a3a');
  }
}

function drawCocPlant(ctx, ox) {
  ctx.fillStyle = '#4a6a2a';
  ctx.fillRect(ox + 7, 8, 2, 7);
  const leaves = [[4, 7], [5, 6], [6, 5], [9, 5], [10, 6], [11, 7], [3, 9], [12, 9]];
  for (const [x, y] of leaves) {
    px(ctx, ox + x, y, '#7fae4a');
    px(ctx, ox + x, y + 1, '#4a6a2a');
  }
  px(ctx, ox + 7, 4, '#b58ad6');
  px(ctx, ox + 8, 3, '#8a5ab0');
  px(ctx, ox + 6, 14, '#6b4a2a');
  px(ctx, ox + 9, 14, '#6b4a2a');
}

function drawCoc(ctx, ox) {
  drawMarsh(ctx, ox);
  drawCocPlant(ctx, ox);
}

function drawSand(ctx, ox) {
  fillTile(ctx, ox, PAL.sandA);
  // Gợn cát (sóng nhẹ theo hàng)
  for (const y0 of [3, 8, 13]) {
    for (let x = 0; x < TILE; x++) {
      const y = y0 + Math.round(Math.sin(x * 0.9 + y0) * 0.6);
      px(ctx, ox + x, y, PAL.sandLine);
    }
  }
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const h = hash(x, y, 9);
      if (h < 45) px(ctx, ox + x, y, PAL.sandDark);
      else if (h > 972) px(ctx, ox + x, y, PAL.sandB);
    }
  }
  px(ctx, ox + 11, 6, '#8a7a6a');
  px(ctx, ox + 12, 6, '#6a5a4a');
  px(ctx, ox + 4, 11, '#8a7a6a');
}

function drawReed(ctx, ox) {
  drawGrass(ctx, ox, 0);
  for (let i = 0; i < 7; i++) {
    const x = 1 + i * 2 + (i % 2);
    const top = 2 + (hash(i, 1, 4) % 5);
    for (let y = top; y < 16; y++) {
      px(ctx, ox + x, y, PAL.reedA);
      px(ctx, ox + x + 1, y, PAL.reedDark);
    }
    px(ctx, ox + x, top, PAL.reedB);
    px(ctx, ox + x, top + 1, PAL.reedB);
    px(ctx, ox + x + 1, top, PAL.reedB);
    if (i % 3 === 1) px(ctx, ox + x - 1, top + 4, PAL.leafDark);
  }
}

function drawTree(ctx, ox) {
  drawGrass(ctx, ox, 1);
  // Bóng dưới gốc
  ctx.fillStyle = PAL.grassDark;
  ctx.fillRect(ox + 4, 15, 9, 1);
  // Thân (sáng bên trái, tối bên phải)
  for (let y = 9; y < 15; y++) {
    px(ctx, ox + 7, y, PAL.trunkLight);
    px(ctx, ox + 8, y, PAL.trunk);
  }
  px(ctx, ox + 9, 11, PAL.trunkDark);
  // Tán lá: 3 tông theo hướng sáng, viền tối
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x - 7.5, dy = y - 5.5;
      const d2 = dx * dx + dy * dy;
      if (d2 > 40) continue;
      const s = -(dx + dy) / 6;
      let col = s > 0.35 ? PAL.canopyLight : s < -0.35 ? PAL.canopyDark : PAL.canopyMid;
      if (d2 > 30) col = PAL.canopyLine;
      if (d2 <= 30 && hash(x, y, 13) % 7 === 0) col = s > 0 ? PAL.canopyLight : PAL.canopyDark;
      px(ctx, ox + x, y, col);
    }
  }
}

function drawRock(ctx, ox) {
  drawGrass(ctx, ox, 0);
  // Bóng đổ
  ctx.fillStyle = PAL.grassDark;
  ctx.fillRect(ox + 3, 14, 11, 1);
  for (let y = 4; y < 15; y++) {
    for (let x = 1; x < 15; x++) {
      const dx = (x - 7.5) / 6.4, dy = (y - 9.5) / 5;
      const e = dx * dx + dy * dy;
      if (e > 1) continue;
      let col;
      if (e > 0.72) col = PAL.rockLine;
      else if (-dx * 0.7 - dy * 0.8 > 0.9) col = PAL.rockLight;
      else if (dx * 0.4 + dy * 0.9 > 0.9) col = PAL.rockDark;
      else col = PAL.rockA;
      px(ctx, ox + x, y, col);
    }
  }
  px(ctx, ox + 9, 8, PAL.rockLine);
  px(ctx, ox + 10, 9, PAL.rockLine);
  px(ctx, ox + 10, 10, PAL.rockLine);
  px(ctx, ox + 4, 11, PAL.grassLight);
}

function drawHerb(ctx, ox) {
  drawGrass(ctx, ox, 1);
  const plants = [[5, 12], [8, 13], [11, 11]];
  for (const [x, y] of plants) {
    ctx.fillStyle = '#3f7a2e';
    ctx.fillRect(ox + x, y - 3, 1, 4);
    px(ctx, ox + x - 1, y - 2, PAL.leaf);
    px(ctx, ox + x + 1, y - 3, PAL.leaf);
    px(ctx, ox + x - 1, y - 1, PAL.leafDark);
    px(ctx, ox + x + 1, y - 2, PAL.leafDark);
  }
  px(ctx, ox + 8, 7, PAL.flower);
  px(ctx, ox + 8, 8, PAL.leafDark);
}

function drawPlank(ctx, ox) {
  for (let by = 0; by < 4; by++) {
    const y0 = by * 4;
    ctx.fillStyle = PAL.plankA;
    ctx.fillRect(ox, y0, TILE, 4);
    ctx.fillStyle = PAL.plankLight;
    ctx.fillRect(ox, y0, TILE, 1);
    ctx.fillStyle = PAL.plankLine;
    ctx.fillRect(ox, y0 + 3, TILE, 1);
    const jx = by % 2 ? 5 : 11;
    px(ctx, ox + jx, y0 + 1, PAL.plankLine);
    px(ctx, ox + jx, y0 + 2, PAL.plankLine);
    px(ctx, ox + 2, y0 + 1, PAL.plankLine);
    px(ctx, ox + 13, y0 + 1, PAL.plankLine);
    for (let x = 0; x < TILE; x++) {
      if (hash(x, by, 12) % 9 === 0) px(ctx, ox + x, y0 + 2, PAL.plankGrain);
    }
  }
}

function drawWall(ctx, ox) {
  // Thân gỗ dựng đứng: 4 cột, sáng trái / tối phải
  for (let c = 0; c < 4; c++) {
    const x0 = c * 4;
    ctx.fillStyle = PAL.wallA;
    ctx.fillRect(ox + x0, 0, 4, TILE);
    ctx.fillStyle = PAL.wallLight;
    ctx.fillRect(ox + x0, 0, 1, TILE);
    ctx.fillStyle = PAL.wallLine;
    ctx.fillRect(ox + x0 + 3, 0, 1, TILE);
    if (hash(c, 2, 14) % 3 === 0) px(ctx, ox + x0 + 1, 5 + (c * 3) % 7, PAL.wallLine);
  }
  ctx.fillStyle = PAL.wallLine;
  ctx.fillRect(ox, 0, TILE, 1);
  ctx.fillRect(ox, TILE - 1, TILE, 1);
}

function drawFloor(ctx, ox) {
  for (let by = 0; by < 4; by++) {
    const y0 = by * 4;
    ctx.fillStyle = by % 2 ? PAL.floorB : PAL.floorA;
    ctx.fillRect(ox, y0, TILE, 4);
    ctx.fillStyle = PAL.floorLine;
    ctx.fillRect(ox, y0 + 3, TILE, 1);
    px(ctx, ox + (by % 2 ? 4 : 12), y0, PAL.floorLine);
    px(ctx, ox + (by % 2 ? 4 : 12), y0 + 1, PAL.floorLine);
    for (let x = 0; x < TILE; x++) {
      if (hash(x, by, 15) % 8 === 0) px(ctx, ox + x, y0 + 1, PAL.plankLight);
    }
  }
}

// Bếp lửa: 2 khung (f = 0/1) để ngọn lửa nhấp nháy.
// Quầy hàng: mái bạt sọc đỏ–kem ở trên, bàn gỗ tối ở dưới.
function drawStall(ctx, ox) {
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      let col;
      if (y < 6) col = (Math.floor(x / 4) % 2 === 0) ? PAL.emberDark : PAL.wallLight;
      else if (y === 6) col = PAL.outline;
      else if (y === 15) col = PAL.outline;
      else if (x === 0 || x === 15) col = PAL.plankLine;
      else col = PAL.plankA;
      px(ctx, ox + x, y, col);
    }
  }
}

function drawFire(ctx, ox, f) {
  drawGrass(ctx, ox, 0);
  // Vòng đá có khối sáng/tối
  for (const [x, y] of [[2, 11], [5, 13], [9, 13], [12, 11]]) {
    ctx.fillStyle = PAL.rockA;
    ctx.fillRect(ox + x, y, 2, 2);
    px(ctx, ox + x, y, PAL.rockLight);
    px(ctx, ox + x + 1, y + 1, PAL.rockDark);
  }
  // Củi chéo
  ctx.fillStyle = PAL.mudA;
  ctx.fillRect(ox + 4, 12, 8, 2);
  px(ctx, ox + 4, 12, PAL.mudDark);
  px(ctx, ox + 11, 13, PAL.mudDark);
  ctx.fillStyle = PAL.mudB;
  ctx.fillRect(ox + 5, 12, 6, 1);
  // Ngọn lửa: lõi vàng ở gốc, cam giữa, đỏ ở đỉnh
  const heights = f ? [4, 7, 9, 8, 6, 4] : [5, 8, 8, 9, 7, 5];
  heights.forEach((h, i) => {
    const x = 5 + i;
    for (let k = 0; k < h; k++) {
      const t = k / h;
      const col = t < 0.4 ? PAL.emberCore : t < 0.75 ? PAL.emberMid : PAL.ember;
      px(ctx, ox + x, 10 - k, col);
    }
    if (h >= 8) px(ctx, ox + x, 10 - h, PAL.emberDark);
  });
  px(ctx, ox + 7 + f, 2, PAL.emberCore);
  px(ctx, ox + 8 - f, 1, PAL.emberMid);
}

function drawSpikes(ctx, ox) {
  drawGrass(ctx, ox, 0);
  for (let i = 0; i < 4; i++) {
    const x = 2 + i * 4;
    for (let y = 5; y < 15; y++) {
      const w = Math.max(0, 1 - Math.floor((y - 5) / 4));
      for (let k = -w; k <= w; k++) {
        const col = k < 0 ? PAL.plankLight : k > 0 ? PAL.plankLine : PAL.plankA;
        px(ctx, ox + x + k + 1, y, col);
      }
    }
    px(ctx, ox + x + 1, 4, PAL.plankLine);
  }
  ctx.fillStyle = PAL.plankLine;
  ctx.fillRect(ox, 14, TILE, 1);
}

function drawLamp(ctx, ox) {
  drawGrass(ctx, ox, 1);
  // Quầng sáng mờ quanh đèn
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = PAL.emberMid;
  ctx.fillRect(ox + 3, 1, 10, 10);
  ctx.globalAlpha = 1;
  ctx.fillStyle = PAL.plankLine;
  ctx.fillRect(ox + 7, 7, 2, 9);
  ctx.fillRect(ox + 5, 2, 6, 1);
  ctx.fillRect(ox + 5, 8, 6, 1);
  ctx.fillStyle = PAL.ember;
  ctx.fillRect(ox + 5, 3, 6, 5);
  ctx.fillStyle = PAL.emberCore;
  ctx.fillRect(ox + 6, 4, 4, 3);
  px(ctx, ox + 6, 3, PAL.emberMid);
  px(ctx, ox + 9, 3, PAL.emberMid);
}

function drawDrying(ctx, ox) {
  drawGrass(ctx, ox, 0);
  ctx.fillStyle = PAL.plankLine;
  ctx.fillRect(ox + 2, 4, 2, 11);
  ctx.fillRect(ox + 12, 4, 2, 11);
  ctx.fillRect(ox + 2, 4, 12, 1);
  for (let i = 0; i < 3; i++) {
    const x = 4 + i * 3;
    ctx.fillStyle = '#d9a86a';
    ctx.fillRect(ox + x, 6, 2, 6);
    px(ctx, ox + x, 6, '#e8c08a');
    px(ctx, ox + x, 12, PAL.sandDark);
    px(ctx, ox + x + 1, 9, PAL.sandDark);
  }
}

// Cờ làng: 2 khung để cờ phất gió.
function drawFlag(ctx, ox, f) {
  drawGrass(ctx, ox, 1);
  ctx.fillStyle = PAL.plankLine;
  ctx.fillRect(ox + 4, 1, 1, 15);
  for (let r = 0; r < 5; r++) {
    const x0 = 5 + (f ? (r % 2) : 0);
    const col = r === 0 ? '#e0705a' : r === 4 ? '#8a3a2a' : '#c0503a';
    ctx.fillStyle = col;
    ctx.fillRect(ox + x0, 2 + r, 7, 1);
  }
  px(ctx, ox + 8, 4, PAL.flower);
  px(ctx, ox + 7, 3, PAL.flower);
  px(ctx, ox + 9, 3, PAL.flower);
}

function drawTrap(ctx, ox) {
  drawWater(ctx, ox, 0);
  // Lồng tre nổi trên mặt nước
  ctx.fillStyle = PAL.plankA;
  ctx.fillRect(ox + 3, 5, 10, 7);
  ctx.fillStyle = PAL.plankLight;
  ctx.fillRect(ox + 3, 5, 10, 1);
  ctx.fillStyle = PAL.plankLine;
  for (let x = 3; x <= 12; x += 3) ctx.fillRect(ox + x, 5, 1, 7);
  for (let y = 5; y <= 11; y += 3) ctx.fillRect(ox + 3, y, 10, 1);
  ctx.fillStyle = PAL.plankLine;
  ctx.fillRect(ox + 3, 11, 10, 1);
  ctx.fillStyle = PAL.foamW;
  ctx.fillRect(ox + 2, 12, 12, 1);
}

// ---------------- Sinh vật & nhân vật ----------------

// Nhân vật 16x24 (phong cách Stardew: 1 tile rộng, 1.5 tile cao).
// Ký tự: . trong suốt | h nón | H nón tối | s da | e mắt | b áo | c áo sáng | B áo tối
//        | w thắt lưng | p quần | P quần sáng | k giày
const PLAYER_PALETTE = {
  h: '#e0bd6a', H: '#a5813a', s: '#f0c8a0', e: '#1a1a1a',
  b: '#3d6f9e', c: '#5a8fbf', B: '#2b4f73', w: '#5c4423',
  p: '#3a3a4a', P: '#4d4d60', k: '#2a1d12',
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
  '...scbbbbbbbs...',
  '...scbbbbbbbs...',
  '...scbbbbbbbs...',
  '...bbwwwwwwbb...',
  '...bBBBBBBBBb...',
  '.....pppppp.....',
];
// Hai frame chân: A (chụm) / B (dang) để tạo cảm giác đi bộ. Mỗi frame 8 hàng.
const LEGS_A = [
  '.....pPp.pPp....',
  '.....ppp.ppp....',
  '.....ppp.ppp....',
  '.....kkk.kkk....',
  '.....kkk.kkk....',
  '................',
  '................',
  '................',
];
const LEGS_B = [
  '....pPp...pPp...',
  '....ppp...ppp...',
  '....ppp...ppp...',
  '....kkk...kkk...',
  '....kkk...kkk...',
  '................',
  '................',
  '................',
];

// bob = true: thân nhấc lên 1px (lúc chân chụm giữa hai bước).
// Chân đối xứng với LEGS_B (bước sang phải) cho chu kỳ đi bộ 4 khung.
const LEGS_C = LEGS_B.map((r) => [...r].reverse().join(''));

function playerCells(legs, bob = false) {
  const body = bob ? [...PLAYER_BODY.slice(1), '................'] : PLAYER_BODY;
  const rows = [...body, ...legs.slice(0, 8)];
  return rows.map((r) => Array.from({ length: 16 }, (_, x) => {
    const ch = r[x];
    return ch && ch !== '.' && PLAYER_PALETTE[ch] ? PLAYER_PALETTE[ch] : null;
  }));
}

function crabCells(f) {
  const c = blank(16, 12);
  const body = '#c0503a', hi = '#e07a5e', dark = '#7a2e22', eye = '#1a1a1a';
  rectCells(c, 4, 4, 8, 5, body);
  rectCells(c, 4, 4, 8, 1, hi);
  rectCells(c, 4, 8, 8, 1, dark);
  setCell(c, 6, 2, dark); setCell(c, 9, 2, dark);
  setCell(c, 6, 3, eye); setCell(c, 9, 3, eye);
  // Càng: khung 0 nâng cao, khung 1 hạ thấp
  const cy = f ? 5 : 2;
  rectCells(c, 0, cy, 3, 3, body);
  rectCells(c, 13, cy, 3, 3, body);
  setCell(c, 0, cy - 1, hi); setCell(c, 15, cy - 1, hi);
  setCell(c, 2, cy + 1, dark); setCell(c, 13, cy + 1, dark);
  rectCells(c, 3, 4 + f, 1, 2, body);
  rectCells(c, 12, 4 + f, 1, 2, body);
  // Chân nhúc nhích theo khung
  const lo = f ? 10 : 9;
  for (let i = 0; i < 3; i++) {
    setCell(c, 2 + i, lo, dark); setCell(c, 2 + i, lo + 1, dark);
    setCell(c, 11 + i, lo, dark); setCell(c, 11 + i, lo + 1, dark);
  }
  return c;
}

function snakeCells(f) {
  const c = blank(16, 8);
  const body = '#4f7a2e', dark = '#2a4418', belly = '#c9c86a', eye = '#1a1a1a';
  for (let x = 2; x < 13; x++) {
    const y = 3 + Math.round(Math.sin(x * 0.8 + f * 1.6) * 1.2);
    setCell(c, x, y, x % 3 === 0 ? dark : body);
    setCell(c, x, y + 1, belly);
  }
  const yh = 3 + Math.round(Math.sin(12 * 0.8 + f * 1.6) * 1.2);
  rectCells(c, 13, yh - 1, 2, 2, body);
  setCell(c, 14, yh - 1, eye);
  setCell(c, 15, yh, '#ff6b35');
  return c;
}

function makePlayerFrame(ctx, ox, legs, bob = false) {
  drawCells(ctx, ox, playerCells(legs, bob));
}

// ---------------- Bộ tile ----------------

export function generateTextures(scene) {
  const tex = scene.textures;

  // ---- Tileset ----
  const tileCanvas = document.createElement('canvas');
  tileCanvas.width = TILE * TILE_COUNT;
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
  drawFire(tctx, 15 * TILE, 0);
  drawSpikes(tctx, 16 * TILE);
  drawLamp(tctx, 17 * TILE);
  drawDrying(tctx, 18 * TILE);
  drawFlag(tctx, 19 * TILE, 0);
  drawTrap(tctx, 20 * TILE);
  drawMarsh(tctx, 21 * TILE);
  drawCoc(tctx, 22 * TILE);
  drawFire(tctx, 23 * TILE, 1);
  drawFlag(tctx, 24 * TILE, 1);
  drawPlank(tctx, 25 * TILE);
  drawStall(tctx, 26 * TILE);
  tex.addCanvas('tiles', tileCanvas);
  const tTex = tex.get('tiles');
  for (let i = 0; i < TILE_COUNT; i++) tTex.add(String(i), 0, i * TILE, 0, TILE, TILE);

  // ---- Nhân vật: 2 frame đi bộ (32x24 gồm 2 ô 16x24) ----
  const pCanvas = document.createElement('canvas');
  pCanvas.width = 64;
  pCanvas.height = 24;
  const pctx = pCanvas.getContext('2d');
  // 0 đứng yên · 1 bước trái · 2 thân nhấc (chụm) · 3 bước phải
  makePlayerFrame(pctx, 0, LEGS_A);
  makePlayerFrame(pctx, 16, LEGS_B);
  makePlayerFrame(pctx, 32, LEGS_A, true);
  makePlayerFrame(pctx, 48, LEGS_C);
  tex.addCanvas('player', pCanvas);
  const pTex = tex.get('player');
  pTex.add('0', 0, 0, 0, 16, 24);
  pTex.add('1', 0, 16, 0, 16, 24);
  pTex.add('2', 0, 32, 0, 16, 24);
  pTex.add('3', 0, 48, 0, 16, 24);

  // ---- Cua đá: 2 frame (càng nâng / hạ) ----
  const cCanvas = document.createElement('canvas');
  cCanvas.width = 32;
  cCanvas.height = 12;
  const cctx = cCanvas.getContext('2d');
  drawCells(cctx, 0, crabCells(0));
  drawCells(cctx, 16, crabCells(1));
  tex.addCanvas('crab', cCanvas);
  const cTex = tex.get('crab');
  cTex.add('0', 0, 0, 0, 16, 12);
  cTex.add('1', 0, 16, 0, 16, 12);

  // ---- Rắn nước: 2 frame (uốn lượn) ----
  const sCanvas = document.createElement('canvas');
  sCanvas.width = 32;
  sCanvas.height = 8;
  const sctx = sCanvas.getContext('2d');
  drawCells(sctx, 0, snakeCells(0));
  drawCells(sctx, 16, snakeCells(1));
  tex.addCanvas('snake', sCanvas);
  const sTex = tex.get('snake');
  sTex.add('0', 0, 0, 0, 16, 8);
  sTex.add('1', 0, 16, 0, 16, 8);

  // ---- Hạt mưa (1 pixel) ----
  const rCanvas = document.createElement('canvas');
  rCanvas.width = 1;
  rCanvas.height = 1;
  const rctx = rCanvas.getContext('2d');
  rctx.fillStyle = '#9fc7e0';
  rctx.fillRect(0, 0, 1, 1);
  tex.addCanvas('drop', rCanvas);

  // ---- Vignette: làm tối mép màn hình (phủ toàn khung, scroll cố định) ----
  const vCanvas = document.createElement('canvas');
  vCanvas.width = 256;
  vCanvas.height = 144;
  const vctx = vCanvas.getContext('2d');
  const grad = vctx.createRadialGradient(128, 72, 70, 128, 72, 170);
  grad.addColorStop(0, 'rgba(3,8,18,0)');
  grad.addColorStop(0.6, 'rgba(3,8,18,0.12)');
  grad.addColorStop(1, 'rgba(3,8,18,0.7)');
  vctx.fillStyle = grad;
  vctx.fillRect(0, 0, 256, 144);
  tex.addCanvas('vignette', vCanvas);
}

export const PALETTE_HEX = PAL;
