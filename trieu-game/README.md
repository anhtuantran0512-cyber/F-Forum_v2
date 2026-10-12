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
- **Công trình** (menu B): Sàn tre, Bếp lửa, Cọc nhọn (đâm cua), Đèn xua muỗi, Giàn phơi cá, Cờ làng

Một số công thức cần trạm: **Bếp lửa** (K) cho than, trà gừng, cá nướng, cua nướng, canh ốc; **Giàn phơi** (DR) cho cá khô. Thuốc Sốt cần Thảo dược Lv10.

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

Multiplayer/Colyseus, nhiều vùng bản đồ và chunk loading, độ bền vũ khí, clan & raid, boss, chợ nổi, hang ngầm, trồng thảo dược, thời tiết cực đoan, Lặn dưới nước (hiện Lặn chỉ tăng sát thương và tỉ lệ nhặt san hô).

## Cấu trúc

```
src/
  main.js              khởi tạo Phaser, BootScene sinh texture
  art.js               vẽ tile (20 ô), nhân vật (16x24), cua, rắn bằng code
  items.js             BẢNG vật phẩm, công thức, vũ khí, trang bị, công trình
  world.js             bản đồ, PRNG có seed, công thức triều
  survival.js          chỉ số sinh tồn, bệnh, thức trắng, áp dụng hiệu ứng vật phẩm
  ui/menu.js           menu danh sách dùng chung (chế tạo / xây dựng / túi đồ)
  scenes/GameScene.js  vòng lặp game, tương tác, sinh vật, HUD
```
