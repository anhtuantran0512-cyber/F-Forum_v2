// Bản đồ thượng nguồn + hệ thống triều.
// Ký hiệu ô (type):
//   W  nước sâu (luôn ngập)        B  bờ bùn/cát (có thể bị ngập khi triều lên)
//   G  cỏ                          T  cây (chặn, cho gỗ)
//   R  đá (chặn)                   S  sậy (cho sậy, đi qua được)
//   H  thảo dược (cho thảo dược)   P  sàn tre do người chơi xây
//   X  tường nhà sàn (chặn)        F  sàn gỗ trong nhà (che mưa)

export const TILE = 16;
export const MAP_W = 64;
export const MAP_H = 44;
export const RIVER_CX = 32;        // cột trung tâm con sông
export const FORD_Y0 = 18;         // bãi cạn (ford): không có nước, qua sông được quanh năm
export const FORD_Y1 = 21;
export const TIDE_PERIOD = 100;    // giây thực tế cho 1 chu kỳ triều (demo; thiết kế gốc dài hơn)
export const DAY_LENGTH = 240;     // giây thực tế cho 1 ngày
export const HOUSE = { x: 8, y: 7, w: 6, h: 5 }; // nhà sàn an toàn (xa sông, trên cao)
// Vùng Đầm Lầy (tây bắc): bùn lầy đi chậm, cây cốc, nhiều muỗi, sương mù động.
export const SWAMP = { x0: 0, x1: 15, y0: 0, y1: 6 };
export function inSwamp(tx, ty) {
  return tx >= SWAMP.x0 && tx <= SWAMP.x1 && ty >= SWAMP.y0 && ty <= SWAMP.y1;
}
// Chợ nổi (bờ đông, xa sông): vùng an toàn, không có cua. Ký hiệu: D sàn chợ, Q quầy hàng.
export const MARKET = { x0: 44, x1: 53, y0: 26, y1: 33 };
export function inMarket(tx, ty) {
  return tx >= MARKET.x0 && tx <= MARKET.x1 && ty >= MARKET.y0 && ty <= MARKET.y1;
}

// PRNG có seed để bản đồ luôn giống nhau mỗi lần chơi.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function isFordRow(ty) {
  return ty >= FORD_Y0 && ty <= FORD_Y1;
}

export function buildMap(seed = 2026) {
  const rnd = mulberry32(seed);
  const grid = [];
  for (let y = 0; y < MAP_H; y++) {
    const row = [];
    for (let x = 0; x < MAP_W; x++) {
      const d = Math.abs(x - RIVER_CX);
      const ford = isFordRow(y);
      let t;
      if (d <= 1 && !ford) t = 'W';
      else if (d <= 6) t = 'B';
      else if (d <= 8) t = rnd() < 0.5 ? 'S' : 'G';
      else {
        const r = rnd();
        t = r < 0.07 ? 'T' : r < 0.085 ? 'R' : r < 0.13 ? 'H' : 'G';
      }
      row.push(t);
    }
    grid.push(row);
  }

  // Đầm lầy: bùn lầy (M) là phần lớn, xen cây cốc (C) và cây (T).
  for (let y = SWAMP.y0; y <= SWAMP.y1; y++) {
    for (let x = SWAMP.x0; x <= SWAMP.x1; x++) {
      const r = rnd();
      grid[y][x] = r < 0.7 ? 'M' : r < 0.88 ? 'C' : 'T';
    }
  }

  // Nhà sàn khởi đầu: tường bao quanh, cửa ở giữa cạnh dưới, sàn gỗ bên trong.
  for (let y = HOUSE.y; y < HOUSE.y + HOUSE.h; y++) {
    for (let x = HOUSE.x; x < HOUSE.x + HOUSE.w; x++) {
      const edge = x === HOUSE.x || x === HOUSE.x + HOUSE.w - 1 || y === HOUSE.y || y === HOUSE.y + HOUSE.h - 1;
      grid[y][x] = edge ? 'X' : 'F';
    }
  }
  const doorX = HOUSE.x + Math.floor(HOUSE.w / 2);
  grid[HOUSE.y + HOUSE.h - 1][doorX] = 'F';

  // Dọn sạch khu quanh nhà và khu xuất phát để người chơi không bị kẹt.
  for (let y = HOUSE.y - 2; y < HOUSE.y + HOUSE.h + 3; y++) {
    for (let x = HOUSE.x - 2; x < HOUSE.x + HOUSE.w + 3; x++) {
      if (grid[y]?.[x] === 'T' || grid[y]?.[x] === 'R' || grid[y]?.[x] === 'H') grid[y][x] = 'G';
    }
  }
  stampMarket(grid);
  return grid;
}

// Dựng chợ: dọn cây quanh chợ, lát sàn, đặt quầy (chặn) và cờ ở góc.
// Dùng cả khi tải bản lưu cũ (chưa có chợ).
export function stampMarket(grid) {
  for (let y = MARKET.y0 - 2; y <= MARKET.y1 + 2; y++) {
    for (let x = MARKET.x0 - 4; x <= MARKET.x1 + 2; x++) {
      if (grid[y]?.[x] === 'T' || grid[y]?.[x] === 'R' || grid[y]?.[x] === 'H') grid[y][x] = 'G';
    }
  }
  for (let y = MARKET.y0; y <= MARKET.y1; y++) {
    for (let x = MARKET.x0; x <= MARKET.x1; x++) grid[y][x] = 'D';
  }
  for (const x of [45, 46, 49, 50, 52, 53]) grid[27][x] = 'Q';
  grid[MARKET.y1][MARKET.x0] = 'FLAG';
  grid[MARKET.y1][MARKET.x1] = 'FLAG';
  return grid;
}

// Mực nước hiện tại (tính theo số ô từ tâm sông). Nước lên xuống sinusoid.
export function tideLevel(t) {
  return (1 - Math.cos((2 * Math.PI * t) / TIDE_PERIOD)) / 2; // 0 = triều thấp, 1 = triều cường
}
export function tideHalfWidth(t) {
  return 1 + 4.5 * tideLevel(t); // 1..5.5 ô mỗi bên tâm sông
}
export function tideRising(t) {
  return Math.sin((2 * Math.PI * t) / TIDE_PERIOD) > 0;
}
export function nextLowTide(t) {
  return (Math.floor(t / TIDE_PERIOD) + 1) * TIDE_PERIOD;
}

export function distToRiver(tx) {
  return Math.abs(tx - RIVER_CX);
}
