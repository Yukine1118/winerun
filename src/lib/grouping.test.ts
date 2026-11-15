import { describe, expect, it } from "vitest";
import { normalizeTeamName, randomGroups, shuffle } from "./grouping";

const people = (n: number) => Array.from({ length: n }, (_, i) => `p${i}`);

describe("randomGroups", () => {
  it("每個人恰好被分到一組，各組人數最多差 1（跑 1000 次）", () => {
    for (let run = 0; run < 1000; run++) {
      const n = 1 + Math.floor(Math.random() * 30);
      const teamCount = 1 + Math.floor(Math.random() * n);
      const groups = randomGroups(people(n), teamCount);

      expect(groups).toHaveLength(teamCount);
      expect(groups.flat().sort()).toEqual(people(n).sort());
      const sizes = groups.map((g) => g.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    }
  });

  it("組數不合理時報錯", () => {
    expect(() => randomGroups(people(3), 0)).toThrow();
    expect(() => randomGroups(people(3), 4)).toThrow("組數不能超過人數");
    expect(() => randomGroups(people(3), 1.5)).toThrow();
  });

  it("結果真的有隨機（10 人分 2 組，跑 50 次不會每次都一樣）", () => {
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      results.add(JSON.stringify(randomGroups(people(10), 2).map((g) => [...g].sort())));
    }
    expect(results.size).toBeGreaterThan(1);
  });
});

describe("shuffle", () => {
  it("不改動原陣列，元素不增不減", () => {
    const original = people(20);
    const copy = [...original];
    const shuffled = shuffle(original);
    expect(original).toEqual(copy);
    expect([...shuffled].sort()).toEqual([...original].sort());
  });
});

describe("normalizeTeamName", () => {
  it("接受 1~20 字", () => {
    expect(normalizeTeamName(" 酒鬼隊 ")).toBe("酒鬼隊");
    expect(normalizeTeamName("  ")).toBeNull();
    expect(normalizeTeamName("a".repeat(21))).toBeNull();
    expect(normalizeTeamName(null)).toBeNull();
  });
});
