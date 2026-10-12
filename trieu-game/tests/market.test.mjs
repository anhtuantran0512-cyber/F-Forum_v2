// Kiểm thử đơn vị cho Chợ nổi (chạy: npm test). Không cần trình duyệt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, RECIPES } from '../src/items.js';
import {
  TRADERS, DAILY_STOCK, OFFERS_PER_DAY, itemValue, sideValue, newMarketState,
  rollMarket, todaysOffers, stockLeft, checkTrade, executeTrade, describeOffer,
} from '../src/market.js';
import { buildMap, stampMarket, MARKET, inMarket, MAP_W, MAP_H, distToRiver, isFordRow, HOUSE } from '../src/world.js';

const BLOCKED = new Set(['T', 'R', 'X', 'K', 'SP', 'LM', 'DR', 'FLAG', 'TR', 'Q', 'W']);

function walkable(grid, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return false;
  const t = grid[ty][tx];
  if (BLOCKED.has(t)) return false;
  // Sông: cột gần tâm là nước, trừ bãi cạn (ford).
  if (distToRiver(tx) <= 1 && !isFordRow(ty)) return false;
  return true;
}

function reachable(grid, from) {
  const seen = new Set([from.x + ',' + from.y]);
  const q = [from];
  while (q.length) {
    const { x, y } = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (seen.has(k) || !walkable(grid, nx, ny)) continue;
      seen.add(k);
      q.push({ x: nx, y: ny });
    }
  }
  return seen;
}

test('mọi kèo dùng vật phẩm có thật và số lượng dương', () => {
  for (const tr of TRADERS) {
    for (const offer of tr.pool) {
      for (const side of [offer.give, offer.get]) {
        for (const [id, n] of Object.entries(side)) {
          assert.ok(ITEMS[id], `vật phẩm không tồn tại: ${id}`);
          assert.ok(Number.isInteger(n) && n > 0, `số lượng sai cho ${id}`);
        }
      }
    }
  }
});

test('không kèo nào làm tăng tổng giá trị (không tạo đồ từ hư không)', () => {
  for (const tr of TRADERS) {
    for (const offer of tr.pool) {
      const give = sideValue(offer.give), get = sideValue(offer.get);
      assert.ok(get <= give, `kèo tăng giá trị: ${describeOffer(offer)} (${give} → ${get})`);
    }
  }
});

test('mỗi thương lái có kho kèo đủ lớn để chọn 3 kèo mỗi ngày', () => {
  for (const tr of TRADERS) assert.ok(tr.pool.length > OFFERS_PER_DAY);
});

test('kèo trong ngày: 3 kèo khác nhau, sắp xếp, cố định trong cùng một ngày', () => {
  for (let ti = 0; ti < TRADERS.length; ti++) {
    for (let day = 1; day <= 20; day++) {
      const a = todaysOffers(ti, day);
      const b = todaysOffers(ti, day);
      assert.deepEqual(a, b);
      assert.equal(a.length, OFFERS_PER_DAY);
      assert.equal(new Set(a).size, OFFERS_PER_DAY);
      assert.deepEqual([...a].sort((x, y) => x - y), a);
      for (const i of a) assert.ok(i >= 0 && i < TRADERS[ti].pool.length);
    }
  }
});

test('kèo thay đổi theo ngày', () => {
  const sets = new Set();
  for (let day = 1; day <= 20; day++) sets.add(todaysOffers(0, day).join(','));
  assert.ok(sets.size > 3, 'kèo gần như không đổi qua các ngày');
});

test('đổi kèo: trừ đồ đưa, cộng đồ nhận, hết lượt sau DAILY_STOCK lần', () => {
  const ti = 2; // Chị Lụa
  const day = 5;
  const offerIdx = todaysOffers(ti, day)[0];
  const offer = TRADERS[ti].pool[offerIdx];
  const inv = Object.fromEntries(Object.keys(ITEMS).map((id) => [id, 0]));
  for (const [id, n] of Object.entries(offer.give)) inv[id] = n * (DAILY_STOCK + 1);
  const state = newMarketState();
  for (let i = 0; i < DAILY_STOCK; i++) {
    const r = executeTrade(state, inv, ti, offerIdx, day);
    assert.equal(r.ok, true, r.reason);
  }
  assert.equal(stockLeft(state, ti, offerIdx), 0);
  const last = executeTrade(state, inv, ti, offerIdx, day);
  assert.equal(last.ok, false);
  assert.match(last.reason, /hết lượt/);
  for (const [id, n] of Object.entries(offer.get)) assert.equal(inv[id] >= n * DAILY_STOCK, true);
  for (const [id, n] of Object.entries(offer.give)) assert.equal(inv[id], n);
});

