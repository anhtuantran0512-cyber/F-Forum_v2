# TRIỀU — Lộ trình (bản đơn người chơi)

Mỗi đợt: một hệ thống lõi + mở rộng bản đồ + kiểm thử + commit riêng.
Các mục cần server (clan, raid, PvP, bảng xếp hạng, chợ giữa người chơi) để sau, khi quyết định có backend.

| Đợt | Nội dung | Trạng thái |
|---|---|---|
| 1 | Ổn định và kiểm thử E2E | Xong |
| 2 | Lưu và tải tiến trình | Xong |
| 3 | Bẫy tôm | Xong |
| 4 | Vùng Đầm Lầy: bùn lầy, cây cốc, sương mù động, muỗi đầm lầy, thuốc cốc 3 tầng | Xong (một phần) |
| 5 | Chợ nổi trung tâm (vùng an toàn, thương lái đổi đồ, không cần server) | Xong |
| 6 | Sự kiện thời tiết: bão, sương dày, nước dâng bất thường | Chưa làm |
| 7 | Lưới và giàn phơi tự động | Chưa làm |
| 8 | Chuỗi nhiệm vụ làng | Chưa làm |
| 9 | Boss Giao Long (một người chơi, theo triều đỏ) | Chưa làm |
| 10 | Hang ngầm dưới sông | Chưa làm |

## Đồ họa 1080p (đã làm)
- Canvas 1920×1080, thế giới zoom ×4, giao diện phóng ×1.5 (chữ render ở độ phân giải 1.5).
- Bảng điều khiển có nút Đóng, đóng bằng H hoặc Esc.

## Đợt 5 — Chợ nổi (đã làm)
- Chợ ở bờ đông sông (x 44–53, y 26–33): vùng an toàn, cua không vào và không cắn người chơi trong chợ, không spawn cua trong chợ.
- 3 thương lái (Bà Hến, Ông Ghe, Chị Lụa), đổi đồ lấy đồ, không có tiền. Mỗi ngày bày 3 kèo chọn từ kho 6 kèo; mỗi kèo đổi tối đa 2 lần/ngày.
- Mọi kèo không làm tăng tổng giá trị (kiểm tra bằng `npm test`).
- Vật phẩm mới: Muối hạt, Lụa ghe, Cá muối (công thức), Áo lụa (công thức).

## Đợt 4 — phần còn thiếu so với roadmap gốc
- Nhiệm vụ "Ân Oán" trong đầm lầy (25 nhiệm vụ) → chuyển sang chuỗi nhiệm vụ làng (đợt 8).
- Quái Ma Da, Rắn Nước Độc đầm lầy.
- Chó Giữ Nhà (pet cảnh báo sớm).
- Sự kiện "Sương Đêm Đầu Mùa" có thời hạn.
- Nhiều công thức thuốc hơn (hiện 3 tầng, chưa đủ 40).

## Nâng cấp hệ thống (đã xong)
- Âm thanh tổng hợp, tắt tiếng bằng M.
- Cài đặt đồ họa cao/thấp bằng G, lưu localStorage.
- Icon vật phẩm và công trình trong menu.
- Hoạt hình đi bộ 4 khung.
- Bảng cân bằng gom về `src/balance.js`.
- Số liệu nổi trên đầu nhân vật khi nhặt đồ hoặc bị thương.

## Mục tiêu nội dung (đã thống nhất)
- Mốc 1 năm: 600+ vật phẩm (hiện khoảng 38).
- Số vùng bản đồ và hệ thống lõi tăng dần theo từng đợt.

## Ngoài phạm vi bản đơn
Clan & Clan War, raid Cường Triều, Vũng Xoáy PvP, bảng xếp hạng server, alliance, chợ giữa người chơi, World Boss server-wide, community goal, Triều Đỏ theo server, Tham Quan nhà người khác.
