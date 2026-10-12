// Bảng cân bằng: các con số chơi được của TRIỀU gom về một nơi.
// Đổi giá trị ở đây để chỉnh độ khó; logic nằm ở GameScene / survival.js / world.js.

// Tốc độ đi bộ (px thế giới / giây)
export const WALK_SPEED = 62;

// Hệ số chạy (Shift, tốn thể lực)
export const SPRINT_MULT = 1.55;

// Hệ số tốc độ khi đi thuyền
export const BOAT_SPEED_MULT = 1.1;

// Số cua đá trên bờ
export const CRAB_COUNT = 3;

// Thời gian hồi sinh cua (giây)
export const CRAB_RESPAWN = 25;

// Số rắn nước trong sông
export const SNAKE_COUNT = 2;

// Thời gian hồi sinh rắn (giây)
export const SNAKE_RESPAWN = 30;

// Thời gian mọc lại cây, sậy, thảo dược, cây cốc (giây)
export const RESOURCE_RESPAWN = 90;

// Thời gian mọc lại đá (giây)
export const ROCK_RESPAWN = 120;

// Khoảng cách tối đa từ tâm sông mà triều cường có thể tới sàn tre
export const PLATFORM_MAX_D = 5;

// Muỗi ven sông hoạt động trong phạm vi này (ô)
export const MOSQUITO_RANGE = 8;

// Đèn xua muỗi bảo vệ trong bán kính này (ô)
export const LAMP_RANGE = 4;

// Sát thương cọc nhọn gây ra cho cua
export const SPIKE_DMG = 6;

// Bẫy tôm thử bắt một lần sau mỗi bao nhiêu giây
export const TRAP_PERIOD = 30;

// Số tôm tối đa mỗi bẫy chứa
export const TRAP_MAX = 5;

// Đầm lầy: muỗi đốt tối thiểu sau bao nhiêu giây
export const SWAMP_MOSQ_MIN = 40;

// Đầm lầy: khoảng ngẫu nhiên thêm vào thời gian đốt (giây)
export const SWAMP_MOSQ_RANGE = 20;

// Hệ số tốc độ khi đi trên bùn lầy
export const MARSH_SLOW = 0.6;
