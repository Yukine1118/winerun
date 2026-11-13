// 房間代碼：4 碼，只用不容易看錯的字元（沒有 0/O、1/I/L）
export const ROOM_CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 4;

export function generateRoomCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

/** 使用者輸入的代碼 → 去空白、轉大寫；格式不對就回傳 null */
export function normalizeRoomCode(input: string): string | null {
  const code = input.trim().toUpperCase();
  if (code.length !== ROOM_CODE_LENGTH) return null;
  for (const ch of code) {
    if (!ROOM_CODE_CHARS.includes(ch)) return null;
  }
  return code;
}

/** 暱稱：去頭尾空白，1~20 字 */
export function normalizeNickname(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.trim();
  if (name.length < 1 || name.length > 20) return null;
  return name;
}
