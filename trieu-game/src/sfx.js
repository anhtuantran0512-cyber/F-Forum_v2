// Âm thanh tổng hợp bằng WebAudio: không cần file âm thanh.
// AudioContext được tạo ở thao tác đầu tiên của người chơi (trình duyệt yêu cầu cử chỉ người dùng).
// Âm nền: mưa, bếp lửa, sông — âm lượng theo vị trí và thời tiết.

import { getSettings, setSettings } from './settings.js';

const MASTER = 0.5;

export class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noiseBuf = null;
    this.amb = null;
    this.muted = getSettings().muted;
  }

  // Tạo AudioContext khi cần. Trả về false nếu trình duyệt không hỗ trợ.
  ensure() {
    if (this.ctx) return true;
    const AC = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!AC) return false;
    try {
      this.ctx = new AC();
    } catch (e) {
      return false;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : MASTER;
    this.master.connect(this.ctx.destination);
    this.noiseBuf = this.makeNoiseBuffer(2);
    this.startAmbient();
    return true;
  }

  resume() {
    if (!this.ensure()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    setSettings({ muted: this.muted });
    if (this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : MASTER, this.ctx.currentTime, 0.05);
    }
    return this.muted;
  }

  makeNoiseBuffer(sec) {
    const n = Math.floor(this.ctx.sampleRate * sec);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Một nốt: tần số, độ dài, dạng sóng, âm lượng, trượt tới tần số khác, độ trễ (giây)
  tone(f, dur, type = 'sine', vol = 0.2, slideTo = null, delay = 0) {
    const c = this.ctx;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  // Tiếng ồn ngắn qua bộ lọc (nước, gỗ, đá...)
  noise(dur, vol = 0.3, filt = 'bandpass', freq = 1200, delay = 0) {
    const c = this.ctx;
    const t0 = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = filt;
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t0, Math.random() * 1.5);
    s.stop(t0 + dur + 0.02);
  }

  // Vòng lặp tiếng ồn cho âm nền; trả về GainNode để điều chỉnh âm lượng.
  loopNoise(filt, freq, q = 1) {
    const c = this.ctx;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = true;
    const f = c.createBiquadFilter();
    f.type = filt;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.value = 0;
    s.connect(f).connect(g).connect(this.master);
    s.start();
    return g;
  }

  startAmbient() {
    this.amb = {
      rain: this.loopNoise('bandpass', 2200, 0.6),
      fire: this.loopNoise('lowpass', 500),
      river: this.loopNoise('lowpass', 260),
    };
  }

  // v = { rain, fire, river } với giá trị 0..1 (âm lượng mục tiêu)
  setAmbient(v) {
    if (!this.amb || !this.ctx) return;
    const scale = { rain: 0.14, fire: 0.06, river: 0.07 };
    for (const k of Object.keys(scale)) {
      if (v[k] !== undefined) this.amb[k].gain.setTargetAtTime(v[k] * scale[k], this.ctx.currentTime, 0.3);
    }
  }

  play(name) {
    if (this.muted || !this.ensure() || this.ctx.state !== 'running') return;
    switch (name) {
      case 'chop':
        this.noise(0.09, 0.35, 'bandpass', 900);
        this.tone(190, 0.06, 'square', 0.08, 120);
        break;
      case 'stone':
        this.noise(0.06, 0.3, 'highpass', 2500);
        this.tone(820, 0.04, 'triangle', 0.12);
        break;
      case 'gather':
        this.tone(480, 0.1, 'triangle', 0.15, 660);
        break;
      case 'reed':
        this.noise(0.14, 0.18, 'bandpass', 3200);
        break;
      case 'splash':
        this.noise(0.3, 0.35, 'bandpass', 1400);
        this.noise(0.2, 0.2, 'highpass', 3000, 0.1);
        break;
      case 'fish':
        this.tone(880, 0.12, 'sine', 0.18);
        this.tone(1320, 0.16, 'sine', 0.14, null, 0.07);
        break;
      case 'craft':
        this.tone(523, 0.08, 'triangle', 0.16);
        this.tone(659, 0.08, 'triangle', 0.16, null, 0.08);
        this.tone(784, 0.14, 'triangle', 0.16, null, 0.16);
        break;
      case 'build':
        this.tone(140, 0.16, 'square', 0.12, 90);
        this.noise(0.05, 0.25, 'lowpass', 600);
        break;
      case 'eat':
        this.noise(0.1, 0.2, 'bandpass', 800);
        this.tone(300, 0.06, 'sine', 0.12, 220, 0.08);
        break;
      case 'hurt':
        this.tone(240, 0.2, 'sawtooth', 0.18, 110);
        break;
      case 'hit':
        this.noise(0.05, 0.3, 'bandpass', 1800);
        this.tone(300, 0.06, 'square', 0.1, 150);
        break;
      case 'bite':
        this.tone(620, 0.22, 'sawtooth', 0.035, 780);
        break;
      case 'malaria':
        this.tone(440, 0.45, 'sine', 0.2, 180);
        break;
      case 'death':
        this.tone(330, 0.9, 'triangle', 0.3, 55);
        break;
      case 'trap':
        this.tone(1047, 0.12, 'sine', 0.14);
        this.tone(1319, 0.2, 'sine', 0.14, null, 0.09);
        break;
      case 'boat':
        this.noise(0.45, 0.25, 'lowpass', 500);
        break;
      case 'rain':
        this.noise(0.6, 0.12, 'bandpass', 2500);
        break;
      case 'ui':
        this.tone(740, 0.03, 'square', 0.05);
        break;
      case 'error':
        this.tone(160, 0.12, 'square', 0.08);
        break;
      default:
        break;
    }
  }
}
