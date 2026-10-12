# TRIỀU — prototype sinh tồn pixel (vertical slice)

Prototype chạy trên trình duyệt, viết bằng **Phaser 3 + Vite**. Toàn bộ sprite pixel được sinh bằng code (không cần file ảnh).

## Chạy

```bash
cd trieu-game
npm install
npm run dev        # http://localhost:5173  (bind 0.0.0.0)
npm run build      # build ra dist/
```

## Điều khiển

| Phím | Tác dụng |
|---|---|
| WASD / Mũi tên | Đi bộ |
| Shift | Chạy (tốn thể lực) |
| Space | Hái thảo dược, chặt cây, đập đá, cắt sậy, mò ốc hến (bãi cạn lúc triều thấp) |
| X | Đánh bằng vũ khí đang cầm (cua đá, rắn nước) |
| V | Đổi vũ khí đã có |
| O | Lên / xuống thuyền (đứng cạnh nước) |
| F | Câu cá (quay mặt về nước) |
| E | Uống nước sông (có thể trúng nước độc) |
| **C** | **Menu CHẾ TẠO** — công thức vũ khí, trang bị, thuốc, đồ ăn, thuyền |
| **B** | **Menu XÂY DỰNG** — đặt công trình ở ô đang quay mặt |
| **I** | **Menu TÚI ĐỒ** — dùng vật phẩm, mặc trang bị, cầm vũ khí, lái thuyền |
| 1 / 2 / 3 | Ăn nhanh: cá / thịt cua hoặc cua nướng / cá vàng |
| T | Nướng cá sống (đứng gần bếp lửa) |
| Q / N | Uống Nước Lá Rừng / Thuốc Sốt |
| R | Ngủ (nhà sàn an toàn hơn; ngủ tới lúc triều xuống) |
| **P** | **Lưu tiến trình ngay** (tự lưu mỗi 20 giây và khi đóng trang) |
| **Backspace** | **Xoá tiến trình đã lưu** và chơi lại từ đầu |
| H | Ẩn/hiện bảng điều khiển |

Trong menu: ↑↓ hoặc W/S chọn · Enter thực hiện · Esc hoặc đúng phím mở để đóng. **Thế giới tạm dừng khi mở menu.**

## Vật phẩm & công thức (`src/items.js`)

Dữ liệu là một bảng duy nhất: thêm vật phẩm/công thức chỉ cần sửa file này.

- **Tài nguyên**: Gỗ, Sậy, Thảo dược, Đá, Dây gai, Vỏ cây đắng, Ốc hến, Than củi
- **Hiếm (theo triều/kỹ năng)**: Ngọc trai (mò ốc lúc triều thấp), San hô (đập đá khi Lặn Lv5+), Cá vàng (câu lúc nước lớn)
- **Thức ăn**: Cá sống (rủi ro ngộ độc), Cá nướng, Thịt cua, Cua nướng, Canh ốc, Cá khô (giàn phơi), Thịt rắn nước
- **Thuốc**: Nước Lá Rừng (chữa Cảm Triều / độc nước / ngộ độc cá), Thuốc Sốt (sốt rét), Lá băng bó (hồi máu), Trà gừng (ấm + chữa Cảm Triều), Viên than hoạt (giải độc nước)
- **Vũ khí**: Mã tấu, Giáo tre (mạnh cạnh nước), Dao đá (nhanh), Chùy đá (nặng), Cung tre + Mũi tên (bắn xa)
- **Trang bị**: Nón lá (giảm lạnh khi mưa), Áo tơi (giảm lạnh + ướt), Áo giáp tre (giảm sát thương cua/rắn 50%), Giày gỗ (đi nhanh hơn)
- **Phương tiện**: Thuyền độc mộc (đi trên sông)
- **Đầm lầy** (tây bắc, nguyên liệu): Rễ cốc (đào cây cốc), Cao cốc (2 rễ + 1 thảo dược), Thuốc cốc (cao cốc + 2 rễ + 1 vỏ đắng, cần bếp lửa và Thảo dược Lv12; chữa sốt rét, hồi máu)
- **Thuỷ sản**: Tôm sông (từ bẫy tôm, đói ít, tốn ít thể lực)
- **Công trình** (menu B): Sàn tre, Bếp lửa, Cọc nhọn (đâm cua), Đèn xua muỗi, Giàn phơi cá, Cờ làng, **Bẫy tôm** (đặt xuống nước sâu)

**Bẫy tôm**: đứng trên bờ quay mặt về ô nước sâu rồi dựng bẫy (menu B). Mỗi 30 giây có 60% khả năng bắt được 1 tôm, chứa tối đa 5 con. Quay lại đứng gần bẫy và nhấn Space để thu.

Một số công thức cần trạm: **Bếp lửa** (K) cho than, trà gừng, cá nướng, cua nướng, canh ốc; **Giàn phơi** (DR) cho cá khô. Thuốc Sốt cần Thảo dược Lv10.

## Đồ họa

- Tile 16px có nhiều tông, ánh sáng chiếu từ trên-trái; nước có sóng, lấp lánh và bọt vỗ bờ (chạy theo mực triều).
- Lửa bếp và cờ làng nhấp nháy; quầng sáng ấm quanh bếp và đèn xua muỗi khi trời tối.
- Nhân vật, cua và rắn có viền tối; cua và rắn có 2 khung hình chuyển động.
- Vignette làm tối mép màn hình; bảng HUD có nền mờ để dễ đọc.

