// Hệ thống sinh tồn: 4 thanh chỉ số + máu + bệnh tật + thức trắng.
// Thiết kế gốc: No bụng / Khát / Thể lực / Thân nhiệt; bệnh Cảm Triều, Trúng Nước Độc, Ngộ Độc Cá, Sốt Rét Sông.

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export const INSOMNIA_AFTER = 150; // giây thức liên tục trước khi "thức trắng"
export const FEVER_PERIOD = 40;    // sốt rét: chu kỳ 40 giây
export const FEVER_LENGTH = 8;     // mỗi chu kỳ sốt cao 8 giây

export class Survival {
  constructor() {
    this.hunger = 100;     // No bụng
    this.thirst = 100;     // Khát nước
    this.stamina = 100;    // Thể lực
    this.temp = 75;        // Thân nhiệt
    this.hp = 100;         // Máu

    this.sick = false;     // Cảm Triều (lạnh quá)
    this.poisonT = 0;      // Trúng Nước Độc (còn bao nhiêu giây)
    this.fishPoisonT = 0;  // Ngộ Độc Cá
    this.malaria = false;  // Sốt Rét Sông (do muỗi)
    this.feverClock = 0;   // đếm thời gian để tính chu kỳ sốt

    this.awake = 0;        // thời gian đã thức từ lần ngủ gần nhất
    this.events = [];      // sự kiện một lần để Scene hiển thị thông báo
  }

  get insomnia() {
    return this.awake > INSOMNIA_AFTER;
  }

  // Bệnh cơ bản — Nước Lá Rừng chữa được.
  get ill() {
    return this.sick || this.poisonT > 0 || this.fishPoisonT > 0;
  }

  get feverNow() {
    return this.malaria && (this.feverClock % FEVER_PERIOD) < FEVER_LENGTH;
  }

  // Hệ số tốc độ di chuyển: bệnh, khát, kiệt sức đều làm chậm.
  speedMult() {
    let m = 1;
    if (this.sick) m *= 0.85;
    if (this.feverNow) m *= 0.8;
    if (this.thirst <= 0) m *= 0.7;
    if (this.stamina <= 0) m *= 0.4;
    return m;
  }

  // c = { moving, sprinting, raining, sheltered, night, sunny, wet, sleeping, nearFire }
  update(dt, c) {
    const act = c.moving ? 1 : 0;
    this.awake += dt;

    // No bụng: giảm theo thời gian, nặng hơn khi vận động / chạy.
    this.hunger = clamp(this.hunger - dt * (0.35 + act * 0.1 + (c.sprinting ? 0.25 : 0)));
    // Khát: nhanh hơn khi trời nắng.
    this.thirst = clamp(this.thirst - dt * (0.45 + act * 0.1 + (c.sunny ? 0.3 : 0)));

    // Thể lực: chạy tốn, nghỉ hồi; bệnh và đói làm hồi chậm lại.
    let regen = c.sprinting ? -14 : c.moving ? 4 : 10;
    if (regen > 0) {
      regen *= 0.9; // cân bằng: hồi thể lực tự nhiên chậm hơn 10% (bù bằng thuốc)
      if (this.sick || this.malaria) regen *= 0.5;
      if (this.hunger <= 0) regen *= 0.5;
    }
    if (c.sleeping) regen = 20;
    this.stamina = clamp(this.stamina + regen * dt);

    // Thân nhiệt: mưa, ướt, đêm làm lạnh; nhà sàn/ngủ/nắng/lửa trại làm ấm.
    const rt = c.armor?.rainTemp ?? 1; // áo mưa / nón lá giảm lạnh khi mưa
    const wm = c.armor?.wet ?? 1;      // áo tơi giảm ướt
    let dTemp = 0;
    if (c.raining && !c.sheltered) dTemp -= 2 * rt;
    if (c.wet) dTemp -= 3 * wm;
    if (c.night && !c.sheltered) dTemp -= 0.6;
    if (c.sheltered || c.sleeping) dTemp += 1.5;
    if (c.sunny && !c.sheltered && !c.raining) dTemp += 0.5;
    if (c.nearFire) dTemp += 2;
    this.temp = clamp(this.temp + dTemp * dt, 0, 100);

    if (!this.sick && this.temp < 35) {
      this.sick = true;
      this.events.push({ type: 'sick' });
    }

    // Máu: mất dần khi đói/khát/nhiễm độc/sốt; hồi chậm khi khoẻ.
    let hpLoss = 0;
    if (this.hunger <= 0) hpLoss += 0.5;
    if (this.thirst <= 0) hpLoss += 0.5;
    if (this.poisonT > 0) hpLoss += 1.0;
    if (this.fishPoisonT > 0) hpLoss += 0.6;
    if (this.feverNow) hpLoss += 1.5;
    if (hpLoss > 0) {
      this.hp = clamp(this.hp - hpLoss * dt, 0, 100);
    } else if (this.hunger > 30 && this.thirst > 30 && !this.ill && !this.malaria) {
      this.hp = clamp(this.hp + 0.8 * dt, 0, 100);
    }

    if (this.malaria) this.feverClock += dt;
    this.poisonT = Math.max(0, this.poisonT - dt);
    this.fishPoisonT = Math.max(0, this.fishPoisonT - dt);
  }

