// 酒譜的純邏輯：檢查輸入、搜尋與篩選
import type { Ingredient, Recipe } from "./types";

/** 基酒選單（表單下拉用；資料庫存的是文字，所以之後要加新的很容易） */
export const BASE_SPIRITS = [
  "琴酒",
  "伏特加",
  "蘭姆酒",
  "龍舌蘭",
  "威士忌",
  "白蘭地",
  "利口酒",
  "啤酒",
  "葡萄酒",
  "清酒／燒酎",
  "無酒精",
  "其他",
] as const;

export const RECIPE_PHOTO_BUCKET = "recipe-photos";

export interface RecipeInput {
  name: string;
  base_spirit: string;
  ingredients: Ingredient[];
  steps: string;
  notes: string;
  photo_url: string | null;
  created_by: string;
}

type ParseResult = { ok: true; value: RecipeInput } | { ok: false; error: string };

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/**
 * 檢查並整理使用者送來的酒譜。
 * photoUrlPrefix：照片網址必須以這個開頭（只接受我們自己 Storage 裡的照片）。
 */
export function parseRecipeInput(body: Record<string, unknown>, photoUrlPrefix: string): ParseResult {
  const name = text(body.name);
  if (name.length < 1 || name.length > 40) return { ok: false, error: "名稱要 1~40 字" };

  const base_spirit = text(body.base_spirit);
  if (base_spirit.length > 20) return { ok: false, error: "基酒最多 20 字" };

  const rawIngredients = Array.isArray(body.ingredients) ? body.ingredients : [];
  const ingredients: Ingredient[] = [];
  for (const raw of rawIngredients) {
    const item = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    const ingName = text(item.name);
    const amount = text(item.amount);
    if (!ingName && !amount) continue; // 空白列直接略過
    if (!ingName) return { ok: false, error: "有材料只填了份量、沒填名稱" };
    if (ingName.length > 30) return { ok: false, error: "材料名稱最多 30 字" };
    if (amount.length > 20) return { ok: false, error: "份量最多 20 字" };
    ingredients.push({ name: ingName, amount });
  }
  if (ingredients.length > 20) return { ok: false, error: "材料最多 20 項" };

  const steps = text(body.steps);
  if (steps.length > 2000) return { ok: false, error: "做法最多 2000 字" };
  const notes = text(body.notes);
  if (notes.length > 500) return { ok: false, error: "備註最多 500 字" };
  const created_by = text(body.created_by).slice(0, 20);

  let photo_url: string | null = null;
  if (typeof body.photo_url === "string" && body.photo_url) {
    if (!body.photo_url.startsWith(photoUrlPrefix)) return { ok: false, error: "照片網址不正確" };
    photo_url = body.photo_url;
  }

  return { ok: true, value: { name, base_spirit, ingredients, steps, notes, photo_url, created_by } };
}

/** 搜尋（名稱、基酒、材料）＋ 依基酒篩選。query 不分大小寫；base 為空字串代表全部。 */
export function filterRecipes(recipes: readonly Recipe[], query: string, base: string): Recipe[] {
  const q = query.trim().toLowerCase();
  return recipes.filter((r) => {
    if (base && r.base_spirit !== base) return false;
    if (!q) return true;
    const haystack = [r.name, r.base_spirit, ...r.ingredients.map((i) => i.name)]
      .join("\n")
      .toLowerCase();
    return haystack.includes(q);
  });
}

/** 目前酒譜裡出現過的基酒（依選單順序排，自訂的排後面） */
export function usedBaseSpirits(recipes: readonly Recipe[]): string[] {
  const used = [...new Set(recipes.map((r) => r.base_spirit).filter(Boolean))];
  const order = (s: string) => {
    const i = (BASE_SPIRITS as readonly string[]).indexOf(s);
    return i === -1 ? BASE_SPIRITS.length : i;
  };
  return used.sort((a, b) => order(a) - order(b) || a.localeCompare(b));
}
