// Cài đặt người chơi (lưu localStorage, khoá 'trieu-settings').
// muted: tắt âm thanh (phím M) · quality: 'high' bật bọt sóng, quầng sáng, vignette; 'low' tắt chúng (phím G).

const KEY = 'trieu-settings';
const DEFAULTS = { muted: false, quality: 'high' };

export function getSettings() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

export function setSettings(patch) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...getSettings(), ...patch }));
  } catch (e) {
    // bỏ qua (chế độ riêng tư)
  }
}
