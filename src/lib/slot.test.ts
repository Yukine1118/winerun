import { describe, expect, it } from "vitest";
import {
  DEFAULT_REELS,
  comboName,
  comboToRecipeDraft,
  loadReels,
  mergeNames,
  parseItems,
  pickRandom,
  spinReels,
} from "./slot";

describe("pickRandom", () => {
  it("抽 3000 次：每個項目都抽得到，而且只會抽到清單裡的東西", () => {
    const items = ["a", "b", "c", "d"];
    const counts = new Map<string, number>();
    for (let i = 0; i < 3000; i++) {
      const v = pickRandom(items);
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    expect([...counts.keys()].sort()).toEqual(items);
    for (const c of counts.values()) expect(c).toBeGreaterThan(550); // 理論值 750
  });
  it("空清單會報錯", () => {
    expect(() => pickRandom([])).toThrow();
  });
});

describe("spinReels", () => {
  const reels = [
    ["琴酒", "伏特加"],
    ["通寧水", "可樂", "雪碧"],
    ["檸檬片"],
  ];

  it("每個轉輪都抽到自己清單裡的東西", () => {
    for (let i = 0; i < 500; i++) {
      const result = spinReels(reels, [null, null, null], [false, false, false]);
      result.forEach((v, r) => expect(reels[r]).toContain(v));
    }
  });

  it("鎖定的轉輪不會變，其他的會重抽", () => {
    const seenMixers = new Set<string | null>();
    for (let i = 0; i < 300; i++) {
      const result = spinReels(reels, ["琴酒", "可樂", "檸檬片"], [true, false, false]);
      expect(result[0]).toBe("琴酒");
      seenMixers.add(result[1]);
    }
    expect(seenMixers.size).toBe(3);
  });

  it("鎖定但還沒有結果 → 還是會抽", () => {
    const result = spinReels(reels, [null, null, null], [true, true, true]);
    expect(result.every((v) => v !== null)).toBe(true);
  });

  it("鎖定的項目已經從清單移除 → 重抽", () => {
    const result = spinReels(reels, ["已刪除的酒", "可樂", "檸檬片"], [true, true, true]);
    expect(reels[0]).toContain(result[0]);
    expect(result[1]).toBe("可樂");
  });

  it("清單是空的轉輪結果是 null", () => {
    expect(spinReels([["a"], []], [null, null], [false, false])).toEqual(["a", null]);
  });
});

describe("parseItems", () => {
  it("一行一個、去空白、去重複、略過空行", () => {
    expect(parseItems(" 琴酒 \n\n伏特加\r\n琴酒\n  ")).toEqual(["琴酒", "伏特加"]);
  });
  it("最多 30 項、每項最多 20 字", () => {
    const many = Array.from({ length: 50 }, (_, i) => `酒${i}`).join("\n");
    expect(parseItems(many)).toHaveLength(30);
    expect(parseItems("a".repeat(50))[0]).toHaveLength(20);
  });
});

describe("mergeNames", () => {
  it("合併並去重複", () => {
    expect(mergeNames(["琴通寧", "莫希托"], ["莫希托", " 鹹狗 ", ""])).toEqual(["琴通寧", "莫希托", "鹹狗"]);
  });
});

describe("comboName / comboToRecipeDraft", () => {
  it("用 + 連起來，略過空的轉輪", () => {
    expect(comboName(["琴酒", "通寧水", null])).toBe("琴酒 + 通寧水");
  });
  it("轉成酒譜草稿：認得的基酒會填進基酒欄", () => {
    expect(comboToRecipeDraft(["琴酒", "通寧水", "檸檬片"])).toEqual({
      name: "琴酒 + 通寧水 + 檸檬片",
      base_spirit: "琴酒",
      ingredients: [
        { name: "琴酒", amount: "" },
        { name: "通寧水", amount: "" },
        { name: "檸檬片", amount: "" },
      ],
    });
  });
  it("不認得的基酒 → 基酒欄留空", () => {
    expect(comboToRecipeDraft(["高粱", "可樂"]).base_spirit).toBe("");
  });
});

describe("loadReels", () => {
  it("沒有存過或格式壞掉 → 預設值", () => {
    expect(loadReels(null)).toEqual(DEFAULT_REELS);
    expect(loadReels("{oops")).toEqual(DEFAULT_REELS);
    expect(loadReels('[["a"]]')).toEqual(DEFAULT_REELS);
  });
  it("讀回自訂清單（允許某個轉輪是空的）", () => {
    const reels = loadReels(JSON.stringify([["高粱", "高粱", 5], ["養樂多"], []]));
    expect(reels.map((r) => r.items)).toEqual([["高粱"], ["養樂多"], []]);
    expect(reels.map((r) => r.label)).toEqual(["基酒", "軟飲", "加料"]);
  });
});
