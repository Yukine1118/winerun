// 酒譜 API 共用（只在伺服器端執行）
import { RECIPE_PHOTO_BUCKET, parseRecipeInput, type RecipeInput } from "@/lib/recipe";
import { ApiError } from "./api";

/** 我們自己 Storage 裡公開照片的網址開頭 */
export function photoUrlPrefix(): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${RECIPE_PHOTO_BUCKET}/`;
}

export function requireRecipeInput(body: Record<string, unknown>): RecipeInput {
  const result = parseRecipeInput(body, photoUrlPrefix());
  if (!result.ok) throw new ApiError(400, result.error);
  return result.value;
}

/** 從照片網址取出它在 bucket 裡的檔名（不是我們的照片就回傳 null） */
export function photoPathFromUrl(url: string | null): string | null {
  const prefix = photoUrlPrefix();
  if (!url || !url.startsWith(prefix)) return null;
  const path = url.slice(prefix.length);
  return /^[\w.-]+$/.test(path) ? path : null;
}
