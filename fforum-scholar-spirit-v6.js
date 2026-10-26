/* ============================================================
   F-Forum Scholar Spirit v6.0 — Lý Ngư Koi siêu chi tiết
   - 700+ vảy ngói 3D (bóng đổ + viền sáng/tối, xếp so le)
   - Nắp mang thở, mắt chớp + liếc theo mồi, miệng ngậm nhịp
   - 4 râu cảm biến vật lý Verlet, đầu râu có nút cảm giác
   - Vây lụa với tia xương, đường bên + lỗ cảm giác đầu
   - Chuyển động: mesh 2.5D uốn theo sóng hành trình, uyển chuyển
   ============================================================ */
(function () {
  if (window.__ffCleanup) { try { window.__ffCleanup(); } catch (e) {} }
  window.astralDragon = true;

  const extCfg = window.FORUMSPIRIT_CONFIG || {};

  /* ---------- Bảng màu 5 skin + hóa Kim Long ---------- */
  const PALETTES = {
    solar: {
      name: 'Trạng Nguyên Chu Sa',
      hi1: '#f97316', hi2: '#dc2626', hiDeep: '#991b1b', tancho: '#dc2626',
      rimLight: 'rgba(255,255,255,0.9)', rimDark: 'rgba(120,53,15,0.35)',
      gold: '#fde047', bodyEdge: '#cbd5e1', bodyHi: '#ffffff', belly: '#fff7ed',
      finA: 'rgba(255,248,240,0.85)', finB: 'rgba(253,224,175,0.28)',
      ink: 'rgba(51,65,85,0.66)', inkSoft: 'rgba(100,116,139,0.5)',
      moteDark: '253,224,71', moteGold: '251,146,60',
      ribbon: '234,88,12', ribbonSoft: '251,146,60', headGlow: '#fb923c', horn: '#fde047'
    },
    astral: {
      name: 'Tinh Hà Nguyệt Quang',
      hi1: '#38bdf8', hi2: '#4f46e5', hiDeep: '#1e3a8a', tancho: '#2563eb',
      rimLight: 'rgba(255,255,255,0.92)', rimDark: 'rgba(30,58,138,0.35)',
      gold: '#bae6fd', bodyEdge: '#cbd5e1', bodyHi: '#f8fafc', belly: '#f0f9ff',
      finA: 'rgba(240,249,255,0.85)', finB: 'rgba(186,230,253,0.3)',
      ink: 'rgba(30,41,59,0.66)', inkSoft: 'rgba(71,85,105,0.5)',
      moteDark: '165,243,252', moteGold: '253,224,71',
      ribbon: '56,189,248', ribbonSoft: '125,211,252', headGlow: '#67e8f9', horn: '#fde047'
    },
    jade: {
      name: 'Thanh Ngọc Cổ Viện',
      hi1: '#10b981', hi2: '#047857', hiDeep: '#064e3b', tancho: '#059669',
      rimLight: 'rgba(255,255,255,0.9)', rimDark: 'rgba(6,78,59,0.35)',
      gold: '#a7f3d0', bodyEdge: '#cbd5e1', bodyHi: '#f0fdf4', belly: '#ecfdf5',
      finA: 'rgba(240,253,244,0.85)', finB: 'rgba(167,243,208,0.3)',
      ink: 'rgba(15,60,45,0.66)', inkSoft: 'rgba(52,120,95,0.5)',
      moteDark: '110,231,183', moteGold: '253,224,71',
      ribbon: '16,185,129', ribbonSoft: '52,211,153', headGlow: '#6ee7b7', horn: '#fcd34d'
    },
    kintsugi: {
      name: 'Bạch Ngọc Kintsugi',
      hi1: '#fef08a', hi2: '#ca8a04', hiDeep: '#a16207', tancho: '#dc2626',
      rimLight: 'rgba(255,255,255,0.95)', rimDark: 'rgba(161,98,7,0.3)',
      gold: '#facc15', bodyEdge: '#e2e8f0', bodyHi: '#ffffff', belly: '#fffef7',
      finA: 'rgba(255,255,252,0.88)', finB: 'rgba(254,240,138,0.3)',
      ink: 'rgba(113,63,18,0.6)', inkSoft: 'rgba(161,98,7,0.42)',
      moteDark: '254,249,195', moteGold: '234,179,8',
      ribbon: '202,138,4', ribbonSoft: '250,204,21', headGlow: '#fef08a', horn: '#fde047'
    },
    sumi: {
      name: 'Thuỷ Mặc Chu Sa',
      hi1: '#475569', hi2: '#1e293b', hiDeep: '#0f172a', tancho: '#dc2626',
      rimLight: 'rgba(248,250,252,0.85)', rimDark: 'rgba(15,23,42,0.45)',
      gold: '#e2e8f0', bodyEdge: '#cbd5e1', bodyHi: '#f8fafc', belly: '#f1f5f9',
      finA: 'rgba(241,245,249,0.82)', finB: 'rgba(148,163,184,0.3)',
      ink: 'rgba(15,23,42,0.72)', inkSoft: 'rgba(51,65,85,0.5)',
      moteDark: '226,232,240', moteGold: '239,68,68',
      ribbon: '71,85,105', ribbonSoft: '148,163,184', headGlow: '#f87171', horn: '#ef4444'
    },
    imperialGold: {
      name: 'Hoàng Kim Long Vương',
      hi1: '#f59e0b', hi2: '#b45309', hiDeep: '#92400e', tancho: '#ef4444',
      rimLight: 'rgba(255,255,255,0.95)', rimDark: 'rgba(146,64,14,0.38)',
      gold: '#fef08a', bodyEdge: '#fcd34d', bodyHi: '#fffbeb', belly: '#fef3c7',
      finA: 'rgba(254,243,199,0.9)', finB: 'rgba(251,191,36,0.34)',
      ink: 'rgba(120,53,15,0.66)', inkSoft: 'rgba(180,83,9,0.5)',
      moteDark: '254,240,138', moteGold: '251,191,36',
      ribbon: '245,158,11', ribbonSoft: '253,224,71', headGlow: '#fde047', horn: '#fef08a'
    }
  };

  const GLYPHS = ['π', '∑', '∫', 'φ', '√', '∞', 'Δ', 'λ', 'Ω', 'α', '∂', 'E=mc²', 'f(x)'];
  const FORMULAS = ['∫eˣdx = eˣ+C', 'e^(iπ) = -1', 'φ = 1.61803', '∑1/n² = π²/6', 'O(n log n)'];
  const GENERIC_POEMS = [
    'Biển học mênh mông rèn chí lớn,<br>Đèn khuya sáng tỏ bậc kỳ tài.',
    'Một chữ tinh hoa ngàn năm quý,<br>Trăm trang sách mở vạn đường mây.',
    'Lý Ngư vượt sóng qua Vũ Môn,<br>Sao Khuê tỏa rạng chốn văn đàn.',
    'Mài mực đêm thu tầm chân lý,<br>Vững lòng khoa bảng dựng cơ đồ.'
  ];

  const EVENT_PRESETS = {
    normal: { stamp: 'Tu luyện Tri thức', gender: 'all', crest: 'seal', centerType: 'saokhue', poems: GENERIC_POEMS },
    vn_2010: {
      stamp: 'Kỷ niệm 20/10', gender: 'female', crest: 'camellia', centerType: 'camellia',
      poems: [
        'Tám chữ vàng son ngời sử Việt,<br>Khí phách dịu dàng rạng nước non.',
        'Anh hùng, bất khuất, trung hậu, đảm đang,<br>Sắc tâm trí tuệ sánh trăng rằm.',
        'Sen hồng đất Việt thơm ngàn thuở,<br>Tôn vinh nữ học giả văn đàn.',
        'Đoan trang trí huệ ngời trang sử,<br>Phụ nữ Việt Nam rạng bốn phương.'
      ]
    },
    vn_0803: {
      stamp: 'Kỷ niệm 08/03', gender: 'female', crest: 'camellia', centerType: 'camellia',
      poems: [
        'Tựa đóa trà my ngời sương sớm,<br>Trí huệ dịu dàng rạng sắc xuân.',
        'Nét ngọc đoan trang bừng trang sách,<br>Hương lan thanh khiết tỏa văn đàn.',
        'Chúc bậc nữ lưu giàu trí sáng,<br>Mỗi bước đường xa vạn đóa hồng.',
        'Dịu dàng bản lĩnh ngời tâm ngọc,<br>Rạng rỡ mùa xuân chốn học đường.'
      ]
    },
    vn_3004: {
      stamp: 'Kỷ niệm 30/04/1975', gender: 'all', crest: 'drum', centerType: 'drum',
      poems: [
        'Non sông liền một dải gấm hoa,<br>Bắc Nam sum họp khúc ca khải hoàn.',
        'Tháng Tư lịch sử rợp cờ bay,<br>Đất nước trọn niềm vui sum vầy.',
        'Máu xương dệt gấm non sông Việt,<br>Độc lập muôn đời tỏa ánh dương.',
        'Hòa bình nở thắm từng trang sách,<br>Vững bước dựng xây nước mạnh giàu.'
      ]
    },
    vn_0209: {
      stamp: 'Quốc khánh 02/09/1945', gender: 'all', crest: 'drum', centerType: 'drum',
      poems: [
        'Nước Việt Nam có quyền hưởng tự do và độc lập,<br>Ba Đình nắng tỏa rạng non sông.',
        'Trời thu Ba Đình vang Tuyên ngôn,<br>Sao vàng năm cánh rạng tâm hồn.',
        'Non sông gấm vóc ngàn năm vững,<br>Trí tuệ Việt Nam vươn biển khơi.',
        'Độc lập tự do ngời chân lý,<br>Muôn triệu người chung một niềm tin.'
      ]
    },
    vn_1003_al: {
      stamp: 'Giỗ Tổ 10/03 ÂL', gender: 'all', crest: 'drum', centerType: 'drum',
      poems: [
        'Dù ai đi ngược về xuôi,<br>Nhớ ngày Giỗ Tổ mùng Mười tháng Ba.',
        'Các Vua Hùng đã có công dựng nước,<br>Bác cháu ta phải cùng nhau giữ lấy nước.',
        'Cội nguồn Lạc Việt ngàn năm vững,<br>Con cháu Rồng Tiên rạng sử vàng.',
        'Đền Hùng khói tỏa linh khí tụ,<br>Muôn dân hướng vọng đất Phong Châu.'
      ]
    },
    vn_2011: {
      stamp: 'Tri ân 20/11', gender: 'all', crest: 'seal', centerType: 'saokhue',
      poems: [
        'Muốn sang thì bắc cầu kiều,<br>Muốn con hay chữ thì yêu lấy thầy.',
        'Chữ tâm người chở qua sông rộng,<br>Gieo hạt tri thức nở mùa vàng.',
        'Bụi phấn rơi đầy trang giáo án,<br>Dẫn đường bao thế hệ vươn xa.',
        'Nhất tự vi sư ơn nghĩa nặng,<br>Trọn đời khắc cốt đạo tôn sư.'
      ]
    },
    tet: {
      stamp: 'Tết Nguyên Đán 01/01 ÂL', gender: 'all', crest: 'lantern', centerType: 'tet',
      poems: [
        'Đào thắm mai vàng khoe sắc Tết,<br>Khai bút đầu xuân vạn chữ lành.',
        'Xuân về đất Việt bừng sức sống,<br>An khang thịnh vượng khắp muôn nhà.',
        'Mực tàu giấy đỏ đề câu đối,<br>Phúc lộc tài hoa trọn bốn mùa.',
        'Tân xuân cung chúc muôn điều phúc,<br>Đắc lộc vinh hoa vạn sự thành.'
      ]
    },
    midautumn: {
      stamp: 'Tết Trung Thu 15/08 ÂL', gender: 'all', crest: 'lantern', centerType: 'midautumn',
      poems: [
        'Trăng thu vằng vặc soi đình viện,<br>Đèn kéo quân xoay trọn nghĩa tình.',
        'Lý Ngư vọng nguyệt đêm rằm sáng,<br>Sum họp đoàn viên ấm chén trà.',
        'Ánh nguyệt thanh cao soi trang sách,<br>Thu phong mát dịu chốn thư phòng.',
        'Trăng tròn tháng Tám tình viên mãn,<br>Phá cỗ trông trăng rộn tiếng cười.'
      ]
    },
    birthday: {
      stamp: 'Khánh Tuế Sinh Nhật', gender: 'all', crest: 'lantern', centerType: 'lantern',
      poems: [
        'Thêm một mùa xuân thêm trí sáng,<br>Chân trời học vấn rộng thênh thang.',
        'Chúc tuổi mới ngời muôn ý đẹp,<br>Vững bước đường mây đạt sở cầu.',
        'Hoa đăng tỏa sáng mừng sinh nhật,<br>Bút sắc tâm trong rạng công thành.',
        'Vượt sóng Vũ Môn nghênh tuổi mới,<br>Học vị thăng hoa vạn sự lành.'
      ]
    },
    vn_0101: {
      stamp: 'Tân Niên 01/01', gender: 'all', crest: 'lantern', centerType: 'lantern',
      poems: [
        'Khởi đầu năm mới tràn sinh khí,<br>Vạn dặm đường mây mở lối vàng.',
        'Chúc năm mới trí tâm bừng sáng,<br>Mọi dự định lớn đều hanh thông.',
        'Tân niên vạn sự như ý nguyện,<br>Học thuật thăng hoa đạt đỉnh cao.',
        'Trang lịch mới mở ngàn hy vọng,<br>Bình an thịnh vượng suốt bốn mùa.'
      ]
    },
    vn_2512: {
      stamp: 'Giáng Sinh 25/12', gender: 'all', crest: 'lantern', centerType: 'lantern',
      poems: [
        'Chuông ngân ấm áp đêm đông lạnh,<br>An lành hạnh phúc khắp nhân gian.',
        'Tuyết hoa lấp lánh soi khung cửa,<br>Bình yên lan tỏa mọi tâm hồn.',
        'Đêm đông thắp sáng niềm hy vọng,<br>Sum vầy ấm áp bên người thân.',
        'Chúc mùa Giáng Sinh tràn hơi ấm,<br>An hòa thịnh vượng đón năm sang.'
      ]
    },
    vn_1905: {
      stamp: 'Kỷ niệm 19/05/1890', gender: 'all', crest: 'lotus', centerType: 'lotus',
      poems: [
        'Tháp Mười đẹp nhất bông sen,<br>Việt Nam đẹp nhất có tên Bác Hồ.',
        'Hương sen Làng Sen thơm muôn thuở,<br>Đức độ Người soi sáng non sông.',
        'Tháng Năm nhớ Bác lòng thêm sáng,<br>Tu rèn tri thức dựng quê hương.',
        'Non sông ngàn dặm in dấu Bác,<br>Soi đường thế hệ bước vươn cao.'
      ]
    },
    vn_1507_al: {
      stamp: 'Vu Lan 15/07 ÂL', gender: 'all', crest: 'lotus', centerType: 'lotus',
      poems: [
        'Công cha như núi Thái Sơn,<br>Nghĩa mẹ như nước trong nguồn chảy ra.',
        'Bông hồng cài áo mùa hiếu hạnh,<br>Nguyện cầu cha mẹ mãi bình an.',
        'Một lòng thờ mẹ kính cha,<br>Cho tròn chữ hiếu mới là đạo con.',
        'Tháng Bảy mưa ngâu lòng tưởng nhớ,<br>Ơn sinh thành dưỡng dục biển trời.'
      ]
    },
    vn_2312_al: {
      stamp: 'Ông Công Ông Táo 23/12 ÂL', gender: 'all', crest: 'seal', centerType: 'saokhue',
      poems: [
        'Cá chép vượt sóng hóa Rồng thiêng,<br>Đưa Táo về trời tấu việc hiền.',
        'Bếp lửa hồng ấm tình gia đạo,<br>Khép lại năm cũ đón xuân sang.',
        'Vũ Môn sóng vỗ rền mây biếc,<br>Vượt vũ môn quan hóa cửu long.',
        'Hai ba tháng Chạp đưa ông Táo,<br>Rộn rã đường xuân khắp phố phường.'
      ]
    }
  };

  const DRUM_KEYS = ['vn_0302', 'vn_1003_al', 'vn_3004', 'vn_0705', 'vn_2707', 'vn_1908', 'vn_0209', 'vn_1010', 'vn_2212', 'vn_1908_ca', 'vn_1811', 'vn_2311'];
  const LOTUS_KEYS = ['vn_1905', 'vn_2707', 'vn_2806', 'vn_0110', 'vn_2702', 'vn_0303_al', 'vn_1504_al', 'vn_0505_al', 'vn_1507_al'];
  const LANTERN_KEYS = ['vn_0106', 'vn_2003', 'vn_1501_al', 'vn_0101', 'vn_2512'];

  function inferCenter(key) {
    if (DRUM_KEYS.indexOf(key) >= 0) return { crest: 'drum', centerType: 'drum' };
    if (LOTUS_KEYS.indexOf(key) >= 0) return { crest: 'lotus', centerType: 'lotus' };
    if (LANTERN_KEYS.indexOf(key) >= 0) return { crest: 'lantern', centerType: 'lantern' };
    if (key === 'vn_2010' || key === 'vn_0803') return { crest: 'camellia', centerType: 'camellia' };
    if (key === 'midautumn') return { crest: 'lantern', centerType: 'midautumn' };
    if (key === 'tet') return { crest: 'lantern', centerType: 'tet' };
    return { crest: 'seal', centerType: 'saokhue' };
  }

  function getEvent(key) {
    if (EVENT_PRESETS[key]) return EVENT_PRESETS[key];
    const inf = inferCenter(key);
    let label = 'Kỷ niệm F-Forum';
    const sel = document.getElementById('fullHolidaySelect');
    if (sel && typeof sel.querySelector === 'function') {
      const opt = sel.querySelector('option[value="' + key + '"]');
      const txt = opt && opt.textContent ? String(opt.textContent) : '';
      if (txt) label = txt.split('—').pop().trim();
      label = (key.indexOf('_al') > 0 ? 'Lễ hội: ' : 'Kỷ niệm: ') + label;
    }
    return { stamp: label, gender: 'all', crest: inf.crest, centerType: inf.centerType, poems: GENERIC_POEMS };
  }

  const FFORUM_CREST_SVGS = {
    seal: '<svg viewBox="0 0 40 40" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="12.5,2.5 27.5,2.5 37.5,12.5 37.5,27.5 27.5,37.5 12.5,37.5 2.5,27.5 2.5,12.5" fill="currentColor" fill-opacity="0.08" stroke-opacity="0.55"/><circle cx="20" cy="20" r="13.5" stroke-dasharray="2 2" stroke-opacity="0.4"/><path d="M13.5 28.5V11.5C13.5 11.5 19.5 10.2 27 11.5" stroke-width="2.3"/><path d="M13.5 19.5H23.5" stroke-width="2.2"/><path d="M10.8 28.5H16.2" stroke-width="1.8"/><path d="M27.5 8.5L28.6 11.4L31.5 12.5L28.6 13.6L27.5 16.5L26.4 13.6L23.5 12.5L26.4 11.4Z" fill="currentColor" stroke="none"/></svg>',
    camellia: '<svg viewBox="0 0 40 40" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="12.5,2.5 27.5,2.5 37.5,12.5 37.5,27.5 27.5,37.5 12.5,37.5 2.5,27.5 2.5,12.5" fill="currentColor" fill-opacity="0.08" stroke-opacity="0.45"/><path d="M20 7.5C23 12 23 16 20 17C17 16 17 12 20 7.5Z" fill="currentColor" fill-opacity="0.2"/><path d="M20 32.5C23 28 23 24 20 23C17 24 17 28 20 32.5Z" fill="currentColor" fill-opacity="0.2"/><path d="M7.5 20C12 17 16 17 17 20C16 23 12 23 7.5 20Z" fill="currentColor" fill-opacity="0.2"/><path d="M32.5 20C28 17 24 17 23 20C24 23 28 23 32.5 20Z" fill="currentColor" fill-opacity="0.2"/><path d="M17.5 23.5V16.5H23.5M17.5 20H22" stroke-width="2.1"/></svg>',
    drum: '<svg viewBox="0 0 40 40" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="20" r="16.5" stroke-opacity="0.5"/><circle cx="20" cy="20" r="11.5" stroke-dasharray="2.5 2" stroke-opacity="0.45"/><path d="M20 7L21.4 13.6L28 12L23 17L29 20L23 23L28 28L21.4 26.4L20 33L18.6 26.4L12 28L17 23L11 20L17 17L12 12L18.6 13.6Z" fill="currentColor" fill-opacity="0.18"/><path d="M17.5 24V16H23.5M17.5 20H22" stroke-width="2.2"/></svg>',
    lotus: '<svg viewBox="0 0 40 40" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="12.5,2.5 27.5,2.5 37.5,12.5 37.5,27.5 27.5,37.5 12.5,37.5 2.5,27.5 2.5,12.5" stroke-opacity="0.4"/><path d="M20 8C24 14.5 25 21.5 20 28C15 21.5 16 14.5 20 8Z" fill="currentColor" fill-opacity="0.18"/><path d="M20 28C25.5 26 30 20.5 31 14C25.5 16 22 20.5 20 28Z"/><path d="M20 28C14.5 26 10 20.5 9 14C14.5 16 18 20.5 20 28Z"/><path d="M17.5 23.5V16H23M17.5 19.8H21.8" stroke-width="2.1"/></svg>',
    lantern: '<svg viewBox="0 0 40 40" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="12.5,2.5 27.5,2.5 37.5,12.5 37.5,27.5 27.5,37.5 12.5,37.5 2.5,27.5 2.5,12.5" stroke-opacity="0.4"/><ellipse cx="20" cy="19" rx="9.5" ry="8" fill="currentColor" fill-opacity="0.14"/><path d="M15.5 11H24.5M15.5 27H24.5M20 7V11M20 27V33"/><path d="M17.5 23V15.5H23M17.5 19.2H21.8" stroke-width="2.1"/></svg>'
  };

  const CFG = window.astralDragonCfg = {
    presets: EVENT_PRESETS, getEvent, crests: FFORUM_CREST_SVGS,
    userGender: extCfg.userGender || 'female',
    poemIdx: 0,
    species: 'koi',
    breed: extCfg.breed || 'tancho',           // tancho | gold | white
    skin: extCfg.skin || 'solar',
    eventMode: extCfg.eventMode || 'vn_2010',
    customWish: extCfg.customWish || '',
    scale: 1.05, waveAmp: 1.0,
    showGlyphs: true, showLotus: true,
    paused: false, force2D: true, spinDir: 1,
    typingFocus: false,
    vuMonEnergy: 0, dragonAscended: false,
    triggerPulse: null, rebuildSkin: null, setBreed: null, setEventMode: null,
    spawnKnowledgeFood: null, ascendDragon: null, announceWish: null
  };

  /* ============================================================
     PHẦN 1 — SPRITE KOI SIÊU CHI TIẾT (vẽ offscreen, cache lại)
     ============================================================ */
  const IW = 1280, IH = 560, AXIS_V = 0.5, NOSE_U = 0.075;
  const spriteCv = document.createElement('canvas');
  spriteCv.width = IW; spriteCv.height = IH;
  const sctx = spriteCv.getContext('2d');

  function organicNoise(x, y) {
    return Math.sin(x * 12.7 + y * 7.3) * 0.45 +
           Math.cos(x * 23.1 + y * 19.4) * 0.30 +
           Math.sin(x * 41.8 + y * 33.2) * 0.15 +
           Math.cos(x * 73.5 + y * 61.7) * 0.10;
  }

  /* Nửa bề cao thân theo u (0..1), đường cong giải phẫu mềm mại */
  function koiHalfWidth(u) {
    if (u <= 0.055) return 0;
    if (u < 0.12) { const t = (u - 0.055) / 0.065; return 4 + 28 * Math.pow(Math.sin(t * Math.PI / 2), 0.8); }
    if (u < 0.20) { const t = (u - 0.12) / 0.08; return 32 + 26 * Math.sin(t * Math.PI / 2); }
    if (u < 0.34) { const t = (u - 0.20) / 0.14; return 58 + 20 * Math.sin(t * Math.PI / 2); }
    if (u < 0.62) { const t = (u - 0.34) / 0.28; return 78 - 5 * t - 3 * Math.sin(t * Math.PI); }
    if (u < 0.80) { const t = (u - 0.62) / 0.18; return 73 * Math.pow(1 - t, 1.22) + 14; }
    if (u < 0.84) { const t = (u - 0.80) / 0.04; return 14 - 5 * t; }
    return 0;
  }
  function topMul(u) { return u < 0.2 ? 1 : (u < 0.62 ? 0.93 : 1.0); }
  function bellyMul(u) { return u < 0.18 ? 0.96 : (u < 0.66 ? 1.08 : 1.0); }

  function traceBody(ctx) {
    ctx.beginPath();
    const step = 0.004;
    let first = true;
    for (let u = 0.055; u <= 0.84; u += step) {
      const hw = koiHalfWidth(u), x = u * IW;
      if (first) { ctx.moveTo(x, 280 - hw * topMul(u)); first = false; }
      else ctx.lineTo(x, 280 - hw * topMul(u));
    }
    for (let u = 0.84; u >= 0.055; u -= step) {
      const hw = koiHalfWidth(u);
      ctx.lineTo(u * IW, 280 + hw * bellyMul(u));
    }
    ctx.closePath();
  }

  /* Tia vây lụa: các đường quạt cong mảnh, có xương chính đậm hơn */
  function finRays(ctx, rx, ry, a0, a1, n, lenFn, bend) {
    for (let i = 0; i < n; i++) {
      const f = n === 1 ? 0 : i / (n - 1);
      const ang = a0 + (a1 - a0) * f;
      const len = lenFn(f);
      const mx = rx + Math.cos(ang) * len * 0.52 + Math.cos(ang + bend) * len * 0.12;
      const my = ry + Math.sin(ang) * len * 0.52 + Math.sin(ang + bend) * len * 0.12;
      const ex = rx + Math.cos(ang) * len, ey = ry + Math.sin(ang) * len;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.stroke();
    }
  }

  function drawFins(ctx, pal, breed, ascended) {
    const cy = IH * AXIS_V;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';

    /* --- Vây đuôi (caudal) lớn, xẻ thùy kép --- */
    ctx.save();
    ctx.beginPath();
    const tailRootX = 0.805 * IW, pedX = 0.835 * IW;
    ctx.moveTo(tailRootX, cy - 13);
    ctx.bezierCurveTo(0.86 * IW, cy - 60, 0.92 * IW, cy - 118, 0.985 * IW, cy - 128);
    ctx.quadraticCurveTo(0.95 * IW, cy - 60, 0.905 * IW, cy - 9);
    ctx.quadraticCurveTo(0.95 * IW, cy + 60, 0.985 * IW, cy + 128);
    ctx.bezierCurveTo(0.92 * IW, cy + 118, 0.86 * IW, cy + 60, pedX, cy + 13);
    ctx.closePath();
    const tg = ctx.createLinearGradient(tailRootX, cy, 0.985 * IW, cy);
    tg.addColorStop(0, pal.finA); tg.addColorStop(0.55, pal.finB); tg.addColorStop(1, 'rgba(255,255,255,0.02)');
    ctx.fillStyle = tg; ctx.fill();
    ctx.clip();
    ctx.strokeStyle = pal.rimLight;
    finRays(ctx, tailRootX + 14, cy, -2.35, -0.78, 13, f => 150 + Math.sin(f * Math.PI) * 42, -0.25);
    ctx.lineWidth = 1.5;
    finRays(ctx, tailRootX + 14, cy, 0.78, 2.35, 13, f => 150 + Math.sin(f * Math.PI) * 42, 0.25);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = pal.inkSoft; ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(tailRootX, cy - 13);
    ctx.bezierCurveTo(0.86 * IW, cy - 60, 0.92 * IW, cy - 118, 0.985 * IW, cy - 128);
    ctx.moveTo(pedX, cy + 13);
    ctx.bezierCurveTo(0.86 * IW, cy + 60, 0.92 * IW, cy + 118, 0.985 * IW, cy + 128);
    ctx.stroke();
    ctx.restore();

    /* --- Vây lưng (dorsal) răng cường mềm --- */
    ctx.save();
    ctx.beginPath();
    const d0 = 0.26 * IW, d1 = 0.65 * IW;
    ctx.moveTo(d0, cy - koiHalfWidth(0.26) * topMul(0.26) + 2);
    const peaks = 7;
    for (let i = 1; i <= peaks; i++) {
      const u = 0.26 + (0.65 - 0.26) * (i / peaks);
      const x = u * IW;
      const h = 26 + Math.sin((i / peaks) * Math.PI) * 14;
      ctx.quadraticCurveTo(x - 14, cy - koiHalfWidth(u) * topMul(u) - h * 0.7, x, cy - koiHalfWidth(u) * topMul(u) - h);
    }
    ctx.lineTo(d1, cy - koiHalfWidth(0.65) * topMul(0.65) + 2);
    ctx.closePath();
    const dg = ctx.createLinearGradient(0, cy - 90, 0, cy);
    dg.addColorStop(0, pal.finB); dg.addColorStop(1, pal.finA);
    ctx.fillStyle = dg; ctx.fill();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
    for (let i = 0; i < 16; i++) {
      const u = 0.27 + i * 0.023, x = u * IW;
      ctx.beginPath();
      ctx.moveTo(x, cy - koiHalfWidth(u) * topMul(u));
      ctx.lineTo(x - 6, cy - koiHalfWidth(u) * topMul(u) - 22 - Math.sin(i * 0.7) * 8);
      ctx.stroke();
    }
    ctx.restore();

    /* --- Vây hậu môn (anal) --- */
    ctx.save();
    ctx.beginPath();
    const a0x = 0.50 * IW, a1x = 0.71 * IW;
    ctx.moveTo(a0x, cy + koiHalfWidth(0.5) * bellyMul(0.5) - 2);
    for (let i = 1; i <= 5; i++) {
      const u = 0.50 + (0.71 - 0.50) * (i / 5), x = u * IW;
      const h = 18 + Math.sin((i / 5) * Math.PI) * 10;
      ctx.quadraticCurveTo(x - 10, cy + koiHalfWidth(u) * bellyMul(u) + h * 0.6, x, cy + koiHalfWidth(u) * bellyMul(u) + h);
    }
    ctx.lineTo(a1x, cy + koiHalfWidth(0.71) * bellyMul(0.71) - 2);
    ctx.closePath();
    ctx.fillStyle = pal.finB; ctx.fill();
    ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
    for (let i = 0; i < 10; i++) {
      const u = 0.51 + i * 0.02, x = u * IW;
      ctx.beginPath();
      ctx.moveTo(x, cy + koiHalfWidth(u) * bellyMul(u));
      ctx.lineTo(x - 5, cy + koiHalfWidth(u) * bellyMul(u) + 18);
      ctx.stroke();
    }
    ctx.restore();

    /* --- Cặp vây bụng (pelvic) nhỏ --- */
    [-1, 1].forEach(sd => {
      ctx.save();
      const px = 0.45 * IW, py = cy + sd * koiHalfWidth(0.45) * 0.9;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + 22, py + sd * 44, px + 52, py + sd * 38);
      ctx.quadraticCurveTo(px + 34, py + sd * 14, px + 6, py - sd * 3);
      ctx.closePath();
      ctx.fillStyle = pal.finB; ctx.fill();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + 12 + i * 7, py + sd * (10 + i * 5));
        ctx.stroke();
      }
      ctx.restore();
    });

    /* --- Cặp vây ngực (pectoral) sau nắp mang: cánh quạt lớn, hay rung --- */
    [-1, 1].forEach(sd => {
      ctx.save();
      const rx = 0.185 * IW, ry = cy + sd * 30;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.bezierCurveTo(rx - 52, ry + sd * 34, rx - 86, ry + sd * 86, rx - 118, ry + sd * 96);
      ctx.quadraticCurveTo(rx - 70, ry + sd * 58, rx - 34, ry - sd * 6);
      ctx.closePath();
      const pg = ctx.createRadialGradient(rx, ry, 4, rx - 70, ry + sd * 60, 130);
      pg.addColorStop(0, pal.finA); pg.addColorStop(0.7, pal.finB); pg.addColorStop(1, 'rgba(255,255,255,0.02)');
      ctx.fillStyle = pg; ctx.fill();
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.2;
      const baseAng = sd > 0 ? 1.05 : -1.05;
      finRays(ctx, rx, ry, baseAng - 0.55, baseAng + 0.55, 13, f => 78 + Math.sin(f * Math.PI) * 42, sd * 0.3);
      ctx.lineWidth = 2.4;
      finRays(ctx, rx, ry, baseAng, baseAng, 1, f => 112, 0);
      ctx.restore();
      ctx.save();
      ctx.strokeStyle = pal.inkSoft; ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.bezierCurveTo(rx - 52, ry + sd * 34, rx - 86, ry + sd * 86, rx - 118, ry + sd * 96);
      ctx.stroke();
      ctx.restore();
    });
  }

  /* Mảng màu Kohaku: các mảng đỏ viền mềm hữu cơ */
  function drawHiPattern(ctx, pal, breed) {
    const cy = IH * AXIS_V;
    if (breed === 'gold') return;
    const patches = breed === 'white'
      ? [{ u: 0.138, v: -0.62, ru: 0.03, rv: 0.1, tiny: true }]
      : [
          { u: 0.31, v: -0.1, ru: 0.105, rv: 0.36 },
          { u: 0.48, v: 0.26, ru: 0.085, rv: 0.3 },
          { u: 0.63, v: -0.2, ru: 0.07, rv: 0.24 }
        ];
    ctx.save();
    traceBody(ctx); ctx.clip();
    patches.forEach(pt => {
      const cx = pt.u * IW, cyy = cy + pt.v * 70;
      const rX = pt.ru * IW, rY = pt.rv * 78;
      for (let k = 0; k < 14; k++) {
        const a = (k / 14) * Math.PI * 2;
        const nz = organicNoise(pt.u * 9 + Math.cos(a), pt.v * 9 + Math.sin(a));
        const jx = Math.cos(a) * rX * (0.72 + nz * 0.22);
        const jy = Math.sin(a) * rY * (0.72 + nz * 0.22);
        const g = ctx.createRadialGradient(cx + jx * 0.4, cyy + jy * 0.4, 2, cx + jx, cyy + jy, rX * 0.55);
        g.addColorStop(0, pal.hi1);
        g.addColorStop(0.7, pal.hi2);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = pt.tiny ? 0.85 : 0.78;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx + jx, cyy + jy, rX * (pt.tiny ? 0.42 : 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    ctx.restore();

    /* Ấn Tancho Chu Sa trên đỉnh trán (riêng biệt, luôn sắc nét) */
    if (breed !== 'gold') {
      const tx = 0.142 * IW;
      const tg = ctx.createRadialGradient(tx - 5, cy - 8, 3, tx, cy - 4, 30);
      tg.addColorStop(0, pal.tancho);
      tg.addColorStop(0.75, pal.hiDeep || pal.hi2);
      tg.addColorStop(1, 'rgba(185,28,28,0)');
      ctx.save();
      traceBody(ctx); ctx.clip();
      ctx.fillStyle = tg;
      ctx.beginPath();
      ctx.ellipse(tx, cy - 6, 27, 23, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* 700+ vảy ngói: bóng đổ, viền sáng lưng + viền tối bụng, xếp so le */
  function drawScales(ctx, pal, breed, skin) {
    const cy = IH * AXIS_V;
    ctx.save();
    traceBody(ctx); ctx.clip();
    const cols = 40;
    for (let c = 0; c <= cols; c++) {
      const u = 0.195 + (c / cols) * 0.60;
      const x = u * IW;
      const hw = koiHalfWidth(u);
      const r = Math.max(7, 11 + Math.sin((1 - c / cols) * Math.PI) * 4.5);
      const rows = Math.ceil(hw / (r * 0.72));
      for (let rr = -rows; rr <= rows; rr++) {
        const yOff = (rr + (c % 2) * 0.5) * (r * 0.74);
        if (Math.abs(yOff) > hw * 0.97) continue;
        const y = cy + yOff;
        const vNorm = yOff / (hw || 1);
        const onHi = breed !== 'white' && breed !== 'gold' &&
          ((Math.hypot((u - 0.31) * 2.1, (vNorm + 0.1) * 0.9) < 0.42) ||
           (Math.hypot((u - 0.48) * 2.4, (vNorm - 0.26) * 1.0) < 0.34) ||
           (Math.hypot((u - 0.63) * 2.6, (vNorm + 0.2) * 1.1) < 0.3));
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(vNorm * 0.16);
        /* bóng đổ dưới mỗi vảy */
        ctx.fillStyle = 'rgba(15,23,42,0.13)';
        ctx.beginPath();
        ctx.ellipse(2, 1.6, r * 1.02, r * 0.78, 0, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.fill();
        /* nền vảy: trên mảng đỏ thì phủ đỏ mỏng để thấy vảy */
        if (onHi) {
          ctx.fillStyle = 'rgba(255,255,255,0.10)';
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 1.05, r * 0.8, 0, -Math.PI * 0.55, Math.PI * 0.55);
          ctx.fill();
        } else if (breed === 'gold') {
          const lg = 235 + Math.round(18 * Math.sqrt(Math.max(0, 1 - vNorm * vNorm)));
          ctx.fillStyle = 'rgba(' + lg + ',' + Math.round(lg * 0.82) + ',' + Math.round(lg * 0.45) + ',0.5)';
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 1.05, r * 0.8, 0, -Math.PI * 0.55, Math.PI * 0.55);
          ctx.fill();
        }
        /* viền sáng nửa lưng */
        ctx.strokeStyle = onHi ? 'rgba(254,240,138,0.75)' : (skin === 'kintsugi' ? 'rgba(250,204,21,0.6)' : pal.rimLight);
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.04, r * 0.8, 0, Math.PI * 1.05, Math.PI * 1.95);
        ctx.stroke();
        /* viền tối nửa bụng */
        ctx.strokeStyle = onHi ? 'rgba(127,29,29,0.45)' : pal.rimDark;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.04, r * 0.8, 0, Math.PI * 0.05, Math.PI * 0.95);
        ctx.stroke();
        /* điểm bắt sáng li ti trên vài vảy */
        if ((c * 7 + rr * 13) % 11 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.beginPath();
          ctx.arc(-r * 0.35, -r * 0.28, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }
    ctx.restore();
  }

  /* Đường bên (lateral line) + lỗ chân lông cảm giác */
  function drawLateralLine(ctx, pal) {
    const cy = IH * AXIS_V;
    ctx.save();
    traceBody(ctx); ctx.clip();
    ctx.strokeStyle = 'rgba(71,85,105,0.28)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let u = 0.205; u <= 0.78; u += 0.01) {
      const x = u * IW, y = cy + Math.sin(u * 22) * 3 + 2;
      if (u === 0.205) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = pal.inkSoft;
    for (let u = 0.21; u <= 0.77; u += 0.018) {
      const x = u * IW, y = cy + Math.sin(u * 22) * 3 + 2;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* Nắp mang, đầu, miệng, lỗ mũi, lỗ cảm giác, hốc mắt (mắt vẽ động mỗi frame) */
  function drawHeadAndGill(ctx, pal) {
    const cy = IH * AXIS_V;
    ctx.save();
    traceBody(ctx); ctx.clip();

    /* nắp mang (operculum): 3 cung đồng tâm + bóng lưỡi liềm */
    const gx = 0.158 * IW;
    const crescent = ctx.createLinearGradient(gx + 30, cy - 50, gx + 62, cy + 50);
    crescent.addColorStop(0, 'rgba(15,23,42,0)');
    crescent.addColorStop(0.5, 'rgba(15,23,42,0.14)');
    crescent.addColorStop(1, 'rgba(15,23,42,0)');
    ctx.fillStyle = crescent;
    ctx.beginPath();
    ctx.ellipse(gx + 40, cy, 34, 56, 0, -1.2, 1.2);
    ctx.fill();
    ctx.strokeStyle = pal.ink;
    [42, 50, 58].forEach((rad, i) => {
      ctx.lineWidth = 2 - i * 0.4;
      ctx.globalAlpha = 0.85 - i * 0.18;
      ctx.beginPath();
      ctx.arc(gx, cy, rad, -1.15, 1.15);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
    /* viền sáng mép nắp mang */
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(gx - 2, cy, 40, -1.0, 1.0);
    ctx.stroke();

    /* hốc mắt đổ bóng mềm (mắt thật vẽ động ở bước overlay) */
    [-1, 1].forEach(sd => {
      const ex = 0.118 * IW, ey = cy + sd * 27.5;
      const sg = ctx.createRadialGradient(ex, ey, 2, ex, ey, 12);
      sg.addColorStop(0, 'rgba(15,23,42,0.22)');
      sg.addColorStop(1, 'rgba(15,23,42,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.ellipse(ex, ey, 11, 9, sd * 0.2, 0, Math.PI * 2);
      ctx.fill();
    });

    /* Miệng vẽ động mỗi frame (drawHeadFeatures) để ngậm nhịp + đớp mồi, không vẽ trùng ở sprite */

    /* 2 lỗ mũi */
    [-1, 1].forEach(sd => {
      ctx.fillStyle = pal.ink;
      ctx.beginPath();
      ctx.ellipse(0.1 * IW, cy + sd * 10, 2.6, 1.7, sd * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(0.1 * IW - 0.8, cy + sd * 10 - 0.6, 0.8, 0, Math.PI * 2);
      ctx.fill();
    });

    /* lỗ cảm giác trên đầu & má (chi tiết vi mô) */
    ctx.fillStyle = 'rgba(71,85,105,0.55)';
    for (let i = 0; i < 9; i++) {
      const u = 0.085 + (i % 3) * 0.018;
      const sd = i < 3 ? -1 : 1;
      const row = Math.floor(i / 3) % 3;
      ctx.beginPath();
      ctx.arc(u * IW, cy + sd * (16 + row * 5.5), 1.15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* Viền thân rõ ràng 2 lớp + ánh ướt + mạch vàng Kintsugi + mào Kim Long */
  function drawOutlineAndGlaze(ctx, pal, skin, ascended, breed) {
    const cy = IH * AXIS_V;
    ctx.save();
    traceBody(ctx);
    ctx.strokeStyle = 'rgba(15,23,42,0.18)';
    ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = pal.ink;
    ctx.lineWidth = 2.1; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 0.9;
    ctx.save();
    traceBody(ctx); ctx.clip();
    ctx.translate(0, -2.2);
    traceBody(ctx); ctx.stroke();
    ctx.restore();
    ctx.restore();

    /* dải ánh sáng ướt chạy dọc lườn */
    ctx.save();
    traceBody(ctx); ctx.clip();
    const wet = ctx.createLinearGradient(0, cy - 20, 0, cy + 20);
    wet.addColorStop(0, 'rgba(255,255,255,0)');
    wet.addColorStop(0.42, 'rgba(255,255,255,0.42)');
    wet.addColorStop(0.58, 'rgba(255,255,255,0.42)');
    wet.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = wet;
    ctx.fillRect(0.08 * IW, cy - 20, 0.72 * IW, 40);
    /* vài tia lấp lánh */
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    [[0.28, -14], [0.42, 10], [0.57, -9], [0.69, 8]].forEach(p => {
      const x = p[0] * IW, y = cy + p[1];
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y);
      ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
      ctx.stroke();
    });
    ctx.restore();

    /* mạch vàng Kintsugi: đường chính + nhánh nhỏ, chạy dọc sống lưng */
    if (skin === 'kintsugi') {
      ctx.save();
      traceBody(ctx); ctx.clip();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.1; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let u = 0.18; u <= 0.76; u += 0.012) {
        const x = u * IW, y = cy - koiHalfWidth(u) * 0.55 + Math.sin(u * 38) * 5;
        if (u === 0.18) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.lineWidth = 1.3;
      [0.33, 0.52, 0.66].forEach((u, i) => {
        const x = u * IW, y = cy - koiHalfWidth(u) * 0.55;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 14, y + 16 + i * 6);
        ctx.stroke();
      });
      ctx.restore();
    }

    /* mào vảy vàng dọc sống lưng khi hóa Kim Long */
    if (ascended) {
      ctx.save();
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      for (let u = 0.22; u <= 0.64; u += 0.035) {
        const x = u * IW, y = cy - koiHalfWidth(u) * topMul(u);
        ctx.beginPath();
        ctx.moveTo(x - 6, y + 1);
        ctx.lineTo(x, y - 11 - Math.sin(u * 30) * 3);
        ctx.lineTo(x + 6, y + 1);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawBodyBase(ctx, pal, breed, ascended) {
    const cy = IH * AXIS_V;
    ctx.save();
    traceBody(ctx);
    const g = ctx.createLinearGradient(0, cy - 80, 0, cy + 80);
    if (breed === 'gold' || ascended) {
      g.addColorStop(0, '#b45309');
      g.addColorStop(0.25, '#f59e0b');
      g.addColorStop(0.5, '#fde68a');
      g.addColorStop(0.78, '#f59e0b');
      g.addColorStop(1, '#92400e');
    } else if (breed === 'white') {
      g.addColorStop(0, '#dbe4ee');
      g.addColorStop(0.22, '#f8fafc');
      g.addColorStop(0.5, '#ffffff');
      g.addColorStop(0.8, '#f1f5f9');
      g.addColorStop(1, '#cbd5e1');
    } else {
      g.addColorStop(0, pal.bodyEdge);
      g.addColorStop(0.18, pal.bodyHi);
      g.addColorStop(0.5, '#ffffff');
      g.addColorStop(0.82, pal.belly);
      g.addColorStop(1, pal.bodyEdge);
    }
    ctx.fillStyle = g;
    ctx.fill();
    /* ấm bụng nhẹ */
    const belly = ctx.createRadialGradient(0.45 * IW, cy + 55, 10, 0.45 * IW, cy + 55, 220);
    belly.addColorStop(0, breed === 'gold' ? 'rgba(254,243,199,0.5)' : 'rgba(255,247,237,0.55)');
    belly.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = belly;
    ctx.fillRect(0.1 * IW, cy, 0.7 * IW, 110);
    ctx.restore();
  }

  /* Vương miện sinh nhật / gài trà mi nữ học giả */
  function drawHeadAccessory(ctx, eventMode, gender) {
    const cy = IH * AXIS_V;
    if (eventMode === 'birthday') {
      const cx = 0.138 * IW;
      ctx.save();
      ctx.fillStyle = '#fde047'; ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy - 22); ctx.lineTo(cx - 9, cy - 34);
      ctx.lineTo(cx - 3, cy - 24); ctx.lineTo(cx + 2, cy - 38);
      ctx.lineTo(cx + 7, cy - 24); ctx.lineTo(cx + 13, cy - 34);
      ctx.lineTo(cx + 16, cy - 22);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      [-12, 2, 14].forEach((dx, i) => {
        ctx.fillStyle = i === 1 ? '#f43f5e' : '#38bdf8';
        ctx.beginPath(); ctx.arc(cx + dx, cy - 24, 2.6, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
    } else if ((eventMode === 'vn_2010' || eventMode === 'vn_0803') && gender === 'female') {
      const cx = 0.152 * IW, py = cy - 30;
      ctx.save();
      ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx - 10, py + 6); ctx.lineTo(cx + 12, py + 10); ctx.stroke();
      ctx.translate(cx, py);
      for (let i = 0; i < 5; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / 5);
        ctx.fillStyle = i % 2 === 0 ? '#f472b6' : '#fbcfe8';
        ctx.beginPath();
        ctx.ellipse(0, -6.5, 4.2, 6.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#fef08a';
      ctx.beginPath(); ctx.arc(0, 0, 2.8, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function buildSprite() {
    const pal = CFG.dragonAscended ? PALETTES.imperialGold : (PALETTES[CFG.skin] || PALETTES.solar);
    sctx.clearRect(0, 0, IW, IH);
    drawFins(sctx, pal, CFG.breed, CFG.dragonAscended);
    drawBodyBase(sctx, pal, CFG.breed, CFG.dragonAscended);
    drawHiPattern(sctx, pal, CFG.breed);
    drawScales(sctx, pal, CFG.breed, CFG.skin);
    drawLateralLine(sctx, pal);
    drawHeadAndGill(sctx, pal);
    drawOutlineAndGlaze(sctx, pal, CFG.skin, CFG.dragonAscended, CFG.breed);
    drawHeadAccessory(sctx, CFG.eventMode, CFG.userGender);
  }
  buildSprite();

  /* ============================================================
     PHẦN 2 — MESH 2.5D + CHUYỂN ĐỘNG UYỂN CHUYỂN
     ============================================================ */
  const GX = 60, GY = 28, NV = (GX + 1) * (GY + 1);
  const uvs = new Float32Array(NV * 2), xy = new Float32Array(NV * 2), idx = [];
  for (let y = 0; y <= GY; y++) for (let x = 0; x <= GX; x++) {
    const o = (y * (GX + 1) + x) * 2;
    uvs[o] = x / GX; uvs[o + 1] = y / GY;
  }
  for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) {
    const a = y * (GX + 1) + x, b = a + 1, c = a + GX + 1, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }

  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483000';
  const uc = cv.getContext('2d');
  const fx = document.createElement('canvas');
  fx.setAttribute('aria-hidden', 'true');
  fx.style.cssText = cv.style.cssText;
  const fc = fx.getContext('2d');
  document.body.appendChild(cv);
  document.body.appendChild(fx);

  const buf = document.createElement('canvas');
  const bctx = buf.getContext('2d');

  let W = 1024, H = 700, k = 1, DPR = 1, LOW = false;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, LOW ? 1 : 1.6);
    W = Math.max(320, window.innerWidth || document.documentElement.clientWidth || 1024);
    H = Math.max(240, window.innerHeight || document.documentElement.clientHeight || 700);
    cv.width = fx.width = W * dpr;
    cv.height = fx.height = H * dpr;
    uc.setTransform(dpr, 0, 0, dpr, 0, 0);
    fc.setTransform(dpr, 0, 0, dpr, 0, 0);
    DPR = dpr;
    k = Math.max(0.62, Math.min(1.05, W / 1280)) * (250 * CFG.scale) / IW;
  }
  resize();
  addEventListener('resize', resize);

  let dark = true;
  function readTheme() { dark = document.documentElement.getAttribute('data-theme') !== 'light'; }
  readTheme();
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function checkActiveInput() {
    const el = document.activeElement;
    if (!el) { CFG.typingFocus = false; return; }
    const tag = (el.tagName || '').toLowerCase();
    CFG.typingFocus = tag === 'textarea' || (tag === 'input' && el.type !== 'range' && el.type !== 'button' && el.id !== 'customWishInput') || el.isContentEditable;
  }
  addEventListener('focusin', checkActiveInput, { passive: true });
  addEventListener('focusout', checkActiveInput, { passive: true });

  /* ---- Môi trường: lá sen, cánh hoa, gợn sóng, hạt, mồi ---- */
  let lotusPads = [], blossomPetals = [], waterRipples = [], motes = [], shockwaves = [], foodPellets = [], floatingTexts = [];
  function initLotus() {
    lotusPads = [
      { x: W * 0.14, y: H * 0.24, r: 34, rot: 0.4, vx: 0, vy: 0, hasFlower: true },
      { x: W * 0.86, y: H * 0.28, r: 28, rot: 2.1, vx: 0, vy: 0, hasFlower: false },
      { x: W * 0.18, y: H * 0.78, r: 30, rot: -1.1, vx: 0, vy: 0, hasFlower: false },
      { x: W * 0.84, y: H * 0.74, r: 36, rot: 1.2, vx: 0, vy: 0, hasFlower: true }
    ];
    blossomPetals = [];
    for (let i = 0; i < 14; i++) blossomPetals.push({
      x: Math.random() * W, y: Math.random() * H, r: 3.5 + Math.random() * 3.5,
      rot: Math.random() * 6.28, vx: (Math.random() - 0.5) * 0.3, vy: 0.2 + Math.random() * 0.35, gold: i % 2 === 0
    });
  }
  initLotus();

  const M = { x: W * 0.52, y: H * 0.52, t: -1e9 };
  const pearl = { x: W * 0.5, y: H * 0.5, glow: 0.85 };
  const Hd = { x: M.x, y: M.y, a: Math.PI, s: 2.5, w: 0 };
  let lastH = { x: Hd.x, y: Hd.y };
  const path = [];
  for (let i = 0; i < 56; i++) path.push({ x: M.x + i * 8, y: M.y });
  let MV = { x: 0, y: 0 }, evGap = 16;
  let pulseProg = 0, curAlpha = 1, phase = 0, sp = 0, roll = 0, prevHead = Math.PI;
  let T = 0, last = performance.now(), rippleTimer = 0;
  let aiModeText = 'Tuần du';
  let mouthGulp = 0, blinkT = 2.5, nextBlink = 3 + Math.random() * 3, eyeLookX = 0, eyeLookY = 0;

  function wrap(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function triggerScholarPulse(px, py) {
    pulseProg = 1;
    const cx = px !== undefined ? px : Hd.x, cy2 = py !== undefined ? py : Hd.y;
    shockwaves.push({ x: cx, y: cy2, r: 8, maxR: 128, life: 1, rot: Math.random() * Math.PI * 2 });
    const n = LOW ? 8 : 18;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.2, spd = 1.1 + Math.random() * 2.5;
      motes.push({
        x: cx, y: cy2, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        life: 1, decay: 0.012 + Math.random() * 0.009, r: 1.3 + Math.random() * 1.6,
        seed: Math.random() * 6.28, star: true, gold: i % 2 === 0,
        glyph: CFG.showGlyphs && i % 3 === 0 ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : null
      });
    }
  }
  CFG.triggerPulse = triggerScholarPulse;

  function announceWish(msg) {
    if (msg) CFG.customWish = msg;
    pearl.glow = 1;
    triggerScholarPulse(Hd.x, Hd.y);
    const ev = getEvent(CFG.eventMode);
    floatingTexts.push({ x: Hd.x, y: Hd.y - 28, text: msg || ev.stamp, life: 1.25, gold: true });
  }
  CFG.announceWish = announceWish;

  function spawnKnowledgeFood(fx0, fy0) {
    const x = fx0 !== undefined ? fx0 : W * 0.25 + Math.random() * W * 0.5;
    const y = fy0 !== undefined ? fy0 : H * 0.25 + Math.random() * H * 0.5;
    for (let n = 0; n < 3; n++) {
      foodPellets.push({
        x: x + (Math.random() - 0.5) * 70, y: y + (Math.random() - 0.5) * 70, r: 6.5,
        glyph: GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        formula: FORMULAS[Math.floor(Math.random() * FORMULAS.length)],
        pulse: Math.random() * 6.28
      });
    }
    waterRipples.push({ x, y, r: 6, maxR: 85, life: 0.85 });
  }
  CFG.spawnKnowledgeFood = spawnKnowledgeFood;

  function ascendDragon() {
    CFG.vuMonEnergy = 100;
    CFG.dragonAscended = true;
    buildSprite();
    triggerScholarPulse(Hd.x, Hd.y);
    floatingTexts.push({ x: Hd.x, y: Hd.y - 25, text: 'VƯỢT VŨ MÔN — HÓA KIM LONG TRẠNG NGUYÊN!', life: 1.2, gold: true });
  }
  CFG.ascendDragon = ascendDragon;

  CFG.rebuildSkin = skin => { if (skin) CFG.skin = skin; CFG.dragonAscended = false; buildSprite(); };
  CFG.setBreed = b => { CFG.breed = b; buildSprite(); };
  CFG.setEventMode = ev => { CFG.eventMode = ev; buildSprite(); pearl.glow = 1; };

  function aim(e) {
    if (Math.abs(e.clientX - M.x) < 3 && Math.abs(e.clientY - M.y) < 3) return;
    const now = performance.now(), dt = now - M.t;
    if (dt > 0 && dt < 200) {
      const ix = (e.clientX - M.x) / (dt / 16.67), iy = (e.clientY - M.y) / (dt / 16.67);
      const wv = Math.min(0.6, 0.35 * dt / 16.67);
      MV.x += (ix - MV.x) * wv; MV.y += (iy - MV.y) * wv;
      evGap = evGap * 0.8 + dt * 0.2;
    } else { MV.x = 0; MV.y = 0; }
    M.x = e.clientX; M.y = e.clientY; M.t = now;
  }
  addEventListener('pointermove', aim, { passive: true });
  addEventListener('pointerdown', e => { aim(e); triggerScholarPulse(e.clientX, e.clientY); }, { passive: true });
  addEventListener('dblclick', e => spawnKnowledgeFood(e.clientX, e.clientY), { passive: true });

  /* ---- 4 râu cảm biến Verlet (2 ngắn trên, 2 dài dưới) ---- */
  const barbels = [
    { sd: -1, uA: 0.062, vOff: 0.03, segs: 14, segLen: 4.6, w: 1.0, p: [] },
    { sd: 1, uA: 0.062, vOff: 0.03, segs: 14, segLen: 4.6, w: 1.0, p: [] },
    { sd: -1, uA: 0.078, vOff: 0.055, segs: 19, segLen: 5.4, w: 1.3, p: [] },
    { sd: 1, uA: 0.078, vOff: 0.055, segs: 19, segLen: 5.4, w: 1.3, p: [] }
  ];
  barbels.forEach(rb => { for (let q = 0; q < rb.segs; q++) rb.p.push({ x: M.x + q * 3, y: M.y }); });

  const spX = new Float32Array(GX + 1), spY = new Float32Array(GX + 1), spA = new Float32Array(GX + 1);

  function pathAt(s) {
    for (let j = 1; j < path.length; j++) {
      const p0 = path[j - 1], p1 = path[j], L = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      if (s <= L) { const t = L ? s / L : 0; return [p0.x + (p1.x - p0.x) * t, p0.y + (p1.y - p0.y) * t]; }
      s -= L;
    }
    const e = path[path.length - 1], f2 = path[path.length - 2] || { x: e.x - 1, y: e.y };
    const dl = Math.hypot(e.x - f2.x, e.y - f2.y) || 1;
    return [e.x + (e.x - f2.x) / dl * s, e.y + (e.y - f2.y) / dl * s];
  }

  function emitMote(x, y, big, gold) {
    if (motes.length > (LOW ? 120 : 320)) motes.shift();
    const useGlyph = CFG.showGlyphs && big && Math.random() < 0.24;
    motes.push({
      x, y, vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28 - (useGlyph ? 0.15 : 0),
      life: 1, decay: useGlyph ? 0.005 : 0.0055 + Math.random() * 0.006,
      r: (big ? 1.05 : 0.45) + Math.random() * (big ? 1.25 : 0.7),
      seed: Math.random() * 6.28, star: big && !useGlyph && Math.random() < 0.55,
      gold: gold || CFG.dragonAscended || CFG.skin === 'kintsugi',
      glyph: useGlyph ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)] : null
    });
  }

  function step(now) {
    const f = Math.min((now - last) / 16.67, 3);
    last = now; T = now / 1000;
    k = Math.max(0.62, Math.min(1.05, W / 1280)) * (250 * CFG.scale) / IW;
    if (pulseProg > 0) pulseProg = Math.max(0, pulseProg - 0.022 * f);

    const targetAlpha = CFG.paused ? 0 : (CFG.typingFocus ? 0.52 : 1);
    curAlpha += (targetAlpha - curAlpha) * 0.08 * f;
    if (curAlpha < 0.01 && CFG.paused) return;

    /* --- AI định vị mục tiêu --- */
    const idle = now - M.t, stopAfter = Math.max(25, Math.min(140, evGap * 1.8));
    let tx, ty, cap, cruise, chase = false, hunting = false;

    if (!CFG.typingFocus && foodPellets.length > 0) {
      let ni = 0, md = 1e9;
      for (let i = 0; i < foodPellets.length; i++) {
        const d = Math.hypot(foodPellets[i].x - Hd.x, foodPellets[i].y - Hd.y);
        if (d < md) { md = d; ni = i; }
      }
      const tp = foodPellets[ni];
      tx = tp.x; ty = tp.y; cap = 7.2; cruise = 4.2; hunting = true;
      aiModeText = 'Thưởng Thức Hạt Tri Thức (' + tp.glyph + ')';
      if (md < 26) {
        waterRipples.push({ x: tp.x, y: tp.y, r: 5, maxR: 75, life: 0.9 });
        floatingTexts.push({ x: tp.x, y: tp.y - 12, text: '+25 Linh Khí • ' + tp.formula, life: 1, gold: false });
        foodPellets.splice(ni, 1);
        mouthGulp = 1;
        CFG.vuMonEnergy = Math.min(100, CFG.vuMonEnergy + 25);
        if (CFG.vuMonEnergy >= 100 && !CFG.dragonAscended) ascendDragon(); else pulseProg = 0.75;
      }
    } else if (CFG.typingFocus) {
      aiModeText = 'Tĩnh Tâm (Nhường khung soạn thảo)';
      const eR = Math.min(W, H) * 0.36, eA = T * 0.45 * CFG.spinDir;
      tx = W * 0.5 + Math.cos(eA) * eR * 1.25;
      ty = H * 0.5 + Math.sin(eA) * eR * 0.75;
      cap = 2; cruise = 1.8;
      pearl.glow += (0 - pearl.glow) * 0.08 * f;
    } else if (idle < stopAfter) {
      aiModeText = CFG.dragonAscended ? 'Kim Long Du Vân (Bám con trỏ)' : 'Dẫn Lộ (Bám sát con trỏ)';
      const ext = Math.min(idle, stopAfter) / 16.67;
      tx = M.x + MV.x * ext; ty = M.y + MV.y * ext;
      cap = 165; cruise = 2.6;
      pearl.glow += (0.25 - pearl.glow) * 0.08 * f;
      pearl.x = M.x; pearl.y = M.y;
    } else if (idle < 2000) {
      aiModeText = 'Tuần Vũ Môn (Lượn vòng quanh trỏ)';
      const R = 96 * Math.max(0.65, Math.min(1, W / 1300));
      const th = Math.atan2(Hd.y - M.y, Hd.x - M.x) + 0.72 * CFG.spinDir;
      tx = M.x + Math.cos(th) * R; ty = M.y + Math.sin(th) * R;
      const dm = Math.hypot(Hd.x - M.x, Hd.y - M.y);
      chase = dm > R * 1.45;
      cap = chase ? Math.min(46, 2.6 + (dm - R) * 0.09) : 2.7;
      cruise = 2.4;
      pearl.glow += (0.85 - pearl.glow) * 0.06 * f;
      pearl.x += (M.x - pearl.x) * 0.12 * f;
      pearl.y += (M.y - pearl.y) * 0.12 * f;
    } else {
      const ev = getEvent(CFG.eventMode);
      aiModeText = 'Chầu ' + ev.stamp + ' (∞)';
      pearl.glow += (1 - pearl.glow) * 0.05 * f;
      const tpx = Math.max(200, Math.min(W - 200, M.x + Math.sin(T * 0.32) * 80));
      const tpy = Math.max(160, Math.min(H - 160, M.y + Math.cos(T * 0.26) * 55));
      pearl.x += (tpx - pearl.x) * 0.025 * f;
      pearl.y += (tpy - pearl.y) * 0.025 * f;
      const rx = Math.min(205, W * 0.22), ry = Math.min(120, H * 0.17);
      const om = T * 1.08 * CFG.spinDir;
      tx = pearl.x + Math.sin(om) * rx; ty = pearl.y + Math.sin(om * 2) * ry;
      cap = 3.3; cruise = 2.9;
    }

    /* --- Lái mượt: gia tốc góc hạn chế + tốc độ êm --- */
    const ddx = tx - Hd.x, ddy = ty - Hd.y, dist = Math.hypot(ddx, ddy);
    const active = !CFG.typingFocus && !hunting && idle < stopAfter;
    let da;
    if (active) {
      const kp = 0.17 + Math.min(0.15, Math.max(0, dist - 140) / 2400);
      const vdx = MV.x + ddx * kp, vdy = MV.y + ddy * kp, vd = Math.hypot(vdx, vdy);
      da = vd > 0.05 ? wrap(Math.atan2(vdy, vdx) - Hd.a) : 0;
    } else {
      da = wrap(Math.atan2(ddy, ddx) - Hd.a);
    }
    const Rmin = 0.2 * IW * k, wmax = Math.min(0.44, Math.max(Hd.s, 2.2) / Rmin);
    const wDes = Math.max(-wmax, Math.min(wmax, da * 0.5));
    Hd.w += (wDes - Hd.w) * (1 - Math.pow(0.5, f));
    Hd.a = wrap(Hd.a + Hd.w * f);

    let sDes;
    if (active) {
      const vd2 = Math.hypot(MV.x + ddx * 0.2, MV.y + ddy * 0.2);
      sDes = Math.max(0.4, Math.min(cap, vd2 * Math.max(0.15, Math.cos(da))));
    } else {
      const align = Math.max(0, Math.cos(da));
      sDes = Math.max(cruise * (0.65 + 0.35 * align), Math.min(cap, dist * 0.24 * align));
    }
    if (pulseProg > 0.3) sDes = Math.max(sDes, 5.2);
    const rate = sDes > Hd.s ? 0.34 : (active ? 0.2 : (chase || hunting ? 0.14 : 0.065));
    const dS = (sDes - Hd.s) * (1 - Math.pow(1 - rate, f));
    Hd.s += sDes > Hd.s ? Math.min(dS, (3.4 + Math.max(0, dist - 120) * 0.045) * f) : dS;
    Hd.x += Math.cos(Hd.a) * Hd.s * f;
    Hd.y += Math.sin(Hd.a) * Hd.s * f;

    /* --- Lá sen đẩy nhẹ khi cá bơi qua --- */
    if (CFG.showLotus) lotusPads.forEach(lp => {
      const lx = lp.x - Hd.x, ly = lp.y - Hd.y, ld = Math.hypot(lx, ly) || 1, minSep = lp.r + 52;
      if (ld < minSep) { const push = (minSep - ld) * 0.035 * f; lp.vx += (lx / ld) * push; lp.vy += (ly / ld) * push; }
      lp.x += lp.vx * f; lp.y += lp.vy * f;
      lp.vx *= Math.pow(0.92, f); lp.vy *= Math.pow(0.92, f);
      lp.rot += 0.002 * f;
      if (lp.x < 50) lp.vx += 0.1; if (lp.x > W - 50) lp.vx -= 0.1;
      if (lp.y < 50) lp.vy += 0.1; if (lp.y > H - 50) lp.vy -= 0.1;
    });

    blossomPetals.forEach(bp => {
      bp.x += (bp.vx + Math.sin(T * 1.4 + bp.rot) * 0.25) * f;
      bp.y += bp.vy * f; bp.rot += 0.015 * f;
      if (bp.y > H + 20) { bp.y = -15; bp.x = Math.random() * W; }
      if (bp.x < -20) bp.x = W + 15; if (bp.x > W + 20) bp.x = -15;
    });

    const mvd = Math.hypot(Hd.x - lastH.x, Hd.y - lastH.y);
    sp += (mvd / f - sp) * 0.2;
    lastH.x = Hd.x; lastH.y = Hd.y;

    if (path.length < 2 || Math.hypot(Hd.x - path[1].x, Hd.y - path[1].y) > 2) path.unshift({ x: Hd.x, y: Hd.y });
    path[0].x = Hd.x; path[0].y = Hd.y;
    const Lb = IW * k, total0 = 0;
    for (let j = 1; j < path.length; j++) {
      let acc = 0;
      for (let q = 1; q <= j; q++) acc += Math.hypot(path[q].x - path[q - 1].x, path[q].y - path[q - 1].y);
      if (acc > Lb * 1.65) { path.length = j + 1; break; }
    }

    /* --- Xương sống cong mềm theo đường đi --- */
    const seg = Lb / GX, n0 = Math.round(NOSE_U * GX), maxBend = 0.088;
    const raw = [];
    for (let j = n0; j <= GX; j++) raw.push(pathAt((j - n0) * seg));
    const head = Hd.a;
    spX[n0] = Hd.x; spY[n0] = Hd.y; spA[n0] = head;
    for (let j = n0 + 1; j <= GX; j++) {
      const r = raw[j - n0];
      const want = Math.atan2(spY[j - 1] - r[1], spX[j - 1] - r[0]);
      const aj = spA[j - 1] + Math.max(-maxBend, Math.min(maxBend, wrap(want - spA[j - 1])));
      spA[j] = aj;
      spX[j] = spX[j - 1] - Math.cos(aj) * seg;
      spY[j] = spY[j - 1] - Math.sin(aj) * seg;
    }
    for (let pass = 0; pass < 4; pass++) {
      for (let j = n0 + 1; j < GX; j++) spA[j] += wrap((spA[j - 1] + spA[j + 1]) / 2 - spA[j]) * 0.5;
      spA[GX] = spA[GX - 1] + wrap(spA[GX] - spA[GX - 1]) * 0.8;
    }
    for (let j = n0 + 1; j <= GX; j++) {
      const st = Math.max(0, Math.min(1, (j / GX - 0.6) / 0.4));
      const sg = seg * (1 + 0.45 * st * st * (3 - 2 * st));
      spX[j] = spX[j - 1] - Math.cos(spA[j]) * sg;
      spY[j] = spY[j - 1] - Math.sin(spA[j]) * sg;
    }
    for (let j = n0 - 1; j >= 0; j--) {
      spA[j] = head;
      spX[j] = spX[j + 1] + Math.cos(head) * seg;
      spY[j] = spY[j + 1] + Math.sin(head) * seg;
    }

    const turn = wrap(head - prevHead) / f;
    prevHead = head;
    roll += (Math.max(-1, Math.min(1, turn * 9)) - roll) * Math.min(1, 0.12 * f);
    phase += (0.055 + Math.min(sp, 24) * 0.011) * f;
    const squash = 1 - 0.22 * Math.abs(roll);
    const gillBreath = 0.04 * Math.sin(T * 3.4);

    /* --- Lưới mesh: sóng hành trình + thở mang + vây ngực + đuôi lụa --- */
    for (let j = 0; j <= GX; j++) {
      const u = j / GX, ca = Math.cos(spA[j]), sa = Math.sin(spA[j]);
      const nx = Math.sin(spA[j]), ny = -Math.cos(spA[j]);
      const lat = (2.3 + Math.min(sp, 22) * 0.24) * CFG.waveAmp * (0.06 + 0.94 * Math.pow(u, 2.2)) * Math.sin(phase - u * 4.4);
      const pecZone = Math.max(0, 1 - Math.abs(u - 0.21) / 0.09);
      const gillZone = Math.max(0, 1 - Math.abs(u - 0.185) / 0.035);
      for (let yy = 0; yy <= GY; yy++) {
        const v = yy / GY, off0 = (v - AXIS_V) * IH * k, side = Math.abs(v - AXIS_V);
        const pecFactor = pecZone * Math.max(0, (side - 0.08) / 0.42);
        const sideSign = v < AXIS_V ? -1 : 1;
        let off = off0 * squash * (1 + gillZone * gillBreath + 0.24 * CFG.waveAmp * pecFactor * Math.sin(phase * 0.9 + sideSign * 0.6 - side * 2.2));
        const tailSilk = Math.max(0, (u - 0.68) / 0.32) * Math.min(1, side / 0.14);
        const wob = tailSilk * 3.4 * CFG.waveAmp * Math.sin(T * 2.4 - u * 11 + v * 6);
        const sweep = pecFactor * 4.2 * Math.cos(phase * 0.9);
        const o = (yy * (GX + 1) + j) * 2;
        xy[o] = spX[j] + nx * (off + lat + wob) - ca * sweep;
        xy[o + 1] = spY[j] + ny * (off + lat + wob) - sa * sweep;
      }
    }

    /* --- Râu Verlet: sóng truyền dọc, đầu râu có nút cảm giác --- */
    barbels.forEach(rb => {
      const p = rb.p, wj = Math.round(rb.uA * GX);
      const wl = rb.segL * k * (CFG.dragonAscended ? 1.45 : 1);
      const a0 = spA[wj], sideOff = rb.vOff * IH * k * rb.sd;
      const ax = spX[wj] + Math.sin(a0) * sideOff, ay = spY[wj] - Math.cos(a0) * sideOff;
      p[0].x = ax; p[0].y = ay;
      let rx = ax, ry = ay;
      for (let q = 1; q < p.length; q++) {
        const pt = p[q], pr = p[q - 1];
        const t = q / p.length;
        const spread = 1.2 - 0.85 * Math.min(1, q / 10);
        const wave = 0.18 * Math.sin(T * 2.3 - q * 0.4 + rb.sd) + 0.08 * Math.sin(T * 4.1 + q * 0.2);
        const ra = a0 + Math.PI + rb.sd * (spread + wave);
        rx += Math.cos(ra) * wl; ry += Math.sin(ra) * wl;
        const pull = 1 - Math.pow(1 - 0.36 * Math.pow(1 - t, 0.5), f);
        pt.x += (rx - pt.x) * pull; pt.y += (ry - pt.y) * pull;
        const ex = pt.x - pr.x, ey = pt.y - pr.y, el = Math.hypot(ex, ey) || 1;
        pt.x = pr.x + ex / el * wl; pt.y = pr.y + ey / el * wl;
      }
    });

    /* --- Gợn sóng, hạt tinh quang, đồng tử/mắt/miệng --- */
    rippleTimer += f;
    if (rippleTimer > (sp > 2 ? 9 : 22)) {
      rippleTimer = 0;
      const rIdx = Math.round(0.28 * GX);
      if (waterRipples.length < (LOW ? 6 : 14)) {
        waterRipples.push({ x: spX[rIdx], y: spY[rIdx], r: 8 * k * IW / 245, maxR: (55 + Math.min(35, sp * 4)) * k * IW / 245, life: 0.65 });
      }
    }
    for (let i = waterRipples.length - 1; i >= 0; i--) {
      const wr = waterRipples[i];
      wr.r += (wr.maxR - wr.r) * 0.045 * f; wr.life -= 0.012 * f;
      if (wr.life <= 0) waterRipples.splice(i, 1);
    }
    const cnt = (0.55 + Math.min(7, sp * 0.38)) * (LOW ? 0.4 : 1);
    for (let e = 0; e < cnt * f; e++) {
      const ju = Math.min(GX, Math.round((0.18 + Math.pow(Math.random(), 0.65) * 0.78) * GX));
      const vv = (Math.random() - 0.5) * 0.52 * IH * k;
      emitMote(spX[ju] + Math.sin(spA[ju]) * vv, spY[ju] - Math.cos(spA[ju]) * vv, Math.random() < 0.25, Math.random() < 0.4);
    }
    for (let i = motes.length - 1; i >= 0; i--) {
      const m = motes[i];
      m.x += m.vx * f; m.y += m.vy * f;
      m.vx *= Math.pow(0.984, f); m.vy *= Math.pow(0.984, f);
      m.life -= m.decay * f;
      if (m.life <= 0) motes.splice(i, 1);
    }
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.r += (sw.maxR - sw.r) * 0.085 * f; sw.rot += 0.02 * f; sw.life -= 0.02 * f;
      if (sw.life <= 0) shockwaves.splice(i, 1);
    }
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 0.62 * f; ft.life -= 0.012 * f;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }

    /* mắt: đếm nhịp chớp + liếc theo mồi/con trỏ */
    nextBlink -= f / 60;
    if (nextBlink <= 0) { blinkT = 0.16; nextBlink = 2.8 + Math.random() * 3.4; }
    if (blinkT > 0) blinkT -= f / 60;
    let lookTX = M.x, lookTY = M.y;
    if (foodPellets.length) {
      let ni = 0, md = 1e9;
      foodPellets.forEach((p2, i2) => { const d = Math.hypot(p2.x - Hd.x, p2.y - Hd.y); if (d < md) { md = d; ni = i2; } });
      lookTX = foodPellets[ni].x; lookTY = foodPellets[ni].y;
    }
    const localLook = wrap(Math.atan2(lookTY - Hd.y, lookTX - Hd.x) - Hd.a);
    eyeLookX += (Math.max(-1, Math.min(1, Math.cos(localLook) * 0.9)) - eyeLookX) * 0.12 * f;
    eyeLookY += (Math.max(-1, Math.min(1, Math.sin(localLook) * 0.9)) - eyeLookY) * 0.12 * f;
    if (mouthGulp > 0) mouthGulp = Math.max(0, mouthGulp - 0.05 * f);
  }

  /* ============================================================
     PHẦN 3 — RENDER
     ============================================================ */
  function drawMesh(target) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < xy.length; i += 2) {
      if (xy[i] < x0) x0 = xy[i]; if (xy[i] > x1) x1 = xy[i];
      if (xy[i + 1] < y0) y0 = xy[i + 1]; if (xy[i + 1] > y1) y1 = xy[i + 1];
    }
    x0 = Math.floor(x0 - 4); y0 = Math.floor(y0 - 4);
    const bw = Math.max(1, Math.ceil((x1 + 4 - x0) * DPR)), bh = Math.max(1, Math.ceil((y1 + 4 - y0) * DPR));
    if (buf.width < bw || buf.height < bh) { buf.width = Math.max(buf.width, bw); buf.height = Math.max(buf.height, bh); }
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, buf.width, buf.height);
    const step2 = LOW ? 3 : 2, lastRow = GY * (GX + 1) * 2;

    function tri(u0, v0, u1, v1, u2, v2, x0p, y0p, x1p, y1p, x2p, y2p) {
      const d = u0 * (v1 - v2) + u1 * (v2 - v0) + u2 * (v0 - v1);
      if (!d) return;
      const a = (x0p * (v1 - v2) + x1p * (v2 - v0) + x2p * (v0 - v1)) / d;
      const c = (x0p * (u2 - u1) + x1p * (u0 - u2) + x2p * (u1 - u0)) / d;
      const e = (x0p * (u1 * v2 - u2 * v1) + x1p * (u2 * v0 - u0 * v2) + x2p * (u0 * v1 - u1 * v0)) / d;
      const b2 = (y0p * (v1 - v2) + y1p * (v2 - v0) + y2p * (v0 - v1)) / d;
      const d2 = (y0p * (u2 - u1) + y1p * (u0 - u2) + y2p * (u1 - u0)) / d;
      const f2 = (y0p * (u1 * v2 - u2 * v1) + y1p * (u2 * v0 - u0 * v2) + y2p * (u0 * v1 - u1 * v0)) / d;
      bctx.save();
      bctx.setTransform(1, 0, 0, 1, 0, 0);
      bctx.beginPath();
      bctx.moveTo(x0p, y0p); bctx.lineTo(x1p, y1p); bctx.lineTo(x2p, y2p);
      bctx.closePath(); bctx.clip();
      bctx.setTransform(a, b2, c, d2, e, f2);
      bctx.drawImage(spriteCv, 0, 0);
      bctx.restore();
    }
    for (let j = 0; j < GX; j += step2) {
      const j1 = Math.min(GX, j + step2), t0 = j * 2, t1 = j1 * 2, b0 = lastRow + j * 2, b1 = lastRow + j1 * 2;
      const su0 = j * IW / GX, su1 = j1 * IW / GX;
      const X = o => (xy[o] - x0) * DPR, Y = o => (xy[o + 1] - y0) * DPR;
      tri(su0, 0, su1, 0, su0, IH, X(t0), Y(t0), X(t1), Y(t1), X(b0), Y(b0));
      tri(su1, 0, su1, IH, su0, IH, X(t1), Y(t1), X(b1), Y(b1), X(b0), Y(b0));
    }
    target.save();
    target.setTransform(1, 0, 0, 1, 0, 0);
    target.globalAlpha = curAlpha;
    target.drawImage(buf, 0, 0, bw, bh, Math.round(x0 * DPR), Math.round(y0 * DPR), bw, bh);
    target.restore();
  }

  /* Đặc trưng ngày lễ ở tâm */
  function drawCenterpiece(pal) {
    if (pearl.glow <= 0.02) return;
    const ev = getEvent(CFG.eventMode);
    const pr = (16 + 2.2 * Math.sin(T * 2.6)) * pearl.glow;
    const alpha = pearl.glow * (dark ? 0.88 : 0.78) * curAlpha;
    fc.save();
    fc.translate(pearl.x, pearl.y);
    fc.globalAlpha = alpha;
    if (ev.centerType === 'drum') {
      const drumR = pr * 2.4;
      const dg = fc.createRadialGradient(0, 0, 2, 0, 0, drumR * 1.25);
      dg.addColorStop(0, 'rgba(253,224,71,0.48)'); dg.addColorStop(0.55, 'rgba(220,38,38,0.24)'); dg.addColorStop(1, 'rgba(0,0,0,0)');
      fc.fillStyle = dg; fc.beginPath(); fc.arc(0, 0, drumR * 1.25, 0, Math.PI * 2); fc.fill();
      fc.save(); fc.rotate(T * 0.32);
      fc.strokeStyle = dark ? '#fde047' : '#b45309'; fc.lineWidth = 1.2;
      [0.48, 0.78, 1].forEach(r => { fc.beginPath(); fc.arc(0, 0, drumR * r, 0, Math.PI * 2); fc.stroke(); });
      for (let i = 0; i < 14; i++) {
        const ra = (i / 14) * Math.PI * 2;
        fc.beginPath(); fc.moveTo(0, 0); fc.lineTo(Math.cos(ra) * drumR * 0.45, Math.sin(ra) * drumR * 0.45); fc.stroke();
      }
      for (let b = 0; b < 4; b++) {
        fc.save(); fc.rotate(b * Math.PI / 2 + 0.4);
        fc.beginPath(); fc.moveTo(drumR * 0.62, -5); fc.lineTo(drumR * 0.66, 0); fc.lineTo(drumR * 0.62, 5); fc.stroke();
        fc.restore();
      }
      fc.restore();
    } else if (ev.centerType === 'midautumn') {
      const moonR = pr * 2.2;
      const mg = fc.createRadialGradient(0, 0, moonR * 0.1, 0, 0, moonR * 1.5);
      mg.addColorStop(0, '#fef9c3'); mg.addColorStop(0.55, 'rgba(253,224,71,0.55)'); mg.addColorStop(1, 'rgba(253,224,71,0)');
      fc.fillStyle = mg; fc.beginPath();
      for (let ma = 0; ma <= Math.PI * 2; ma += 0.12) {
        const mr = moonR + Math.sin(ma * 6 + T * 4) * 1.8, mx = Math.cos(ma) * mr, my = Math.sin(ma) * mr;
        if (ma === 0) fc.moveTo(mx, my); else fc.lineTo(mx, my);
      }
      fc.closePath(); fc.fill();
    } else if (ev.centerType === 'tet') {
      const s = pr * 1.7;
      fc.fillStyle = 'rgba(220,38,38,0.85)'; fc.strokeStyle = '#fde047'; fc.lineWidth = 1.6;
      fc.beginPath(); fc.roundRect(-s * 0.5, -s * 0.5, s, s, 6); fc.fill(); fc.stroke();
      fc.fillStyle = '#fef08a'; fc.font = 'bold 14px "Playfair Display", serif';
      fc.textAlign = 'center'; fc.textBaseline = 'middle'; fc.fillText('PHÚC', 0, 1);
    } else if (ev.centerType === 'lantern' || ev.centerType === 'camellia' || ev.centerType === 'lotus' || CFG.eventMode === 'birthday') {
      const bg = fc.createRadialGradient(0, 0, 2, 0, 0, pr * 2.6);
      bg.addColorStop(0, '#fff1f2'); bg.addColorStop(0.4, '#f43f5e'); bg.addColorStop(1, 'rgba(244,63,94,0)');
      fc.fillStyle = bg; fc.beginPath(); fc.arc(0, 0, pr * 2.6, 0, Math.PI * 2); fc.fill();
      fc.save(); fc.rotate(T * 0.5);
      for (let i = 0; i < 8; i++) {
        fc.rotate(Math.PI / 4);
        fc.fillStyle = i % 2 === 0 ? '#fda4af' : '#fde047';
        fc.beginPath(); fc.ellipse(pr * 0.65, 0, pr * 0.55, pr * 0.22, 0, 0, Math.PI * 2); fc.fill();
      }
      fc.restore();
      fc.fillStyle = '#ffffff'; fc.beginPath(); fc.arc(0, 0, pr * 0.28, 0, Math.PI * 2); fc.fill();
    } else {
      const pg = fc.createRadialGradient(0, 0, 2, 0, 0, pr * 2.5);
      pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.35, pal.headGlow); pg.addColorStop(1, 'rgba(0,0,0,0)');
      fc.fillStyle = pg; fc.beginPath(); fc.arc(0, 0, pr * 2.5, 0, Math.PI * 2); fc.fill();
      fc.save(); fc.rotate(T * 0.55); fc.strokeStyle = pal.horn; fc.lineWidth = 1.3;
      for (let sq = 0; sq < 2; sq++) { fc.rotate(Math.PI / 4); fc.strokeRect(-pr * 0.9, -pr * 0.9, pr * 1.8, pr * 1.8); }
      fc.restore();
    }
    fc.restore();
  }

  /* Đặc trưng động trên đầu: nắp mang thở, mắt chớp, miệng ngậm nhịp */
  function drawHeadFeatures(pal) {
    const n0 = Math.round(NOSE_U * GX);
    const a = spA[n0];
    fc.save();
    fc.translate(spX[n0], spY[n0]);
    fc.rotate(a);
    fc.scale(k);
    /* hệ local: +x về phía trước; sprite +x ngược lại nên đảo dấu */
    const L = (u, v) => [-(u - NOSE_U) * IW, -(v - AXIS_V) * IH];
    fc.globalAlpha = curAlpha;
    const breath = 1 + 0.045 * Math.sin(T * 3.4);

    /* nắp mang thở */
    const [gx, gy] = L(0.158, 0.5);
    fc.save();
    fc.translate(gx, gy);
    fc.scale(breath, breath);
    fc.strokeStyle = pal.ink;
    [42, 50, 58].forEach((rad, i) => {
      fc.globalAlpha = curAlpha * (0.5 - i * 0.1);
      fc.lineWidth = 2 - i * 0.4;
      fc.beginPath(); fc.arc(0, 0, rad, -1.15, 1.15); fc.stroke();
    });
    fc.restore();
    fc.globalAlpha = curAlpha;

    /* miệng ngậm nhịp + đớp mồi */
    const [mx, my] = L(0.075, 0.5);
    const open = (0.35 + 0.3 * Math.sin(T * 3.2)) * 0.6 + mouthGulp * 4;
    fc.strokeStyle = pal.ink; fc.lineWidth = 2.2; fc.lineCap = 'round';
    fc.beginPath();
    fc.moveTo(mx - 16, my - 2);
    fc.quadraticCurveTo(mx + 4, my + 2 + open, mx + 26, my - 1);
    fc.stroke();
    fc.strokeStyle = pal.inkSoft; fc.lineWidth = 1.2;
    fc.beginPath();
    fc.moveTo(mx - 12, my + 3);
    fc.quadraticCurveTo(mx + 4, my + 7 + open, mx + 24, my + 4);
    fc.stroke();

    /* 2 mắt: tròng vàng, đồng tử liếc, điểm bắt sáng kép, mí chớp (khớp hốc mắt trong sprite: cy ± 27.5px) */
    [-1, 1].forEach(sd => {
      const [ex, ey] = L(0.118, 0.5 + sd * 0.0491);
      fc.save();
      fc.translate(ex, ey);
      fc.rotate(sd * 0.2);
      const blink = blinkT > 0 ? Math.max(0, Math.sin((0.16 - blinkT) / 0.16 * Math.PI)) : 0;
      /* lòng trắng mắt */
      fc.fillStyle = '#f8fafc';
      fc.beginPath(); fc.ellipse(0, 0, 8.2, 6, 0, 0, Math.PI * 2); fc.fill();
      fc.strokeStyle = pal.ink; fc.lineWidth = 1.4;
      fc.beginPath(); fc.ellipse(0, 0, 8.2, 6, 0, 0, Math.PI * 2); fc.stroke();
      if (blink < 0.95) {
        /* tròng mắt vàng + đồng tử */
        const px = eyeLookX * 1.8, py = eyeLookY * 1.3 + sd * 0.6;
        fc.strokeStyle = '#fbbf24'; fc.lineWidth = 1.8;
        fc.beginPath(); fc.ellipse(px, py, 5.4, 3.8, 0, 0, Math.PI * 2); fc.stroke();
        fc.fillStyle = '#020617';
        fc.beginPath(); fc.ellipse(px, py, 3.6, 2.6, 0, 0, Math.PI * 2); fc.fill();
        fc.fillStyle = '#ffffff';
        fc.beginPath(); fc.ellipse(px - 1.8, py - 1.2, 1.7, 1, -0.3, 0, Math.PI * 2); fc.fill();
        fc.fillStyle = 'rgba(255,255,255,0.7)';
        fc.beginPath(); fc.arc(px + 1.4, py + 1.1, 0.8, 0, Math.PI * 2); fc.fill();
      }
      /* mí mắt chớp: màu da cá phủ xuống */
      if (blink > 0) {
        fc.fillStyle = CFG.breed === 'gold' ? '#f59e0b' : '#f8fafc';
        fc.beginPath();
        fc.ellipse(0, 0, 8.4, 6.2 * blink, 0, -Math.PI / 2, Math.PI / 2);
        fc.fill();
        fc.strokeStyle = pal.inkSoft; fc.lineWidth = 1;
        fc.beginPath(); fc.moveTo(-8, 0); fc.lineTo(8, 0); fc.stroke();
      }
      fc.restore();
    });
    fc.restore();
  }

  /* Râu vẽ động: thon dần, nút cảm giác đầu râu, phát sáng khi hóa rồng */
  function drawBarbels(pal) {
    fc.save();
    fc.lineCap = 'round'; fc.lineJoin = 'round';
    barbels.forEach(rb => {
      const p = rb.p, n = p.length;
      for (let s = 0; s < 4; s++) {
        const q0 = Math.floor(s * (n - 1) / 4), q1 = Math.floor((s + 1) * (n - 1) / 4);
        const tq = 1 - (q0 + q1) / 2 / n;
        fc.strokeStyle = 'rgba(' + pal.ribbon + ',' + (0.85 * Math.pow(tq, 0.7) * curAlpha) + ')';
        fc.lineWidth = (2.6 * tq + 0.5) * rb.w * (CFG.dragonAscended ? 1.3 : 1);
        fc.beginPath();
        fc.moveTo(p[q0].x, p[q0].y);
        for (let q = q0 + 1; q <= q1; q++) fc.lineTo(p[q].x, p[q].y);
        fc.stroke();
      }
      /* nút cảm giác ở đầu râu */
      const tip = p[n - 1];
      fc.fillStyle = 'rgba(' + pal.ribbonSoft + ',' + (0.9 * curAlpha) + ')';
      fc.beginPath(); fc.arc(tip.x, tip.y, (CFG.dragonAscended ? 2.6 : 1.9) * rb.w, 0, Math.PI * 2); fc.fill();
      fc.fillStyle = 'rgba(255,255,255,' + (0.7 * curAlpha) + ')';
      fc.beginPath(); fc.arc(tip.x - 0.6, tip.y - 0.6, 0.8, 0, Math.PI * 2); fc.fill();
    });
    fc.restore();
  }

  let lastFrame = performance.now(), dtAvg = 16.7, nFrames = 0;
  function frame(now) {
    const dtTot = Math.min(now - lastFrame, 400);
    lastFrame = now; nFrames++;
    if (nFrames > 5) dtAvg += (dtTot - dtAvg) * 0.05;
    if (!LOW && nFrames > 90 && dtAvg > 33) { LOW = true; resize(); window.__astralDragonMode += '-low'; }

    const nSub = Math.max(1, Math.min(6, Math.ceil(dtTot / 25)));
    for (let s = 1; s <= nSub; s++) step(now - dtTot + dtTot * s / nSub);

    const curW = window.innerWidth || document.documentElement.clientWidth || 0;
    const curH = window.innerHeight || document.documentElement.clientHeight || 0;
    if (curW > 100 && curH > 100 && (Math.abs(curW - W) > 2 || Math.abs(curH - H) > 2)) resize();
    if (!Number.isFinite(Hd.x) || !Number.isFinite(Hd.y)) {
      Hd.x = W * 0.5; Hd.y = H * 0.5; Hd.a = Math.PI; Hd.s = 2.5; Hd.w = 0;
      path.forEach((p2, i) => { p2.x = Hd.x + i * 8; p2.y = Hd.y; });
    }

    const pal = CFG.dragonAscended ? PALETTES.imperialGold : (PALETTES[CFG.skin] || PALETTES.solar);
    window.__astralDragonMode = (LOW ? 'canvas2d-mesh-low' : 'canvas2d-mesh');
    window.__astralDragonState = aiModeText;

    uc.clearRect(0, 0, W, H);
    fc.clearRect(0, 0, W, H);
    if (curAlpha < 0.01 && CFG.paused) { window.__ffRaf = requestAnimationFrame(frame); return; }

    /* lá sen */
    if (CFG.showLotus) lotusPads.forEach(lp => {
      uc.save();
      uc.translate(lp.x, lp.y); uc.rotate(lp.rot);
      uc.globalAlpha = (dark ? 0.34 : 0.26) * curAlpha;
      uc.fillStyle = 'rgba(2,6,23,0.35)';
      uc.beginPath(); uc.arc(4, 6, lp.r, 0.18, Math.PI * 2 - 0.18); uc.lineTo(4, 6); uc.closePath(); uc.fill();
      const lg = uc.createRadialGradient(0, 0, 2, 0, 0, lp.r);
      lg.addColorStop(0, CFG.skin === 'sumi' ? '#64748b' : '#34d399');
      lg.addColorStop(0.7, CFG.skin === 'sumi' ? '#334155' : '#059669');
      lg.addColorStop(1, CFG.skin === 'sumi' ? '#0f172a' : '#064e3b');
      uc.fillStyle = lg;
      uc.beginPath(); uc.arc(0, 0, lp.r, 0.2, Math.PI * 2 - 0.2); uc.lineTo(0, 0); uc.closePath(); uc.fill();
      uc.strokeStyle = 'rgba(226,232,240,0.38)'; uc.lineWidth = 0.8;
      for (let v = 1; v < 9; v++) {
        const va = v * (Math.PI * 2 / 9);
        uc.beginPath(); uc.moveTo(0, 0); uc.lineTo(Math.cos(va) * lp.r * 0.88, Math.sin(va) * lp.r * 0.88); uc.stroke();
      }
      if (lp.hasFlower) {
        uc.globalAlpha = (dark ? 0.7 : 0.64) * curAlpha;
        for (let pet = 0; pet < 8; pet++) {
          uc.save(); uc.rotate(pet * Math.PI / 4 + T * 0.1);
          uc.fillStyle = CFG.skin === 'kintsugi' ? '#fef9c3' : (pet % 2 === 0 ? '#f472b6' : '#fbcfe8');
          uc.beginPath(); uc.ellipse(lp.r * 0.32, 0, lp.r * 0.32, lp.r * 0.13, 0, 0, Math.PI * 2); uc.fill();
          uc.restore();
        }
        uc.fillStyle = '#fde047';
        uc.beginPath(); uc.arc(0, 0, lp.r * 0.14, 0, Math.PI * 2); uc.fill();
      }
      uc.restore();
    });

    /* cánh hoa */
    if (CFG.eventMode !== 'normal') blossomPetals.forEach(bp => {
      uc.save(); uc.translate(bp.x, bp.y); uc.rotate(bp.rot); uc.globalAlpha = 0.48 * curAlpha;
      if (CFG.eventMode === 'tet') uc.fillStyle = bp.gold ? '#fde047' : '#fda4af';
      else uc.fillStyle = bp.gold ? '#fde047' : '#fbcfe8';
      uc.beginPath(); uc.ellipse(0, 0, bp.r, bp.r * 0.58, 0, 0, Math.PI * 2); uc.fill();
      uc.restore();
    });

    /* bóng đổ mềm dưới thân cá */
    const midJ = Math.round(GX * 0.45);
    fc.save();
    fc.globalAlpha = 0.22 * curAlpha;
    fc.fillStyle = dark ? '#020617' : '#334155';
    fc.beginPath();
    fc.ellipse(spX[midJ], spY[midJ] + 26 * k * (1 + Math.abs(roll) * 0.5), IW * 0.36 * k, 16 * k, 0, 0, Math.PI * 2);
    fc.fill();
    fc.restore();

    /* gợn sóng */
    waterRipples.forEach(wr => {
      uc.save();
      uc.strokeStyle = dark ? 'rgba(186,230,253,' + wr.life * 0.28 * curAlpha + ')' : 'rgba(30,64,175,' + wr.life * 0.2 * curAlpha + ')';
      uc.lineWidth = 1.25;
      uc.beginPath(); uc.arc(wr.x, wr.y, wr.r, 0, Math.PI * 2); uc.stroke();
      uc.restore();
    });

    /* thân cá mesh */
    drawMesh(uc);
    /* râu + chi tiết đầu động */
    drawBarbels(pal);
    drawHeadFeatures(pal);

    /* hạt tri thức */
    foodPellets.forEach(fp => {
      const sc = 1 + 0.18 * Math.sin(T * 5 + fp.pulse);
      fc.save(); fc.translate(fp.x, fp.y); fc.globalAlpha = 0.92 * curAlpha;
      const fg = fc.createRadialGradient(0, 0, 1, 0, 0, fp.r * 2.4 * sc);
      fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.4, '#fde047'); fg.addColorStop(1, 'rgba(245,158,11,0)');
      fc.fillStyle = fg; fc.beginPath(); fc.arc(0, 0, fp.r * 2.4 * sc, 0, Math.PI * 2); fc.fill();
      fc.fillStyle = '#0f172a'; fc.font = 'bold 10px "JetBrains Mono", monospace';
      fc.textAlign = 'center'; fc.textBaseline = 'middle';
      fc.fillText(fp.glyph, 0, 0);
      fc.restore();
    });

    drawCenterpiece(pal);

    /* pháp trận khi click */
    shockwaves.forEach(sw => {
      fc.save(); fc.translate(sw.x, sw.y); fc.rotate(sw.rot);
      const col = dark ? pal.moteGold : pal.moteDark;
      fc.strokeStyle = 'rgba(' + col + ',' + sw.life * 0.72 * curAlpha + ')';
      fc.lineWidth = 1.6 * sw.life;
      fc.beginPath(); fc.arc(0, 0, sw.r, 0, Math.PI * 2); fc.stroke();
      const rIn = sw.r * 0.72; fc.lineWidth = 0.95 * sw.life;
      fc.beginPath();
      for (let i = 0; i < 8; i++) {
        const a1 = i * Math.PI / 4, a2 = a1 + Math.PI * 0.75;
        fc.moveTo(Math.cos(a1) * rIn, Math.sin(a1) * rIn);
        fc.lineTo(Math.cos(a2) * rIn, Math.sin(a2) * rIn);
      }
      fc.stroke(); fc.restore();
    });

    /* hạt tinh quang + ký hiệu + chữ bay */
    fc.globalCompositeOperation = dark ? 'lighter' : 'source-over';
    fc.font = '600 11px "JetBrains Mono", monospace';
    fc.textAlign = 'center'; fc.textBaseline = 'middle';
    motes.forEach(m => {
      const tw = 0.55 + 0.45 * Math.sin(T * 8 + m.seed);
      const al = m.life * tw * (dark ? 0.85 : 0.72) * curAlpha;
      const cStr = dark ? (m.gold ? pal.moteGold : pal.moteDark) : pal.moteDark;
      if (m.glyph) {
        fc.fillStyle = 'rgba(' + cStr + ',' + al * 0.92 + ')';
        fc.fillText(m.glyph, m.x, m.y);
      } else {
        fc.fillStyle = 'rgba(' + cStr + ',' + al + ')';
        fc.beginPath(); fc.arc(m.x, m.y, m.r * (0.7 + 0.3 * tw), 0, Math.PI * 2); fc.fill();
        if (m.star) {
          const L2 = m.r * 4 * tw;
          fc.strokeStyle = 'rgba(' + cStr + ',' + al * 0.72 + ')'; fc.lineWidth = 0.65;
          fc.beginPath();
          fc.moveTo(m.x - L2, m.y); fc.lineTo(m.x + L2, m.y);
          fc.moveTo(m.x, m.y - L2); fc.lineTo(m.x, m.y + L2);
          fc.stroke();
        }
      }
    });
    floatingTexts.forEach(ft => {
      fc.save();
      fc.font = ft.gold ? 'bold 13px "Inter", sans-serif' : '600 11px "JetBrains Mono", monospace';
      fc.fillStyle = ft.gold ? 'rgba(253,224,71,' + Math.min(1, ft.life) * curAlpha + ')' : 'rgba(165,243,252,' + ft.life * curAlpha + ')';
      fc.fillText(ft.text, ft.x, ft.y);
      fc.restore();
    });
    fc.globalCompositeOperation = 'source-over';
    window.__ffRaf = requestAnimationFrame(frame);
  }

  window.__ffCleanup = function () {
    if (window.__ffRaf) cancelAnimationFrame(window.__ffRaf);
    [cv, fx].forEach(el => { if (el && el.parentNode) el.parentNode.removeChild(el); });
  };
  window.__ffRaf = requestAnimationFrame(frame);
})();
