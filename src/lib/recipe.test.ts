import { describe, expect, it } from "vitest";
import { filterRecipes, parseRecipeInput, usedBaseSpirits } from "./recipe";
import type { Recipe } from "./types";

const PREFIX = "https://x.supabase.co/storage/v1/object/public/recipe-photos/";

const recipe = (over: Partial<Recipe>): Recipe => ({
  id: over.name ?? "id",
  name: "琴通寧",
  base_spirit: "琴酒",
  ingredients: [
    { name: "琴酒", amount: "45ml" },
    { name: "通寧水", amount: "適量" },
  ],
  steps: "",
  notes: "",
  photo_url: null,
  created_by: "",
  created_at: "",
  ...over,
});

describe("parseRecipeInput", () => {
  it("整理正常的輸入：去空白、略過空白材料列", () => {
    const result = parseRecipeInput(
      {
        name: "  琴通寧 ",
        base_spirit: "琴酒",
        ingredients: [
          { name: " 琴酒 ", amount: " 45ml " },
          { name: "", amount: "" },
          { name: "通寧水" },
        ],
        steps: "倒在一起",
        photo_url: PREFIX + "a.jpg",
        created_by: "小明",
      },
      PREFIX,
    );
    expect(result).toEqual({
      ok: true,
      value: {
        name: "琴通寧",
        base_spirit: "琴酒",
        ingredients: [
          { name: "琴酒", amount: "45ml" },
          { name: "通寧水", amount: "" },
        ],
        steps: "倒在一起",
        notes: "",
        photo_url: PREFIX + "a.jpg",
        created_by: "小明",
      },
    });
  });

  it("只有名稱也可以", () => {
    const result = parseRecipeInput({ name: "神秘特調" }, PREFIX);
    expect(result.ok).toBe(true);
  });

  it("擋下不合格的輸入", () => {
    const bad = (body: Record<string, unknown>) => {
      const r = parseRecipeInput(body, PREFIX);
      return r.ok ? null : r.error;
    };
    expect(bad({})).toContain("名稱");
    expect(bad({ name: "a".repeat(41) })).toContain("名稱");
    expect(bad({ name: "a", ingredients: [{ name: "", amount: "30ml" }] })).toContain("材料");
    expect(bad({ name: "a", steps: "x".repeat(2001) })).toContain("做法");
    expect(bad({ name: "a", photo_url: "https://evil.example/a.jpg" })).toContain("照片");
    expect(
      bad({ name: "a", ingredients: Array.from({ length: 21 }, (_, i) => ({ name: `m${i}` })) }),
    ).toContain("20 項");
  });
});

describe("filterRecipes", () => {
  const all = [
    recipe({ name: "琴通寧" }),
    recipe({ name: "Mojito", base_spirit: "蘭姆酒", ingredients: [{ name: "薄荷", amount: "" }] }),
    recipe({ name: "螺絲起子", base_spirit: "伏特加", ingredients: [{ name: "柳橙汁", amount: "" }] }),
  ];
  const names = (rs: Recipe[]) => rs.map((r) => r.name);

  it("沒有條件 → 全部", () => {
    expect(filterRecipes(all, "", "")).toHaveLength(3);
  });
  it("搜尋名稱（不分大小寫）", () => {
    expect(names(filterRecipes(all, "moj", ""))).toEqual(["Mojito"]);
  });
  it("搜尋材料", () => {
    expect(names(filterRecipes(all, "柳橙", ""))).toEqual(["螺絲起子"]);
  });
  it("依基酒篩選，可以和搜尋一起用", () => {
    expect(names(filterRecipes(all, "", "蘭姆酒"))).toEqual(["Mojito"]);
    expect(filterRecipes(all, "琴", "蘭姆酒")).toEqual([]);
  });
});

describe("usedBaseSpirits", () => {
  it("不重複、依選單順序、略過空白", () => {
    const list = [
      recipe({ base_spirit: "伏特加" }),
      recipe({ base_spirit: "" }),
      recipe({ base_spirit: "琴酒" }),
      recipe({ base_spirit: "伏特加" }),
    ];
    expect(usedBaseSpirits(list)).toEqual(["琴酒", "伏特加"]);
  });
});
