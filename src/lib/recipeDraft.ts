// 酒譜草稿：從別的頁面（例如拉霸機）帶內容到「新增酒譜」表單。
// 存在 sessionStorage（只在這個分頁有效），讀一次就清掉。
import type { Ingredient } from "./types";

export interface RecipeDraftData {
  name?: string;
  base_spirit?: string;
  ingredients?: Ingredient[];
}

const KEY = "winerun:recipeDraft";

export function saveRecipeDraft(draft: RecipeDraftData) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* 無法儲存就當作沒有草稿 */
  }
}

export function takeRecipeDraft(): RecipeDraftData | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    return JSON.parse(raw) as RecipeDraftData;
  } catch {
    return null;
  }
}
