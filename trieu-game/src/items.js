// Dữ liệu vật phẩm, công thức, vũ khí, trang bị và công trình của TRIỀU.
// Thêm vật phẩm mới chỉ cần khai báo ở đây; GameScene đọc trực tiếp từ bảng này.

export const CAT_NAME = {
  resource: 'Tài nguyên',
  rare: 'Hiếm (theo triều)',
  food: 'Thức ăn',
  medicine: 'Thuốc',
  weapon: 'Vũ khí',
  ammo: 'Đạn',
  armor: 'Trang bị',
  vehicle: 'Phương tiện',
};

// use: hiệu ứng khi dùng (xem Survival.applyEffect)
// risk: rủi ro khi dùng { type, p, secs }
// weapon: thông số vũ khí; slot: ô trang bị; mods: chỉnh sửa khi mặc
export const ITEMS = {
  // ---- Tài nguyên ----
  wood:    { name: 'Gỗ', cat: 'resource', desc: 'Gỗ tạp chặt từ cây rừng.' },
  reed:    { name: 'Sậy', cat: 'resource', desc: 'Thân sậy dẻo, vật liệu chính của làng nổi.' },
  herb:    { name: 'Thảo dược', cat: 'resource', desc: 'Lá thuốc dân gian. Dùng để pha thuốc.' },
  stone:   { name: 'Đá', cat: 'resource', desc: 'Đá sông nhỏ, làm dao và chùy.' },
  vine:    { name: 'Dây gai', cat: 'resource', desc: 'Dây gai dai, làm dây cung và buộc đồ.' },
  bark:    { name: 'Vỏ cây đắng', cat: 'resource', desc: 'Vỏ cây đắng, nguyên liệu Thuốc Sốt.' },
  shell:   { name: 'Ốc hến', cat: 'resource', desc: 'Ốc hến ở bãi cạn, chỉ mò được lúc triều thấp.' },
  charcoal:{ name: 'Than củi', cat: 'resource', desc: 'Than nung từ gỗ bên bếp lửa.' },
  rootcoc: { name: 'Rễ cốc', cat: 'resource', desc: 'Rễ cây cốc mọc trong đầm lầy. Nguyên liệu thuốc đầm.' },
  muoi:    { name: 'Muối hạt', cat: 'resource', desc: 'Muối biển từ ghe buôn. Dùng để ướp cá.' },

  // ---- Hiếm (theo triều / kỹ năng) ----
  pearl:   { name: 'Ngọc trai', cat: 'rare', desc: 'Hiếm — chỉ mò được trên bãi cạn lúc triều thấp.' },
  coral:   { name: 'San hô', cat: 'rare', desc: 'San hô đá, rơi từ tảng đá khi Lặn Lv5+.' },
  lua:     { name: 'Lụa ghe', cat: 'rare', desc: 'Lụa mềm từ ghe buôn phương Bắc. Hiếm, thường chỉ có ở chợ.' },

  // ---- Thức ăn ----
  fish:    { name: 'Cá sống', cat: 'food', desc: 'Cá sông tươi. Ăn sống có thể ngộ độc.',
             use: { hunger: 22 }, risk: { type: 'fishpoison', p: 0.2, secs: 15 } },
  cafish:  { name: 'Cá nướng', cat: 'food', desc: 'Cá nướng trên bếp lửa. An toàn.', use: { hunger: 35 } },
  cua:     { name: 'Thịt cua', cat: 'food', desc: 'Thịt cua đá. Nên nướng cho ngon.', use: { hunger: 25 } },
  cuanuong:{ name: 'Cua nướng', cat: 'food', desc: 'Cua nướng thơm, ấm bụng.', use: { hunger: 45, temp: 5 } },
  canhoc:  { name: 'Canh ốc', cat: 'food', desc: 'Canh ốc hến nóng, bù nước và ấm người.', use: { hunger: 30, thirst: 20, temp: 6 } },
  cakho:   { name: 'Cá khô', cat: 'food', desc: 'Cá phơi khô trên giàn. Để được lâu, no bền.', use: { hunger: 30, stamina: 20 } },
  camuoi:  { name: 'Cá muối', cat: 'food', desc: 'Cá ướp muối rồi nướng. No lâu hơn cá nướng.', use: { hunger: 45 } },
  tom:     { name: 'Tôm sông', cat: 'food', desc: 'Tôm sông từ bẫy tre. Ăn sống khá an toàn.', use: { hunger: 18, stamina: 5 } },
  thitran: { name: 'Thịt rắn nước', cat: 'food', desc: 'Thịt rắn sông, bổ sức.', use: { hunger: 30, stamina: 15 } },
  cagold:  { name: 'Cá vàng', cat: 'rare', desc: 'Cá vàng hiếm, chỉ câu được lúc nước lớn. No và hồi máu.',
             use: { hunger: 40, hp: 15 } },

  // ---- Thuốc ----
  remedy:      { name: 'Nước Lá Rừng', cat: 'medicine', desc: 'Chữa Cảm Triều, Trúng Nước Độc, Ngộ Độc Cá.',
                 use: { cures: ['sick', 'poison', 'fishpoison'], temp: 10 } },
  feverMed:    { name: 'Thuốc Sốt', cat: 'medicine', desc: 'Thuốc đắng từ vỏ cây. Chữa sốt rét.', use: { cureMalaria: true } },
  bandage:     { name: 'Lá băng bó', cat: 'medicine', desc: 'Giã lá đắp vết thương. Hồi máu.', use: { hp: 30 } },
  ginger:      { name: 'Trà gừng', cat: 'medicine', desc: 'Trà gừng nóng, đuổi lạnh và chữa Cảm Triều.', use: { temp: 25, cures: ['sick'] } },
  charcoalPill:{ name: 'Viên than hoạt', cat: 'medicine', desc: 'Than hoạt giải độc nước.', use: { cures: ['poison'] } },
  caoCoc:      { name: 'Cao cốc', cat: 'medicine', desc: 'Cao đắng từ rễ cốc. Hồi thể lực, chữa Cảm Triều.', use: { stamina: 20, cures: ['sick'] } },
  thuocCoc:    { name: 'Thuốc cốc', cat: 'medicine', desc: 'Thuốc đầm lầy mạnh hơn Thuốc Sốt: chữa sốt rét và hồi máu.', use: { cureMalaria: true, hp: 15 } },

  // ---- Vũ khí ----
  machete: { name: 'Mã tấu', cat: 'weapon', desc: 'Cân bằng mọi địa hình. Vũ khí khởi đầu.',
             weapon: { kind: 'melee', dmg: 25, range: 24, cost: 10, cd: 0.45 } },
  spear:   { name: 'Giáo tre', cat: 'weapon', desc: 'Mạnh khi đứng cạnh nước, yếu trên cạn.',
             weapon: { kind: 'melee', dmg: 20, range: 34, cost: 8, cd: 0.5, waterBonus: 15 } },
  knife:   { name: 'Dao đá', cat: 'weapon', desc: 'Nhẹ, ra đòn nhanh, tốn ít sức.',
             weapon: { kind: 'melee', dmg: 18, range: 22, cost: 4, cd: 0.25 } },
  club:    { name: 'Chùy đá', cat: 'weapon', desc: 'Nặng, đánh rất đau nhưng chậm.',
             weapon: { kind: 'melee', dmg: 40, range: 26, cost: 14, cd: 0.8 } },
  bow:     { name: 'Cung tre', cat: 'weapon', desc: 'Bắn xa, cần Mũi tên. Đứng yên nhắm theo hướng quay mặt.',
             weapon: { kind: 'ranged', dmg: 22, range: 120, cost: 5, cd: 0.6, ammo: 'arrow' } },
  arrow:   { name: 'Mũi tên', cat: 'ammo', desc: 'Mũi tên tre đầu đá.' },

  // ---- Trang bị ----
  nonla:   { name: 'Nón lá', cat: 'armor', slot: 'head', desc: 'Che mưa: giảm lạnh khi mưa 40%.', mods: { rainTemp: 0.6 } },
  aotoi:   { name: 'Áo tơi', cat: 'armor', slot: 'body', desc: 'Áo mưa lá: giảm lạnh 70%, giảm ướt 50%.', mods: { rainTemp: 0.3, wet: 0.5 } },
  aogiap:  { name: 'Áo giáp tre', cat: 'armor', slot: 'body', desc: 'Giáp tre đan dày: nhận sát thương từ cua/rắn giảm 50%.', mods: { dmgTaken: 0.5 } },
  aolua:   { name: 'Áo lụa', cat: 'armor', slot: 'body', desc: 'Áo lụa nhẹ: nhận sát thương giảm 20%, đi nhanh hơn 10%.', mods: { dmgTaken: 0.8, speed: 1.1 } },
  giaygo:  { name: 'Giày gỗ', cat: 'armor', slot: 'feet', desc: 'Giày gỗ đi trên bùn nhanh hơn 8%.', mods: { speed: 1.08 } },

  // ---- Phương tiện ----
  boat:    { name: 'Thuyền độc mộc', cat: 'vehicle', desc: 'Đi lại trên sông. Phím O để lên/xuống thuyền khi đứng cạnh nước.', vehicle: true },
};

