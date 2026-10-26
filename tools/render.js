/* Render harness: chạy engine v6 trong Node bằng @napi-rs/canvas, xuất ảnh để soi */
const fs = require('fs');
const path = require('path');
const napi = require('@napi-rs/canvas');

const W = 1440, H = 860, DPR = 1.5;
let simNow = 0;
let rafCb = null;
const listeners = {};

global.window = global;
window.innerWidth = W; window.innerHeight = H; window.devicePixelRatio = DPR;
window.requestAnimationFrame = cb => { rafCb = cb; return 1; };
window.cancelAnimationFrame = () => {};
window.addEventListener = (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); };
window.removeEventListener = () => {};
global.addEventListener = window.addEventListener;
global.performance = { now: () => simNow };
global.MutationObserver = class { observe() {} disconnect() {} };

function makeCanvas(w, h) {
  const cv = napi.createCanvas(w || 300, h || 150);
  cv.style = {};
  cv.setAttribute = () => {};
  return cv;
}
global.document = {
  documentElement: { getAttribute: () => 'dark' },
  body: { appendChild() {}, removeChild() {} },
  createElement: () => makeCanvas(),
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  activeElement: null
};
global.navigator = { clipboard: null };
global.URL = { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} };
global.Blob = class {};

const cfgOverride = process.env.FF_CFG ? JSON.parse(process.env.FF_CFG) : {};
window.FORUMSPIRIT_CONFIG = cfgOverride;

const enginePath = path.join(__dirname, '..', 'fforum-scholar-spirit-v6.js');
eval(fs.readFileSync(enginePath, 'utf8'));

function frames(n) {
  for (let i = 0; i < n; i++) {
    simNow += 16.7;
    const cb = rafCb; rafCb = null;
    cb(simNow);
  }
}
frames(240);
if (!process.env.FF_IDLE) {
  /* mô phỏng di chuột + click để có tương tác */
  if (listeners.pointermove) listeners.pointermove.forEach(fn => fn({ clientX: 800, clientY: 420 }));
  if (listeners.pointerdown) listeners.pointerdown.forEach(fn => fn({ clientX: 820, clientY: 440 }));
  if (listeners.dblclick) listeners.dblclick.forEach(fn => fn({ clientX: 700, clientY: 360 }));
  frames(180);
}
/* đứng yên lâu để chụp tư thế bơi vòng ổn định */
frames(parseInt(process.env.FF_IDLE || '60', 10));

const outDir = path.join(__dirname, '..', 'tools', 'shots');
fs.mkdirSync(outDir, { recursive: true });

/* 1. Sprite nguyên bản (nền carô mờ để thấy vùng trong suốt) */
const sprite = window.__ffSprite;
const spOut = napi.createCanvas(sprite.width, sprite.height);
const spx = spOut.getContext('2d');
spx.fillStyle = '#0b1220';
spx.fillRect(0, 0, spOut.width, spOut.height);
spx.strokeStyle = 'rgba(148,163,184,0.12)';
for (let x = 0; x < spOut.width; x += 40) { spx.beginPath(); spx.moveTo(x, 0); spx.lineTo(x, spOut.height); spx.stroke(); }
for (let y = 0; y < spOut.height; y += 40) { spx.beginPath(); spx.moveTo(0, y); spx.lineTo(spOut.width, y); spx.stroke(); }
spx.drawImage(sprite, 0, 0);
fs.writeFileSync(path.join(outDir, 'sprite.png'), spOut.toBuffer('image/png'));

/* 2. Toàn cảnh trên nền tối giống trang thật */
const scene = napi.createCanvas(W, H);
const sc = scene.getContext('2d');
sc.fillStyle = '#070a12';
sc.fillRect(0, 0, W, H);
const { body, fx } = window.__ffCanvases;
sc.drawImage(body, 0, 0, W, H);
sc.drawImage(fx, 0, 0, W, H);
fs.writeFileSync(path.join(outDir, 'scene.png'), scene.toBuffer('image/png'));

/* 3. Crop vùng đầu cá để soi chi tiết mắt/mang/miệng/râu */
const CFG = window.astralDragonCfg;
console.log('breed =', CFG.breed, '| skin =', CFG.skin, '| event =', CFG.eventMode);
console.log('saved:', path.join(outDir, 'sprite.png'), 'and scene.png');
