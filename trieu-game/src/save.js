// Lưu / tải tiến trình bằng localStorage (một slot, phiên bản 1).
// Lưu: thời gian, bản đồ (đã biến đổi), túi đồ, trang bị, kỹ năng, chỉ số sinh tồn, vị trí, thời tiết, bẫy.

const KEY = 'trieu-save-v1';
const SURV_FIELDS = [
  'hunger', 'thirst', 'stamina', 'temp', 'hp',
  'sick', 'poisonT', 'fishPoisonT', 'malaria', 'feverClock', 'awake',
];

// Khi người chơi xoá save (Backspace), chặn lưu tự động lúc trang reload.
let blocked = false;

export function saveGame(scene) {
  if (blocked) return;
  try {
    const s = scene.survival;
    const surv = {};
    for (const f of SURV_FIELDS) surv[f] = s[f];
    const data = {
      v: 1,
      t: scene.t,
      grid: scene.grid,
      inv: scene.inv,
      equip: scene.equip,
      skills: scene.skills,
      onBoat: scene.onBoat,
      px: scene.px,
      py: scene.py,
      raining: scene.raining,
      weatherT: scene.weatherT,
      surv,
      traps: [...scene.traps.entries()],
    };
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d.v !== 1 || !Array.isArray(d.grid) || !d.surv) return null;
    return d;
  } catch (e) {
    return null;
  }
}

export function clearSave() {
  blocked = true;
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    // bỏ qua
  }
}

// Gán lại trạng thái sinh tồn từ bản lưu.
export function applySurvival(survival, surv) {
  for (const f of SURV_FIELDS) {
    if (surv[f] !== undefined) survival[f] = surv[f];
  }
}
