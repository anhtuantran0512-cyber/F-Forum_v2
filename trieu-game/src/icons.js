// Biểu tượng vật phẩm và công trình (12x12), vẽ bằng ma trận ký tự, đóng gói thành một atlas.
// Ký tự: . trong suốt · o viền · w gỗ sáng · W gỗ · N nâu · n nâu tối · g lá sáng · G lá tối
// y vàng · Y vàng tối · r đỏ · R đỏ tối · b xanh nước · B xanh sáng · k đá sáng · K đá tối
// v tím · V tím tối · p trắng · e thép · E thép tối · c kem · f cam · h hồng · x đen · X xám than · m rêu · a cát

const PAL = {
  o: '#14100b', w: '#c9a876', W: '#8a6a3a', N: '#5c4423', n: '#3a2a14',
  g: '#6fbf4a', G: '#3f7a2e', y: '#ffd23f', Y: '#c9a02a', r: '#c0503a', R: '#7a2e22',
  b: '#3d6f9e', B: '#8fc3e0', k: '#a4a9b0', K: '#5c6168', v: '#b58ad6', V: '#7a4aa0',
  p: '#f2f0e6', e: '#cfd6dc', E: '#7d8791', c: '#f2e6c9', f: '#e08a3a', h: '#e8a0a0',
  x: '#1a1a1a', X: '#3a3a3a', m: '#5d7a3a', a: '#d9bd8c',
};

