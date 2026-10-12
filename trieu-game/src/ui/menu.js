// Menu danh sách dùng chung (chế tạo, xây dựng, túi đồ).
// Vẽ nền bằng Graphics của HUD; chữ là Text của Phaser tạo qua hàm mk().

const PANEL_W = 680;
const ROW_H = 22;

export default class ListMenu {
  // mk(x, y, str, size, color, origin) -> Text; hudG: Graphics dùng để vẽ nền
  constructor(mk, { title, rows = 11 }) {
    this.rows = rows;
    this.w = PANEL_W;
    this.h = 48 + rows * ROW_H + 130;
    this.x = Math.round((1280 - this.w) / 2);
    this.y = 56;
    this.title = title;
    this.open = false;
    this.items = [];
    this.index = 0;
    this.scroll = 0;
    this.hint = '';

    this.titleT = mk(this.x + 16, this.y + 12, title, 18, '#ffd23f');
    this.rowT = [];
    for (let i = 0; i < rows; i++) this.rowT.push(mk(this.x + 22, this.y + 44 + i * ROW_H, '', 14, '#f2e6c9'));
    this.detailT = mk(this.x + 18, this.y + 44 + rows * ROW_H + 10, '', 13, '#f2e6c9');
    this.hintT = mk(this.x + 16, this.y + this.h - 22, '', 12, '#b8ab8a');
    this.texts = [this.titleT, this.hintT, this.detailT, ...this.rowT];
    this.setVisible(false);
  }

  setVisible(v) {
    for (const t of this.texts) t.setVisible(v);
  }

  show(items, hint, title) {
    this.open = true;
    this.hint = hint;
    if (title !== undefined) this.title = title;
    this.setItems(items, true);
    this.setVisible(true);
  }

  close() {
    this.open = false;
    this.setVisible(false);
  }

  // Thay danh sách (giữ vị trí chọn nếu có thể).
  setItems(items, reset = false) {
    this.items = items;
    if (reset) { this.index = 0; this.scroll = 0; }
    this.index = Math.min(this.index, Math.max(0, items.length - 1));
    this.keepVisible();
  }

  keepVisible() {
    if (this.index < this.scroll) this.scroll = this.index;
    if (this.index >= this.scroll + this.rows) this.scroll = this.index - this.rows + 1;
    this.scroll = Math.max(0, this.scroll);
  }

  move(d) {
    if (!this.items.length) return;
    this.index = (this.index + d + this.items.length) % this.items.length;
    this.keepVisible();
  }

  current() {
    return this.items[this.index];
  }

  render(g) {
    if (!this.open) return;
    g.fillStyle(0x05121f, 0.95);
    g.fillRect(this.x, this.y, this.w, this.h);
    g.lineStyle(2, 0xffd23f, 1);
    g.strokeRect(this.x, this.y, this.w, this.h);

    for (let i = 0; i < this.rows; i++) {
      const item = this.items[this.scroll + i];
      const t = this.rowT[i];
      const sel = this.scroll + i === this.index;
      if (sel) {
        g.fillStyle(0x1d5a7a, 0.7);
        g.fillRect(this.x + 12, this.y + 42 + i * ROW_H, this.w - 24, ROW_H - 2);
      }
      if (!item) { t.setText(''); continue; }
      t.setText(`${sel ? '► ' : '  '}${item.label}`);
      t.setColor(sel ? '#ffd23f' : item.ok === false ? '#7d7560' : '#f2e6c9');
    }
    if (this.items.length > this.rows) {
      this.titleT.setText(`${this.title}  (${this.index + 1}/${this.items.length})`);
    } else {
      this.titleT.setText(this.title);
    }
    const cur = this.current();
    this.detailT.setText(cur ? cur.detail ?? '' : 'Trống.');
    this.hintT.setText(this.hint);
  }
}
