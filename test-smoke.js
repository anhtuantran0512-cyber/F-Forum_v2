/* Smoke test: chạy engine v6 trong Node với DOM/Canvas giả lập */
const fs = require('fs');

function makeGradient() { return { addColorStop() {} }; }
function makeCtx() {
  const ctx = {
    canvas: null,
    setTransform() {}, save() {}, restore() {}, clearRect() {}, fillRect() {},
    beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {},
    bezierCurveTo() {}, arc() {}, ellipse() {}, rect() {}, roundRect() {}, fill() {},
    strokeRect() {}, fillRect() {}, resetTransform() {}, isPointInPath() { return false; },
    stroke() {}, clip() {}, drawImage() {}, createLinearGradient() { return makeGradient(); },
    createRadialGradient() { return makeGradient(); }, translate() {}, rotate() {}, scale() {},
    fillText() {}, strokeText() {}, measureText() { return { width: 10 }; },
    setLineDash() {}, drawFocusIfNeeded() {}, createImageData() { return {}; },
    getImageData() { return { data: [] }; }, putImageData() {},
    globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '', strokeStyle: '',
    lineWidth: 1, lineCap: '', lineJoin: '', font: '', textAlign: '', textBaseline: '',
    shadowBlur: 0, shadowColor: ''
  };
  return ctx;
}
function makeCanvas() {
  return {
    width: 0, height: 0, style: {}, _ctx: makeCtx(),
    setAttribute() {}, getContext() { return this._ctx; },
    addEventListener() {}, removeEventListener() {}
  };
}
function makeElement(id) {
  return {
    id, value: id === 'fullHolidaySelect' ? 'vn_2010' : '', textContent: '', innerHTML: '',
    style: {}, className: '', type: 'text', tagName: id === 'forumReplyBox' ? 'TEXTAREA' : 'DIV',
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, getAttribute() { return 'dark'; }, appendChild() {}, removeChild() {},
    addEventListener() {}, removeEventListener() {}, blur() {}, select() {},
    querySelector() { return makeElement('opt'); },
    querySelectorAll() { return []; }
  };
}
const elements = {};
const listeners = {};
global.window = global;
window.innerWidth = 1440; window.innerHeight = 900; window.devicePixelRatio = 1.5;
window.FORUMSPIRIT_CONFIG = { breed: 'tancho', skin: 'solar' };
let rafCb = null;
window.requestAnimationFrame = cb => { rafCb = cb; return 1; };
window.cancelAnimationFrame = () => {};
window.addEventListener = (t, fn) => { (listeners[t] = listeners[t] || []).push(fn); };
window.removeEventListener = () => {};
global.addEventListener = window.addEventListener;
global.performance = { now: () => simNow };
global.MutationObserver = class { observe() {} disconnect() {} };
const docEl = makeElement('html');
global.document = {
  documentElement: docEl,
  body: { appendChild() {}, removeChild() {} },
  createElement: tag => makeCanvas(),
  getElementById: id => (elements[id] = elements[id] || makeElement(id)),
  querySelector: () => makeElement('q'),
  querySelectorAll: () => [],
  addEventListener() {},
  activeElement: null
};
global.navigator = { clipboard: null };
global.URL = { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} };
global.Blob = class {};

let simNow = 0;
const engine = fs.readFileSync('./fforum-scholar-spirit-v6.js', 'utf8');
eval(engine);

const CFG = window.astralDragonCfg;
function frames(n) {
  for (let i = 0; i < n; i++) {
    simNow += 16.7;
    const cb = rafCb;
    rafCb = null;
    cb(simNow);
    if (!rafCb) throw new Error('frame loop stopped registering raf');
  }
}
frames(120);

/* mô phỏng di chuột, click, double click, gõ bài */
listeners.pointermove.forEach(fn => fn({ clientX: 700, clientY: 400 }));
listeners.pointerdown.forEach(fn => fn({ clientX: 720, clientY: 420 }));
listeners.dblclick.forEach(fn => fn({ clientX: 600, clientY: 300 }));
frames(60);
document.activeElement = makeElement('forumReplyBox');
document.activeElement.tagName = 'TEXTAREA';
listeners.focusin.forEach(fn => fn({}));
frames(120);
document.activeElement = null;
listeners.focusout.forEach(fn => fn({}));
frames(60);

/* mọi giống cá & skin & sự kiện */
['tancho', 'gold', 'white'].forEach(b => { CFG.setBreed(b); frames(20); });
['solar', 'astral', 'jade', 'kintsugi', 'sumi'].forEach(s => { CFG.rebuildSkin(s); frames(20); });
['normal', 'vn_2010', 'vn_0803', 'vn_0209', 'tet', 'midautumn', 'birthday', 'vn_0911', 'vn_2312_al'].forEach(ev => {
  CFG.setEventMode(ev); frames(10);
});
CFG.userGender = 'male';
CFG.setEventMode('vn_2010');
frames(10);
CFG.userGender = 'female';

/* thả mồi, long ngâm, lời chúc, hóa rồng */
CFG.spawnKnowledgeFood(500, 400);
frames(200);
CFG.triggerPulse(300, 300);
CFG.announceWish('Chúc muôn sự hanh thông');
frames(60);
CFG.ascendDragon();
frames(160);
CFG.scale = 1.45; CFG.waveAmp = 1.8; frames(40);
CFG.scale = 0.7; CFG.waveAmp = 0.3; frames(40);
CFG.showGlyphs = false; CFG.showLotus = false; frames(40);
CFG.paused = true; frames(10); CFG.paused = false; frames(40);

/* kiểm tra getEvent cho key không có preset riêng */
const fallback = CFG.getEvent('vn_0901');
if (!fallback.stamp || !Array.isArray(fallback.poems)) throw new Error('getEvent fallback lỗi');
const known = CFG.getEvent('vn_2011');
if (known.poems.length !== 4) throw new Error('preset 20/11 thiếu 4 bài thơ');

window.__ffCleanup();
console.log('SMOKE TEST OK — tổng frame mô phỏng ~1000, mọi API chạy không lỗi.');
