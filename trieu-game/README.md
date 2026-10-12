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
| X | Đánh cua đá bằng mã tấu |
| F | Câu cá (quay mặt về nước) |
| E | Uống nước sông — **30% trúng nước độc** |
| 1 / 2 | Ăn cá sống (20% ngộ độc cá) / ăn cua |
| C | Chế Nước Lá Rừng (2 thảo dược + 1 sậy) |
| Q | Uống Nước Lá Rừng — chữa mọi bệnh cơ bản |
| B | Dựng sàn tre (3 sậy + 2 gỗ) ở ô đang quay mặt |
| R | Ngủ — trên nhà sàn/sàn tre an toàn hơn ngoài trời; ngủ bỏ qua tới lúc triều xuống |
| H | Ẩn/hiện bảng điều khiển |

## Đã có trong bản này

- **Bản đồ thượng nguồn**: sông ở giữa bản đồ, bãi cạn (ford) để qua sông, nhà sàn khởi đầu trên cao, cây, đá, sậy, thảo dược.
- **Triều lên xuống** (chu kỳ 100 giây demo): mép nước thay đổi thật; ô đất thấp bị ngập, người chơi bị cuốn về bờ và ướt.
- **Sàn tre xây sai chỗ** (gần sông, trong tầm triều cường) sẽ bị nước cuốn trôi — bản đồ có vạch cảnh báo trên đồng hồ triều.
- **4 chỉ số sinh tồn**: No bụng, Khát nước, Thể lực, Thân nhiệt, cùng Máu.
- **Bệnh**: Cảm Triều (thân nhiệt < 35), Trúng Nước Độc, Ngộ Độc Cá — chữa bằng Nước Lá Rừng.
- **Thức trắng** sau 150 giây không ngủ: tay run (câu cá khó hơn), màn hình rung, lớp tối nhấp nháy.
- **Chu kỳ ngày/đêm** (240 giây/ngày) và **mưa** làm lạnh người chơi.
- **Cua đá**: quái đơn giản quanh bờ, đuổi và cắn người chơi, rơi cua khi bị hạ, hồi sinh sau 25 giây.
- Chết → được đưa về nhà sàn, mất một nửa vật phẩm.

## Chưa có (để các bước sau)

Multiplayer/Colyseus, nhiều vùng bản đồ và chunk loading, hệ thống kỹ năng (Lặn/Thảo dược/…), 600+ vật phẩm, vũ khí/giáp độ bền, clan & raid, sốt rét, boss, chợ nổi, dungeon hang ngầm.

## Cấu trúc

```
src/
  main.js              khởi tạo Phaser, BootScene sinh texture
  art.js               vẽ tile, nhân vật (16x24), cua bằng code
  world.js             bản đồ, PRNG có seed, công thức triều
  survival.js          chỉ số sinh tồn, bệnh, thức trắng
  scenes/GameScene.js  vòng lặp game, tương tác, HUD
```
