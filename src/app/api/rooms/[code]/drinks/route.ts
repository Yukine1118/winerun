// POST /api/rooms/ABCD/drinks：房間裡任何人都可以把酒加到「本場酒單」
import { getAdminSupabase } from "@/lib/supabase/server";
import { ApiError, cleanText, findRoomByCode, handle, readJson, requirePlayer } from "@/lib/server/api";

const MAX_DRINKS = 100;

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/rooms/[code]/drinks">) => {
  const { code } = await ctx.params;
  const body = await readJson(req);
  const room = await findRoomByCode(code);
  await requirePlayer(room.id, body.playerId);

  const name = cleanText(body.name, 40);
  if (!name) throw new ApiError(400, "酒名要 1~40 字");
  const recipeId = typeof body.recipeId === "string" && body.recipeId ? body.recipeId : null;

  const db = getAdminSupabase();
  const { data: existing, error: listErr } = await db
    .from("room_drinks")
    .select("id, name")
    .eq("room_id", room.id);
  if (listErr) throw listErr;
  if (existing.some((d) => d.name === name)) throw new ApiError(409, "酒單裡已經有這款了");
  if (existing.length >= MAX_DRINKS) throw new ApiError(400, `酒單最多 ${MAX_DRINKS} 款`);

  const { data, error } = await db
    .from("room_drinks")
    .insert({ room_id: room.id, name, recipe_id: recipeId })
    .select()
    .single();
  if (error) throw error;
  return { drink: data };
});