// Công thức chế tạo (C) và xây dựng (B).
//   out/n: vật phẩm và số lượng ra; need: nguyên liệu; station: trạm cần đứng gần (K = bếp lửa, DR = giàn phơi)
//   skill: { k, lv } điều kiện kỹ năng; perk: 'herb15' giảm 1 thảo dược ở Thảo dược Lv15
//   place: loại ô đặt xuống (chỉ với công thức xây dựng); name/desc dùng cho công trình
export const RECIPES = [
  // Vũ khí & đạn
  { out: 'spear', n: 1, need: { wood: 3, reed: 2 } },
  { out: 'knife', n: 1, need: { stone: 2, wood: 1 } },
  { out: 'club', n: 1, need: { stone: 3, wood: 2 } },
  { out: 'bow', n: 1, need: { wood: 3, vine: 2 } },
  { out: 'arrow', n: 2, need: { reed: 1, stone: 1 } },

  // Trang bị & phương tiện
  { out: 'nonla', n: 1, need: { reed: 3, vine: 1 } },
  { out: 'aotoi', n: 1, need: { reed: 4, vine: 2 } },
  { out: 'aogiap', n: 1, need: { wood: 5, vine: 2 } },
  { out: 'aolua', n: 1, need: { lua: 2, vine: 1 } },
  { out: 'giaygo', n: 1, need: { wood: 3, vine: 1 } },
  { out: 'boat', n: 1, need: { wood: 6, reed: 4, vine: 2 } },

  // Thuốc
  { out: 'bandage', n: 1, need: { herb: 2, vine: 1 } },
  { out: 'remedy', n: 1, need: { herb: 2, reed: 1 }, perk: 'herb15' },
  { out: 'feverMed', n: 1, need: { herb: 3, wood: 1 }, skill: { k: 'herb', lv: 10 } },
  { out: 'ginger', n: 1, need: { herb: 2, wood: 1 }, station: 'K' },
  { out: 'charcoalPill', n: 1, need: { charcoal: 1, herb: 1 } },
  { out: 'caoCoc', n: 1, need: { rootcoc: 2, herb: 1 } },
  { out: 'thuocCoc', n: 1, need: { caoCoc: 1, rootcoc: 2, bark: 1 }, station: 'K', skill: { k: 'herb', lv: 12 } },

  // Nung nấu & chế biến
  { out: 'charcoal', n: 1, need: { wood: 2 }, station: 'K' },
  { out: 'cafish', n: 1, need: { fish: 1 }, station: 'K' },
  { out: 'cuanuong', n: 1, need: { cua: 1 }, station: 'K' },
  { out: 'canhoc', n: 1, need: { shell: 2, herb: 1 }, station: 'K' },
  { out: 'cakho', n: 1, need: { fish: 2, wood: 1 }, station: 'DR' },
  { out: 'camuoi', n: 1, need: { fish: 1, muoi: 1 }, station: 'K' },

  // Xây dựng (đặt xuống ô đang quay mặt — mở bằng phím B)
  { build: true, place: 'P', name: 'Sàn tre', desc: 'Sàn tre cao. Đặt gần sông sẽ bị triều cường cuốn trôi.', need: { reed: 3, wood: 2 } },
  { build: true, place: 'K', name: 'Bếp lửa', desc: 'Sưởi ấm trong bán kính 2 ô; là trạm nung nấu.', need: { wood: 2, reed: 2 } },
  { build: true, place: 'SP', name: 'Cọc nhọn', desc: 'Chặn đường đi; cua đi sát sẽ bị đâm.', need: { wood: 4, stone: 2 } },
  { build: true, place: 'LM', name: 'Đèn xua muỗi', desc: 'Xua muỗi trong bán kính 4 ô, ban đêm.', need: { reed: 2, wood: 1, stone: 1 } },
  { build: true, place: 'DR', name: 'Giàn phơi cá', desc: 'Trạm phơi cá làm Cá khô.', need: { wood: 3, vine: 2 } },
  { build: true, place: 'FLAG', name: 'Cờ làng', desc: 'Cờ trang trí của làng nổi.', need: { wood: 2, vine: 1 } },
  { build: true, place: 'TR', name: 'Bẫy tôm', desc: 'Đặt xuống ô NƯỚC đang quay mặt. Thỉnh thoảng bắt được tôm; đứng quay mặt về bẫy và nhấn Space để thu.', need: { vine: 2, reed: 2 }, water: true },
];

// Tên và mô tả hiển thị cho một công thức.
export function recipeName(r) {
  return r.build ? r.name : ITEMS[r.out].name;
}
export function recipeDesc(r) {
  return r.build ? r.desc : ITEMS[r.out].desc;
}
