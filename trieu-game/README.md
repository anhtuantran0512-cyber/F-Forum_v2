# TRIỀU — prototype sinh tồn pixel (vertical slice)

Bản prototype chạy trên trình duyệt, viết bằng **Phaser 3 + Vite**. Toàn bộ sprite pixel được sinh bằng code (không cần file ảnh).

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
| Space | Hái thảo dược / cắt sậy / chặt cây (quay mặt về ô tương ứng) |
| X | Đánh cua đá bằng vũ khí đang cầm |
| V | Đổi vũ khí (mã tấu / giáo) |
| G | Chế giáo tre (3 gỗ + 2 sậy) — giáo mạnh khi đứng cạnh nước |
| F | Câu cá (quay mặt về nước) — cá vàng chỉ xuất hiện lúc nước lớn |
| E | Uống nước sông — **30% trúng nước độc** |
| 1 / 2 / 3 | Ăn cá (cá nướng ưu tiên) / ăn cua / ăn cá vàng |
| K | Dựng bếp lửa (2 gỗ + 2 sậy) — sưởi ấm, đứng gần để nướng |
| T | Nướng cá sống (đứng gần bếp lửa) — cá nướng an toàn |
| C | Chế Nước Lá Rừng (2 thảo dược + 1 sậy; Thảo dược Lv15 chỉ cần 1) |
| Q | Uống Nước Lá Rừng — chữa Cảm Triều, Trúng Nước Độc, Ngộ Độc Cá |
| M | Pha Thuốc Sốt (3 thảo dược + 1 gỗ, cần Thảo dược Lv10) |
| N | Uống Thuốc Sốt — chữa sốt rét |
| B | Dựng sàn tre (3 sậy + 2 gỗ) ở ô đang quay mặt |
| R | Ngủ — nhà sàn/sàn tre an toàn hơn; ngủ tới lúc triều xuống |
| H | Ẩn/hiện bảng điều khiển |

## Đã có trong bản này

- **Bản đồ thượng nguồn**: sông ở giữa, bãi cạn (ford) để qua sông, nhà sàn khởi đầu trên cao, cây, đá, sậy, thảo dược.
- **Triều lên xuống** (chu kỳ 100 giây demo): mép nước thay đổi thật; ô đất thấp bị ngập, người chơi bị cuốn về bờ và ướt.
- **Sàn tre xây sai chỗ** (gần sông) sẽ bị nước cuốn trôi; đồng hồ triều có vạch cảnh báo.
- **4 chỉ số sinh tồn** (No bụng, Khát, Thể lực, Thân nhiệt) và Máu.
- **Bệnh**: Cảm Triều (thân nhiệt < 35), Trúng Nước Độc, Ngộ Độc Cá, **Sốt Rét Sông** (muỗi đốt ven sông ban đêm, sốt cao 8 giây mỗi 40 giây).
- **Kỹ năng** (cấp = XP/20, tối đa 20):
  - *Lặn*: Lv5 +5 sát thương mã tấu; Lv10 +5 mã tấu, +5 giáo.
  - *Thảo dược*: Lv5 đôi khi hái được 2 lá; Lv10 mở khoá Thuốc Sốt; Lv15 chế Nước Lá Rừng chỉ cần 1 thảo dược.
  - *Chài lưới*: mỗi cấp +2% tỉ lệ câu; tăng tỉ lệ cá vàng khi nước lớn.
- **Vũ khí theo địa hình**: giáo mạnh hơn khi đứng cạnh nước, mã tấu cân bằng.
- **Bếp lửa**: sưởi ấm, nướng cá an toàn.
- **Thức trắng** sau 150 giây không ngủ: tay run (câu cá khó hơn), màn hình rung, lớp tối nhấp nháy.
- **Ngày/đêm (240 giây/ngày)** và **mưa** làm lạnh người chơi.
- **Cua đá**: đuổi và cắn người chơi, rơi cua khi bị hạ, hồi sinh sau 25 giây.
- Chết → được đưa về nhà sàn, mất một nửa vật phẩm.

## Chưa có (để các bước sau)

Multiplayer/Colyseus, nhiều vùng bản đồ và chunk loading, 600+ vật phẩm, độ bền vũ khí, clan & raid, boss, chợ nổi, thuyền, hang ngầm, cung tên, trồng thảo dược, Lặn dưới nước (hiện Lặn chỉ tăng sát thương).

## Cấu trúc

```
src/
  main.js              khởi tạo Phaser, BootScene sinh texture
  art.js               vẽ tile, nhân vật (16x24), cua bằng code
  world.js             bản đồ, PRNG có seed, công thức triều
  survival.js          chỉ số sinh tồn, bệnh, thức trắng
  scenes/GameScene.js  vòng lặp game, tương tác, HUD
```
