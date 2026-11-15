// 拉霸機的純邏輯：抽選、鎖定、自訂清單
import { BASE_SPIRITS } from "./recipe";
import type { Ingredient } from "./types";

export interface ReelConfig {
  label: string;
  items: string[];
}

/** 進階版的預設轉輪（每個人可以在自己手機上改） */
export const DEFAULT_REELS: ReelConfig[] = [
  { label: "基酒", items: ["琴酒", "伏特加", "蘭姆酒", "龍舌蘭", "威士忌", "白蘭地", "燒酎", "梅酒"] },
  {
    label: "軟飲",
    items: [
      "通寧水", "可樂", "雪碧", "蘇打水", "柳橙汁", "蔓越莓汁",
      "薑汁汽水", "綠茶", "烏龍茶", "可爾必思", "蘋果汁", "能量飲料",
    ],
  },
  { label: "加料", items: ["檸檬片", "萊姆角", "薄荷葉", "鹽口杯", "蜂蜜", "話梅", "冰塊加滿", "什麼都不加"] },
];

/** 酒單和酒譜都還是空的時候，基本版先用這些經典調酒 */
export const CLASSIC_DRINKS = [
  "琴通寧", "螺絲起子", "自由古巴", "莫希托", "龍舌蘭日出", "威士忌可樂",
  "長島冰茶", "鹹狗", "柯夢波丹", "瑪格麗特", "Highball", "深水炸彈",
];

export const MAX_REEL_ITEMS = 30;
export const MAX_ITEM_LENGTH = 20;

export function pickRandom<T>(items: readonly T[], random: () => number = Math.random): T {
  if (items.length === 0) throw new Error("清單是空的，沒有東西可以抽");
  return items[Math.floor(random() * items.length)];
}

/**
 * 轉一次：沒鎖定的轉輪重新抽，鎖定的保持原樣。
 * 還沒有結果（null）的轉輪就算鎖定也會抽；清單是空的轉輪結果是 null。
 */
export function spinReels(
  reels: readonly (readonly string[])[],
  current: readonly (string | null)[],
  locked: readonly boolean[],
  random: () => number = Math.random,
): (string | null)[] {
  return reels.map((items, i) => {
    if (items.length === 0) return null;
    const previous = current[i] ?? null;
    if (locked[i] && previous !== null && items.includes(previous)) return previous;
    return pickRandom(items, random);
  });
}

/** 把「一行一個」的文字整理成清單：去空白、去重複、限制長度與數量 */
export function parseItems(text: string): string[] {
  const seen = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const item = line.trim().slice(0, MAX_ITEM_LENGTH);
    if (item) seen.add(item);
    if (seen.size >= MAX_REEL_ITEMS) break;
  }
  return [...seen];
}

/** 合併多個來源的酒名，去掉重複（保留第一次出現的順序） */
export function mergeNames(...lists: readonly (readonly string[])[]): string[] {
  return [...new Set(lists.flat().map((n) => n.trim()).filter(Boolean))];
}

/** 「琴酒 + 通寧水 + 檸檬片」 */
export function comboName(values: readonly (string | null)[]): string {
  return values.filter((v): v is string => Boolean(v)).join(" + ");
}

/** 把抽到的組合轉成酒譜草稿（第一個轉輪當基酒） */
export function comboToRecipeDraft(values: readonly (string | null)[]): {
  name: string;
  base_spirit: string;
  ingredients: Ingredient[];
} {
  const parts = values.filter((v): v is string => Boolean(v));
  const first = values[0] ?? "";
  return {
    name: comboName(values).slice(0, 40),
    base_spirit: (BASE_SPIRITS as readonly string[]).includes(first) ? first : "",
    ingredients: parts.map((name) => ({ name, amount: "" })),
  };
}

/** 讀取存在手機裡的自訂轉輪；格式不對就用預設值 */
export function loadReels(raw: string | null): ReelConfig[] {
  if (!raw) return DEFAULT_REELS;
  try {
    const saved = JSON.parse(raw) as unknown;
    if (!Array.isArray(saved) || saved.length !== DEFAULT_REELS.length) return DEFAULT_REELS;
    return DEFAULT_REELS.map((reel, i) => ({
      label: reel.label,
      items: Array.isArray(saved[i])
        ? parseItems(saved[i].filter((x: unknown) => typeof x === "string").join("\n"))
        : reel.items,
    }));
  } catch {
    return DEFAULT_REELS;
  }
}