## Chợ Nổi (Đợt 5)

- Chợ ở bờ đông sông, vùng an toàn: cua không vào được. Đứng cạnh thương lái và nhấn **E** để mở menu đổi đồ.
- Thương lái đổi đồ lấy đồ, không có tiền. Mỗi ngày mỗi thương lái bày 3 kèo; mỗi kèo đổi tối đa 2 lần mỗi ngày.
- Logic kèo nằm ở `src/market.js` (bảng kèo, giá trị, lượt đổi). Bố cục chợ nằm ở `stampMarket` trong `src/world.js`.
- Kiểm thử đơn vị: `npm test` (chạy `node --test`, không cần trình duyệt).

## Vùng Đầm Lầy (Đợt 4)

Vùng tây bắc (góc trên bên trái bản đồ, ngay phía bắc nhà sàn). Bùn lầy làm chậm di chuyển (60%), cây cốc cho Rễ cốc và hồi sinh sau 90 giây, sương mù động phủ lên vùng và dày hơn khi mưa (sương dày có thêm rễ cốc). Muỗi đầm lầy đốt cả ban ngày, mỗi 40–60 giây, 25% nhiễm sốt rét; đèn xua muỗi vẫn bảo vệ được trong bán kính 4 ô.

Hồi thể lực tự nhiên giảm 10% so với trước (bù bằng thuốc).

## Âm thanh, cài đặt, số liệu nổi

- Âm thanh tổng hợp (không cần file âm thanh) trong `src/sfx.js`: nhặt đồ, chặt, đánh, bẫy, thu hoạch.
- **M** tắt/bật tiếng · **G** đổi đồ họa cao/thấp (cao: vignette, bọt sóng, quầng sáng). Lưu trong `localStorage` (`trieu-settings`).
- Icon vật phẩm trong menu chế tạo và túi đồ (`src/icons.js`).
- Hoạt hình đi bộ 4 khung (trái, chụm, phải, chụm).
- Số nổi trên đầu nhân vật: `+n` khi nhặt đồ, `-n` khi bị thương.
- Các hằng số cân bằng (tốc độ, hồi sinh, bẫy, muỗi, cọc nhọn...) gom về `src/balance.js`.

## Lưu & tải

Tiến trình được lưu trong `localStorage` (khoá `trieu-save-v1`): thời gian, bản đồ đã biến đổi, túi đồ, trang bị, kỹ năng, chỉ số sinh tồn, vị trí, bệnh, bẫy tôm. Mở lại trang sẽ tự tải tiến trình. Phím **P** lưu ngay, **Backspace** xoá và chơi lại.

## Hệ thống

- **Bản đồ thượng nguồn**: sông ở giữa, bãi cạn để qua sông, nhà sàn khởi đầu trên cao.
- **Triều lên xuống** (chu kỳ 100 giây demo): mép nước thay đổi; ô đất thấp bị ngập; người chơi bị cuốn về bờ (trừ khi đi thuyền). Sàn tre dựng gần sông bị cuốn trôi; đồng hồ triều có vạch cảnh báo.
- **4 chỉ số sinh tồn** (No bụng, Khát, Thể lực, Thân nhiệt) và **Máu**.
- **Bệnh**: Cảm Triều (thân nhiệt < 35), Trúng Nước Độc, Ngộ Độc Cá, Sốt Rét Sông (muỗi ven sông ban đêm; sốt 8 giây mỗi 40 giây).
- **Kỹ năng** (cấp = XP/20, tối đa 20): Lặn (sát thương cận chiến), Thảo dược (hái nhiều hơn, mở Thuốc Sốt ở Lv10, Nước Lá Rừng chỉ cần 1 lá ở Lv15), Chài lưới (tỉ lệ câu, cá vàng).
- **Sinh vật**: cua đá trên bờ; rắn nước bơi trong sông (rơi thịt rắn, cắn gây độc).
- **Thức trắng** sau 150 giây không ngủ: câu cá khó hơn, màn hình rung.
- **Ngày/đêm** (240 giây/ngày) và **mưa**.
- Chết → về nhà sàn, mất một nửa vật phẩm thường (trang bị giữ nguyên).

## Chưa có (để các bước sau)

Multiplayer/Colyseus, clan & raid, chợ nổi, boss, hang ngầm, nhiệm vụ làng, chó giữ nhà, quái đầm lầy (Ma Da), sự kiện theo mùa, thời tiết cực đoan (xem `ROADMAP.md`) (hiện Lặn chỉ tăng sát thương và tỉ lệ nhặt san hô).

## Cấu trúc

```
src/
  main.js              khởi tạo Phaser, BootScene sinh texture
  art.js               vẽ tile (21 ô), nhân vật (16x24), cua, rắn bằng code
  items.js             BẢNG vật phẩm, công thức, vũ khí, trang bị, công trình
  world.js             bản đồ, PRNG có seed, công thức triều
  survival.js          chỉ số sinh tồn, bệnh, thức trắng, áp dụng hiệu ứng vật phẩm
  save.js              lưu / tải / xoá tiến trình (localStorage)
  ui/menu.js           menu danh sách dùng chung (chế tạo / xây dựng / túi đồ)
  scenes/GameScene.js  vòng lặp game, tương tác, sinh vật, HUD
```
