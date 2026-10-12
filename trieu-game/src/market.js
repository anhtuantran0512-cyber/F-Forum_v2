// Chợ nổi: thương lái đổi đồ lấy đồ (không có tiền).
// Mỗi ngày, mỗi thương lái bày OFFERS_PER_DAY kèo chọn từ kho kèo (pool) của họ.
// Mỗi kèo chỉ đổi được DAILY_STOCK lần mỗi ngày. Mọi kèo đều không làm tăng tổng
// giá trị (xem itemValue), nên đổi qua lại không tạo ra đồ từ hư không.
import { ITEMS } from './items.js';
import { mulberry32 } from './world.js';

export const DAILY_STOCK = 2;
export const OFFERS_PER_DAY = 3;

// Giá trị đổi theo nhóm vật phẩm: dùng để kiểm tra cân bằng kèo.
const CAT_VALUE = {
  resource: 1, ammo: 1, food: 2, medicine: 2, weapon: 3, rare: 4, armor: 4, vehicle: 8,
};

export const TRADERS = [
  {
    name: 'Bà Hến', tile: { x: 45, y: 28 }, tint: 0xffb36b,
    pool: [
      { give: { shell: 3 }, get: { muoi: 1 } },
      { give: { fish: 2 }, get: { herb: 3 } },
      { give: { cua: 2 }, get: { vine: 3 } },
      { give: { tom: 2 }, get: { wood: 3 } },
      { give: { charcoal: 2 }, get: { stone: 2 } },
      { give: { herb: 3 }, get: { bark: 2 } },
    ],
  },
  {
    name: 'Ông Ghe', tile: { x: 49, y: 28 }, tint: 0x9fd0ff,
    pool: [
      { give: { wood: 4 }, get: { reed: 4 } },
      { give: { stone: 3 }, get: { vine: 2 } },
      { give: { reed: 4 }, get: { muoi: 2 } },
      { give: { vine: 3 }, get: { wood: 2, stone: 1 } },
      { give: { rootcoc: 3 }, get: { herb: 3 } },
      { give: { wood: 3, vine: 1 }, get: { lua: 1 } },
    ],
  },
  {
    name: 'Chị Lụa', tile: { x: 52, y: 28 }, tint: 0xf0a0ff,
    pool: [
      { give: { pearl: 1 }, get: { lua: 1 } },
      { give: { coral: 1 }, get: { bandage: 1, herb: 2 } },
      { give: { cagold: 1 }, get: { muoi: 3 } },
      { give: { cakho: 2 }, get: { remedy: 1 } },
      { give: { tom: 3 }, get: { ginger: 1 } },
      { give: { charcoal: 2 }, get: { charcoalPill: 1 } },
    ],
  },
];

export function itemValue(id) {
  const d = ITEMS[id];
  if (!d) throw new Error('Vật phẩm không tồn tại: ' + id);
  return CAT_VALUE[d.cat] ?? 1;
}

export function sideValue(side) {
  return Object.entries(side).reduce((sum, [id, n]) => sum + itemValue(id) * n, 0);
}

export function describeSide(side) {
  return Object.entries(side).map(([id, n]) => `${n} ${ITEMS[id].name}`).join(' + ');
}

export function describeOffer(offer) {
  return `${describeSide(offer.give)} → ${describeSide(offer.get)}`;
}

export function newMarketState() {
  return { day: 0, used: {} };
}

// Sang ngày mới thì làm mới lượt đổi của mọi kèo.
export function rollMarket(state, day) {
  if (state.day !== day) {
    state.day = day;
    state.used = {};
  }
  return state;
}

// Chỉ số các kèo được bày hôm nay (cố định trong một ngày, đổi theo ngày).
export function todaysOffers(traderIdx, day) {
  const pool = TRADERS[traderIdx].pool;
  const rnd = mulberry32(day * 1009 + traderIdx * 7919 + 17);
  const idx = pool.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, OFFERS_PER_DAY).sort((a, b) => a - b);
}

export function stockLeft(state, traderIdx, offerIdx) {
  return DAILY_STOCK - (state.used[`${traderIdx}:${offerIdx}`] || 0);
}

// Kiểm tra đủ đồ để đổi kèo; không thay đổi túi đồ.
export function checkTrade(inv, offer) {
  for (const [id, n] of Object.entries(offer.give)) {
    const have = inv[id] || 0;
    if (have < n) return { ok: false, reason: `Thiếu ${ITEMS[id].name} (cần ${n}, có ${have}).` };
  }
  return { ok: true, reason: '' };
}

// Thực hiện đổi: trừ đồ đưa, cộng đồ nhận, ghi nhận lượt dùng trong ngày.
export function executeTrade(state, inv, traderIdx, offerIdx, day) {
  rollMarket(state, day);
  const trader = TRADERS[traderIdx];
  const offer = trader?.pool[offerIdx];
  if (!offer) return { ok: false, reason: 'Kèo không tồn tại.' };
  if (!todaysOffers(traderIdx, day).includes(offerIdx)) return { ok: false, reason: 'Kèo này không được bày hôm nay.' };
  if (stockLeft(state, traderIdx, offerIdx) <= 0) return { ok: false, reason: 'Kèo này đã hết lượt hôm nay.' };
  const c = checkTrade(inv, offer);
  if (!c.ok) return c;
  for (const [id, n] of Object.entries(offer.give)) inv[id] -= n;
  for (const [id, n] of Object.entries(offer.get)) inv[id] = (inv[id] || 0) + n;
  const key = `${traderIdx}:${offerIdx}`;
  state.used[key] = (state.used[key] || 0) + 1;
  return { ok: true, reason: '', offer };
}