const ART = {
  // ---- Tài nguyên ----
  wood: [
    '............', '..oooooooo..', '.oWWWWWWWWo.', '.oWwwwNNwWo.', '.oWwwNNwWWo.',
    '.oWwwwwwWWo.', '.oWWWWWWWWo.', '..oooooooo..', '............', '............', '............', '............',
  ],
  reed: [
    '..w..w..w...', '..g..g..gw..', '..g..g..g...', '.wg..g..g...', '.g...g.wg...', '.g..wg..g...',
    '..g..g..g...', '..N..N..N...', '..N..N..N...', '..N..N..N...', '............', '............',
  ],
  herb: [
    '............', '.....g.......', '....gGg......', '...gG.Gg.....', '.....G.......', '....gGg.g....',
    '...gG.G.gG...', '.....G..G.g..', '.....G.GG....', '.....N.......', '.....N.......', '............',
  ],
  stone: [
    '............', '....oooo....', '..ooKkkKoo..', '.oKkkkkkKKo.', '.oKkkkkkKKo.', '.oKKkkkKKKo.',
    '.oKKKKKKKKo.', '..ooooooooo.', '............', '............', '............', '............',
  ],
  vine: [
    '............', '..oooo......', '.oNNNNo.....', '.oNnnNNo....', '..oNNnNo....', '...oNnNNo...',
    '....oNNNNo..', '.....oNNNo..', '......oooo..', '............', '............', '............',
  ],
  bark: [
    '............', '..oooooooo..', '.oNNNnNNNNo.', '.oNnNNNNNnNo.', '.oNNNNnNNNo.', '.oNnNNNNNNo.',
    '.oNNNnNNNNo.', '..oooooooo..', '............', '............', '............', '............',
  ],
  shell: [
    '............', '....oooo....', '..ooccccoo..', '.occcYYcccco', '.ocYYYcccCo.', '.occYccccco.',
    '..oYccccco..', '...oooooo....', '............', '............', '............', '............',
  ],
  charcoal: [
    '............', '............', '...oooo.....', '..oXXXXo....', '.oXXxXXXXo..', '.oXxXXXXXo..',
    '.oXXXXxXXo..', '..oXXXXXo....', '...ooooo....', '............', '............', '............',
  ],
  rootcoc: [
    '............', '.....vv.....', '....vVVv....', '.....N......', '....NN.N....', '...NN...N...',
    '..NN.....N..', '.NN.......N..', '............', '............', '............', '............',
  ],
  // ---- Hiếm ----
  pearl: [
    '............', '....oooo....', '...opppoo...', '..opBppppo..', '..oppppppo..', '..oppppppo..',
    '..oppppppo..', '...oppppo...', '....oooo....', '............', '............', '............',
  ],
  coral: [
    '............', '..h...h.....', '..h.h.hh....', '..hhhhhh....', '...hRh.h.h..', '....R..hhh..',
    '....Rh.Rh...', '....RRRR....', '.....RR.....', '............', '............', '............',
  ],
  cagold: [
    '............', '.....oo.....', '...ooyyoo...', '..oyyyyyyoo.', '.oyyxyyyyyo.', '.oyyyyyyyyo.',
    '..oyyyyyyoo.', '...oyyyoo.o..', '....oo...oo.', '............', '............', '............',
  ],
  // ---- Thức ăn ----
  fish: [
    '............', '............', '...ooooo....', '..offffffo..', '.offffffffoo', '.ofxffffffffo',
    '.offffffffoo', '..offffffo..', '...ooooo....', '............', '............', '............',
  ],
  cafish: [
    '............', '............', '...ooooo....', '..oNNNNNNo..', '.oNNNNNNNNoo', '.oNxNNNNNNNo.',
    '.oNNNNNNNNoo', '..oNNNNNNo..', '...ooooo....', '............', '............', '............',
  ],
  cua: [
    '............', '.o.......o..', '..o..oo..o..', '.ooorrrroo..', '.orrrrrrrro.', '.orxrrrrxro.',
    '.orrrrrrrro.', '..orrrrrro..', '.o.o.oo.o.o.', '............', '............', '............',
  ],
  cuanuong: [
    '............', '.o.......o..', '..o..oo..o..', '.ooorRRRoo..', '.oRRRRRRRRo.', '.oRxRRRRxRo.',
    '.oRRRRRRRRo.', '..oRRRRRo...', '.o.o.oo.o.o.', '............', '............', '............',
  ],
  canhoc: [
    '............', '............', '.oooooooooo.', '.occcccccco.', '..oooooooooo', '...oWWWWWo..',
    '....oWWWo...', '.....ooo.....', '............', '............', '............', '............',
  ],
  cakho: [
    '............', '..oooooooo..', '.oBBBBBBBBo.', '.oBBBBBBBBo.', '.oooooooooo.', '.oWWWWWWWWo.',
    '.oWWWWWWWWo.', '.oooooooooo.', '..oooooooo..', '............', '............', '............',
  ],
  tom: [
    '............', '.......oo...', '......oho...', '.....ohhoo..', '....ohhhho..', '...ohhhhho..',
    '..ohhhhho...', '..ohho.oo...', '...oo.......', '............', '............', '............',
  ],
  thitran: [
    '............', '.....oooo...', '...oohhhoo..', '..ohhhhhhho.', '..ohhhhhhho.', '.ohhhhhhhho.',
    '.ohhhhhhhho.', '..oooooooo...', '............', '............', '............', '............',
  ],
  // ---- Thuốc ----
  remedy: [
    '............', '.....oo.....', '.....oo.....', '....oWWo....', '...ogggggo..', '..ogggggggo.',
    '..ogggggggo.', '..ogggggggo.', '..oooooooo..', '............', '............', '............',
  ],
  feverMed: [
    '............', '.....oo.....', '.....oo.....', '....oWWo....', '...oBBBBo...', '..oBBBBBBo..',
    '..oBBBBBBo..', '..oBBBBBBo..', '..oooooooo..', '............', '............', '............',
  ],
  bandage: [
    '............', '............', '..oooooooo..', '.occccccco..', '.oc.oooo.co.', '.oc.oooo.co.',
    '.occccccco..', '..oooooooo..', '............', '............', '............', '............',
  ],
  ginger: [
    '............', '..%.%.%.....', '.....%......', '..oooooooo..', '.oWWWWWWWWo.', '.oWWWWWWWWo.',
    '.oWWWWWWWWo.', '..oooooooo..', '............', '............', '............', '............',
  ],
  charcoalPill: [
    '............', '............', '...oooooo...', '..oXXXXXXo..', '.oXXXXXXXXo.', '.oXXXXXXXXo.',
    '..oXXXXXXo..', '...oooooo...', '............', '............', '............', '............',
  ],
  caoCoc: [
    '............', '....oooo....', '....oVVo....', '...oVVVVo...', '..oVvvvvVo..', '..oVvvvvVo..',
    '..oVVVVVVo..', '..oooooooo..', '............', '............', '............', '............',
  ],
  thuocCoc: [
    '............', '.....oo.....', '.....oo.....', '....oVVo....', '...oVvvVo...', '..oVvvvvVo..',
    '..oVvvvvVo..', '..oVVVVVVo..', '..oooooooo..', '............', '............', '............',
  ],
  // ---- Vũ khí ----
  machete: [
    '..........oo', '.........oeo', '........oeeo', '.......oeeo.', '......oeeo..', '.....oeeo...',
    '.oNoeeo.....', 'oNNoeo.......', 'oNNoo.......', '.oo.........', '............', '............',
  ],
  spear: [
    '...........o', '..........oe', '.........oee', '........oee.', '.......oee..', '......oee...',
    '.....oee....', '....oW.......', '...oW.......', '..oW........', '.oW.........', 'oo..........',
  ],
  knife: [
    '............', '..........oo', '.........oeo', '........oee', '.......oee.', '......oee..',
    '.oo.oee....', 'oNNooo.....', 'oNNo........', '.oo.........', '............', '............',
  ],
  club: [
    '............', '.........oo.', '........oWWo', '.......oWWWo', '......oWWWo.', '.....oWWWo..',
    '....oWWo....', '...oNNo.....', '..oNNo......', '..oo........', '............', '............',
  ],
  bow: [
    '............', '.......oo...', '.....oo.o...', '....o....o..', '...o......o.', '..o.......o.',
    '..o.......o.', '...o......o.', '....o....o..', '.....oo.o...', '.......oo...', '............',
  ],
  arrow: [
    '............', '..........oo', '.........oeo', '.......oo.oo', '......oo..oo', '.....oo.oo..',
    '....oNNoo...', '...oNNoo....', '..oNNo......', '.oNo........', '.oo.........', '............',
  ],
  // ---- Trang bị ----
  nonla: [
    '............', '.....oo.....', '....occco...', '...occccco..', '..oooooooo..', '.occccccccco',
    '.oooooooooo.', '............', '............', '............', '............', '............',
  ],
  aotoi: [
    '............', '..oooooooo..', '.occcccccco.', '.occcccccco.', '.occcccccco.', '.occcccccco.',
    '.occcccccco.', '.occcccccco.', '..oooooooo..', '............', '............', '............',
  ],
  aogiap: [
    '............', '.oooooooooo.', '.oWwwwwwwWo.', '.oWoooooWo..', '.oWwwwwwWo..', '.oWoooooWo..',
    '.oWwwwwwWo..', '.oWoooooWo..', '..oooooooo..', '............', '............', '............',
  ],
  giaygo: [
    '............', '............', '.oooo.......', '.oWWWo......', '.oWWWWWWoo..', '.oWWWWWWWWo.',
    '.oooooooooo.', '............', '............', '............', '............', '............',
  ],
  // ---- Phương tiện ----
  boat: [
    '............', '............', '............', '.oNNNNNNNNo.', 'oNNWWWWWWWNo', '.ooooooooooo.',
    '.oBBBBBBBBo.', '..oBBBBBBo..', '...oooooo...', '............', '............', '............',
  ],
  // ---- Công trình ----
  b_P: [
    '............', '.oooooooooo.', '.oWWWWWWWWo.', '.oooooooooo.', '.oWWWWWWWWo.', '.oooooooooo.',
    '.oWWWWWWWWo.', '.oooooooooo.', '............', '............', '............', '............',
  ],
  b_K: [
    '............', '.....ff.....', '....fyyf....', '...fyyyyf...', '...fyyyyf...', '..fyyyyyyf..',
    '.oWWWWWWWWo.', '..oooooooo..', '............', '............', '............', '............',
  ],
  b_SP: [
    '............', '.....o.......', '....oeo......', '.o..oeeo.o..', '.oeoeeeoeo..', '.oeeeeeeeo..',
    '.oooooooooo.', '............', '............', '............', '............', '............',
  ],
  b_LM: [
    '............', '.....oo.....', '....oyyo....', '...oyyyyo...', '...oyyyyo...', '....oyyo....',
    '.....oo.....', '.....WW.....', '.....WW.....', '.....WW.....', '.....WW.....', '............',
  ],
  b_DR: [
    '............', '.oooooooooo.', '.oWWWWWWWWo.', '.oo.oo.oo...', '.oa.oa.oa...', '.oa.oa.oa...',
    '.oo.oo.oo...', '.oWo.oWo.Wo.', '............', '............', '............', '............',
  ],
  b_FLAG: [
    '.o..........', '.oooooooo...', '.orrrrrrroo.', '.orrrrrrrro.', '.orrryrrrro.', '.orrrrrrrro.',
    '.oorrrrrroo.', '.o..........', '.o..........', '.o..........', '.o..........', '............',
  ],
  b_TR: [
    '............', '............', '.oWWWWWWWWo.', '.oWNWNWNWNo.', '.oWNWNWNWNo.', '.oWWWWWWWWo.',
    'oo.oooooooo.', 'bbbbbbbbbbbb', 'bBbbBbbbBbbb', '............', '............', '............',
  ],
};

