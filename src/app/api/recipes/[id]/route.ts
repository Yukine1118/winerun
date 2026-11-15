// PATCH  /api/recipes/<id>：修改酒譜
// DELETE /api/recipes/<id>：刪除酒譜（連同照片）
import { getAdminSupabase } from "@/lib/supabase/server";
import { RECIPE_PHOTO_BUCKET } from "@/lib/recipe";
import { ApiError, handle, readJson } from "@/lib/server/api";
import { photoPathFromUrl, requireRecipeInput } from "@/lib/server/recipes";

type Ctx = RouteContext<"/api/recipes/[id]">;

async function removePhoto(url: string | null) {
  const path = photoPathFromUrl(url);
  if (!path) return;
  // 照片刪不掉不影響主要操作，記錄一下就好
  const { error } = await getAdminSupabase().storage.from(RECIPE_PHOTO_BUCKET).remove([path]);
  if (error) console.error("刪除照片失敗", error);
}

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const input = requireRecipeInput(await readJson(req));
  const db = getAdminSupabase();

  const { data: before, error: findErr } = await db
    .from("recipes")
    .select("photo_url")
    .eq("id", id)
    .maybeSingle();
  if (findErr) throw findErr;
  if (!before) throw new ApiError(404, "找不到這份酒譜");

  // 建立者保持原樣，不因為別人編輯而改變
  const { created_by: _ignored, ...changes } = input;
  void _ignored;
  const { data, error } = await db.from("recipes").update(changes).eq("id", id).select().single();
  if (error) throw error;

  if (before.photo_url && before.photo_url !== input.photo_url) await removePhoto(before.photo_url);
  return { recipe: data };
});

export const DELETE = handle(async (_req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const db = getAdminSupabase();
  const { data, error } = await db.from("recipes").delete().eq("id", id).select("photo_url");
  if (error) throw error;
  if (data.length === 0) throw new ApiError(404, "找不到這份酒譜");
  await removePhoto(data[0].photo_url);
  return { ok: true };
});