test('sang ngày mới thì lượt đổi được làm mới', () => {
  const ti = 0;
  // Tìm một kèo được bày cả hôm nay lẫn hôm sau.
  let day = 7, offerIdx = -1;
  for (let d = 7; d < 60 && offerIdx < 0; d++) {
    const common = todaysOffers(ti, d).find((i) => todaysOffers(ti, d + 1).includes(i));
    if (common !== undefined) { day = d; offerIdx = common; }
  }
  assert.ok(offerIdx >= 0, 'không tìm được kèo lặp qua 2 ngày');
  const offer = TRADERS[ti].pool[offerIdx];
  const inv = Object.fromEntries(Object.keys(ITEMS).map((id) => [id, 0]));
  for (const [id, n] of Object.entries(offer.give)) inv[id] = n * 10;
  const state = newMarketState();
  for (let i = 0; i < DAILY_STOCK; i++) executeTrade(state, inv, ti, offerIdx, day);
  assert.equal(executeTrade(state, inv, ti, offerIdx, day).ok, false);
  const next = executeTrade(state, inv, ti, offerIdx, day + 1);
  assert.equal(next.ok, true, next.reason);
});

test('thiếu đồ thì không đổi và túi đồ giữ nguyên', () => {
  const ti = 1, day = 3;
  const offerIdx = todaysOffers(ti, day)[0];
  const inv = Object.fromEntries(Object.keys(ITEMS).map((id) => [id, 0]));
  const before = JSON.stringify(inv);
  const r = executeTrade(newMarketState(), inv, ti, offerIdx, day);
  assert.equal(r.ok, false);
  assert.match(r.reason, /Thiếu/);
  assert.equal(JSON.stringify(inv), before);
});

test('không đổi được kèo không bày hôm nay', () => {
  const ti = 0, day = 4;
  const today = todaysOffers(ti, day);
  const hidden = TRADERS[ti].pool.findIndex((_, i) => !today.includes(i));
  const inv = Object.fromEntries(Object.keys(ITEMS).map((id) => [id, 99]));
  const r = executeTrade(newMarketState(), inv, ti, hidden, day);
  assert.equal(r.ok, false);
});

test('rollMarket chỉ reset khi đổi ngày', () => {
  const st = newMarketState();
  rollMarket(st, 2);
  st.used['0:1'] = 2;
  rollMarket(st, 2);
  assert.equal(st.used['0:1'], 2);
  rollMarket(st, 3);
  assert.deepEqual(st.used, {});
});

test('checkTrade báo đúng thiếu gì', () => {
  const offer = { give: { shell: 3 }, get: { muoi: 1 } };
  assert.equal(checkTrade({ shell: 3 }, offer).ok, true);
  const r = checkTrade({ shell: 2 }, offer);
  assert.equal(r.ok, false);
  assert.match(r.reason, /Ốc hến/);
});

test('giá trị vật phẩm: mọi vật phẩm đều có nhóm hợp lệ', () => {
  for (const id of Object.keys(ITEMS)) assert.ok(itemValue(id) > 0);
});

test('công thức Cá muối và Áo lụa dùng nguyên liệu có thật', () => {
  for (const out of ['camuoi', 'aolua']) {
    const r = RECIPES.find((x) => x.out === out);
    assert.ok(r, `thiếu công thức ${out}`);
    for (const id of Object.keys(r.need)) assert.ok(ITEMS[id], `thiếu nguyên liệu ${id}`);
  }
});

test('bản đồ: chợ có 6 quầy, sàn, và các thương lái đứng trên sàn', () => {
  const grid = buildMap(2026);
  let q = 0, d = 0;
  for (let y = MARKET.y0; y <= MARKET.y1; y++) {
    for (let x = MARKET.x0; x <= MARKET.x1; x++) {
      if (grid[y][x] === 'Q') q++;
      if (grid[y][x] === 'D') d++;
    }
  }
  assert.equal(q, 6);
  assert.ok(d > 30);
  for (const tr of TRADERS) {
    assert.equal(grid[tr.tile.y][tr.tile.x], 'D', `${tr.name} không đứng trên sàn`);
    assert.ok(inMarket(tr.tile.x, tr.tile.y));
  }
});

test('mọi thương lái đi tới được từ nhà sàn (qua bãi cạn)', () => {
  const grid = buildMap(2026);
  const start = { x: HOUSE.x + Math.floor(HOUSE.w / 2), y: HOUSE.y + HOUSE.h - 2 };
  assert.ok(walkable(grid, start.x, start.y), 'điểm xuất phát không đi được');
  const seen = reachable(grid, start);
  for (const tr of TRADERS) {
    const adj = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((tr.tile.x + dx) + ',' + (tr.tile.y + dy)));
    assert.ok(adj, `${tr.name} không tới được`);
  }
});

test('bản lưu cũ (chưa có chợ): dựng lại chợ, và dựng lại lần nữa vẫn giống nhau', () => {
  const grid = buildMap(2026);
  // Giả lập bản lưu cũ: khu chợ còn cây và cỏ.
  for (let y = MARKET.y0; y <= MARKET.y1; y++) for (let x = MARKET.x0; x <= MARKET.x1; x++) grid[y][x] = 'T';
  stampMarket(grid);
  const once = JSON.stringify(grid);
  assert.equal(grid[27][45], 'Q');
  stampMarket(grid);
  assert.equal(JSON.stringify(grid), once);
});
