import { describe, expect, it } from "vitest";
import { PairingError, generatePairing, validatePairing, type Pair } from "./pairing";

const teams = (n: number) => Array.from({ length: n }, (_, i) => `T${i + 1}`);

function errorCode(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (err) {
    return err instanceof PairingError ? err.code : "OTHER";
  }
  return undefined;
}

describe("generatePairing：基本規則", () => {
  for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20]) {
    it(`${n} 組跑 1000 次，從不違反規則`, () => {
      const ids = teams(n);
      for (let run = 0; run < 1000; run++) {
        const pairs = generatePairing(ids);
        expect(validatePairing(ids, pairs)).toEqual([]);
      }
    });
  }

  it("回傳順序和輸入的組別順序一致", () => {
    const ids = teams(6);
    expect(generatePairing(ids).map((p) => p.from)).toEqual(ids);
  });
});

describe("generatePairing：邊界情況", () => {
  it("0 組或 1 組 → 無法配對", () => {
    expect(errorCode(() => generatePairing([]))).toBe("TOO_FEW_TEAMS");
    expect(errorCode(() => generatePairing(["A"]))).toBe("TOO_FEW_TEAMS");
    expect(() => generatePairing(["A"])).toThrow("至少需要 2 組");
  });

  it("2 組 → 一定是互換", () => {
    for (let run = 0; run < 100; run++) {
      expect(generatePairing(["A", "B"])).toEqual([
        { from: "A", to: "B" },
        { from: "B", to: "A" },
      ]);
    }
  });

  it("組別重複 → 報錯", () => {
    expect(errorCode(() => generatePairing(["A", "B", "A"]))).toBe("DUPLICATE_TEAM");
  });
});

describe("generatePairing：公平性", () => {
  it("4 組的 9 種合法結果都會出現，而且機率差不多", () => {
    const counts = new Map<string, number>();
    const runs = 9000;
    for (let run = 0; run < runs; run++) {
      const key = generatePairing(teams(4))
        .map((p) => p.to)
        .join(",");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    expect(counts.size).toBe(9);
    // 理論上每種約 1000 次；允許 ±25% 的誤差
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(750);
      expect(count).toBeLessThan(1250);
    }
  });

  it("3 組的 2 種結果（順時針、逆時針）都會出現", () => {
    const seen = new Set<string>();
    for (let run = 0; run < 200; run++) {
      seen.add(
        generatePairing(teams(3))
          .map((p) => p.to)
          .join(","),
      );
    }
    expect(seen.size).toBe(2);
  });
});

describe("generatePairing：多輪模式（同一對不重複）", () => {
  for (const n of [2, 3, 4, 5, 6, 8, 10, 12]) {
    it(`${n} 組可以連玩 ${n - 1} 輪都不重複，第 ${n} 輪回報無解（重複 30 次）`, () => {
      const ids = teams(n);
      for (let run = 0; run < 30; run++) {
        const history: Pair[] = [];
        for (let round = 1; round <= n - 1; round++) {
          const pairs = generatePairing(ids, { forbidden: history });
          expect(validatePairing(ids, pairs, history)).toEqual([]);
          history.push(...pairs);
        }
        // 每一組都已經送給過其他所有組 → 不可能再有新的配法
        expect(errorCode(() => generatePairing(ids, { forbidden: history }))).toBe("NO_SOLUTION");
      }
    });
  }

  it("無解時的訊息會說明最多能玩幾輪", () => {
    const history = generatePairing(["A", "B"]);
    expect(() => generatePairing(["A", "B"], { forbidden: history })).toThrow("最多只能玩 1 輪");
  });

  it("限制很多、只剩唯一解時也找得到", () => {
    // 5 組，只允許 Ti → T(i+1)（繞一圈），其他全部禁止
    const ids = teams(5);
    const forbidden: Pair[] = [];
    ids.forEach((from, i) => {
      ids.forEach((to, j) => {
        if (i !== j && j !== (i + 1) % 5) forbidden.push({ from, to });
      });
    });
    for (let run = 0; run < 50; run++) {
      const pairs = generatePairing(ids, { forbidden });
      expect(pairs.map((p) => p.to)).toEqual(["T2", "T3", "T4", "T5", "T1"]);
    }
  });

  it("歷史紀錄裡有已經不存在的組也不影響", () => {
    const ids = teams(3);
    const forbidden = [{ from: "OLD", to: "T1" }];
    expect(validatePairing(ids, generatePairing(ids, { forbidden }), forbidden)).toEqual([]);
  });
});

describe("validatePairing：真的抓得到違規", () => {
  const ids = ["A", "B", "C"];
  it("抽到自己", () => {
    const bad = [
      { from: "A", to: "A" },
      { from: "B", to: "C" },
      { from: "C", to: "B" },
    ];
    expect(validatePairing(ids, bad).join()).toContain("抽到自己");
  });
  it("重複收到", () => {
    const bad = [
      { from: "A", to: "B" },
      { from: "B", to: "A" },
      { from: "C", to: "A" },
    ];
    expect(validatePairing(ids, bad).length).toBeGreaterThan(0);
  });
  it("和之前重複", () => {
    const ok = [
      { from: "A", to: "B" },
      { from: "B", to: "C" },
      { from: "C", to: "A" },
    ];
    expect(validatePairing(ids, ok)).toEqual([]);
    expect(validatePairing(ids, ok, [{ from: "A", to: "B" }]).join()).toContain("重複");
  });
});