  // Áp dụng hiệu ứng từ bảng vật phẩm: { hunger, thirst, stamina, hp, temp, cures[], cureMalaria }
  applyEffect(e) {
    if (!e) return;
    if (e.hunger) this.hunger = clamp(this.hunger + e.hunger);
    if (e.thirst) this.thirst = clamp(this.thirst + e.thirst);
    if (e.stamina) this.stamina = clamp(this.stamina + e.stamina);
    if (e.hp) this.hp = clamp(this.hp + e.hp);
    if (e.temp) this.temp = clamp(this.temp + e.temp);
    for (const c of e.cures ?? []) {
      if (c === 'sick') this.sick = false;
      if (c === 'poison') this.poisonT = 0;
      if (c === 'fishpoison') this.fishPoisonT = 0;
    }
    if (e.cureMalaria) this.cureMalaria();
  }

  // Gây trạng thái bệnh từ rủi ro (ví dụ ăn cá sống).
  addStatus(type, secs) {
    if (type === 'fishpoison') {
      this.fishPoisonT = secs;
      this.events.push({ type: 'fishpoison' });
    } else if (type === 'poison') {
      this.poisonT = secs;
      this.events.push({ type: 'poison' });
    }
  }

  // ---- Hành động ----
  // Uống nước sông chưa lọc: 30% trúng nước độc.
  drinkRiver() {
    this.thirst = clamp(this.thirst + 35);
    if (Math.random() < 0.3) {
      this.poisonT = 20;
      this.events.push({ type: 'poison' });
    }
  }

  // Cá sống: 20% ngộ độc cá.
  eatFish() {
    this.hunger = clamp(this.hunger + 22);
    if (Math.random() < 0.2) {
      this.fishPoisonT = 15;
      this.events.push({ type: 'fishpoison' });
    }
  }

  // Cá nướng trên lửa trại: an toàn.
  eatCooked() {
    this.hunger = clamp(this.hunger + 35);
  }

  // Cá vàng (chỉ có lúc nước lớn): no nhiều và hồi máu.
  eatGoldfish() {
    this.hunger = clamp(this.hunger + 40);
    this.hp = clamp(this.hp + 15);
  }

  eatCrab() {
    this.hunger = clamp(this.hunger + 25);
  }

  // Nước lá rừng: giải các bệnh cơ bản (không chữa sốt rét).
  drinkRemedy() {
    this.sick = false;
    this.poisonT = 0;
    this.fishPoisonT = 0;
    this.temp = clamp(this.temp + 10);
  }

  // Bị muỗi đốt ven sông ban đêm: 25% nhiễm sốt rét.
  bitten() {
    if (Math.random() < 0.25) this.infect();
    else this.events.push({ type: 'bite' });
  }

  infect() {
    if (this.malaria) return;
    this.malaria = true;
    this.feverClock = 0;
    this.events.push({ type: 'malaria' });
  }

  cureMalaria() {
    this.malaria = false;
    this.feverClock = 0;
  }

  sleep(sheltered) {
    this.stamina = sheltered ? 100 : 60;
    this.hunger = clamp(this.hunger - 12);
    this.temp = clamp(this.temp + (sheltered ? 15 : 5));
    this.awake = 0;
  }

  flashEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }

  reviveAtHouse() {
    this.hp = 60;
    this.hunger = 40;
    this.thirst = 40;
    this.stamina = 60;
    this.temp = 60;
    this.poisonT = 0;
    this.fishPoisonT = 0;
    this.malaria = false;
    this.feverClock = 0;
    this.awake = 0;
  }
}