// Thay ký tự "%" (khói) bằng màu xám nhạt, các dòng còn lại chuẩn hoá về 12 cột.
const SMOKE = '#9aa3ab';

export const ICON_SIZE = 12;

// Ánh xạ mục menu -> biểu tượng: vật phẩm dùng cùng id, công trình dùng 'b_' + ký hiệu.
export function iconKey(id) {
  return ART[id] ? id : null;
}

export function generateIcons(scene) {
  const keys = Object.keys(ART);
  const canvas = document.createElement('canvas');
  canvas.width = ICON_SIZE * keys.length;
  canvas.height = ICON_SIZE;
  const ctx = canvas.getContext('2d');
  keys.forEach((id, i) => {
    const rows = ART[id];
    for (let y = 0; y < ICON_SIZE; y++) {
      const row = (rows[y] || '').padEnd(ICON_SIZE, '.');
      for (let x = 0; x < ICON_SIZE; x++) {
        const ch = row[x];
        if (ch === '.' || ch === undefined) continue;
        ctx.fillStyle = ch === '%' ? SMOKE : PAL[ch] ?? '#ff00ff';
        ctx.fillRect(i * ICON_SIZE + x, y, 1, 1);
      }
    }
  });
  scene.textures.addCanvas('icons', canvas);
  const tex = scene.textures.get('icons');
  keys.forEach((id, i) => tex.add(id, 0, i * ICON_SIZE, 0, ICON_SIZE, ICON_SIZE));
}
