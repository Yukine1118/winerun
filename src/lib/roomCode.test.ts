import { describe, expect, it } from "vitest";
import {
  ROOM_CODE_CHARS,
  generateRoomCode,
  normalizeNickname,
  normalizeRoomCode,
} from "./roomCode";

describe("generateRoomCode", () => {
  it("產生 4 碼且只用允許的字元", () => {
    for (let i = 0; i < 1000; i++) {
      const code = generateRoomCode();
      expect(code).toHaveLength(4);
      for (const ch of code) expect(ROOM_CODE_CHARS).toContain(ch);
    }
  });
});

describe("normalizeRoomCode", () => {
  it("轉大寫並去空白", () => {
    expect(normalizeRoomCode(" ab2c ")).toBe("AB2C");
  });
  it("長度不對或含易混淆字元時回傳 null", () => {
    expect(normalizeRoomCode("ABC")).toBeNull();
    expect(normalizeRoomCode("AB0C")).toBeNull();
    expect(normalizeRoomCode("ABIC")).toBeNull();
  });
});

describe("normalizeNickname", () => {
  it("接受 1~20 字", () => {
    expect(normalizeNickname("  小明 ")).toBe("小明");
    expect(normalizeNickname("")).toBeNull();
    expect(normalizeNickname("a".repeat(21))).toBeNull();
    expect(normalizeNickname(123)).toBeNull();
  });
});
