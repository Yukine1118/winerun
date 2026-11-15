// POST /api/rooms/ABCD/choice：組員替自己的組選酒（同組任何人都可以選、可以改）
import { getAdminSupabase } from "@/lib/supabase/server";
import {
  ApiError,
  cleanText,
  findRoomByCode,
  getCurrentRound,
  handle,
  readJson,
  requirePlayer,
} from "@/lib/server/api";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/rooms/[code]/choice">) => {
  const { code } = await ctx.params;
  const body = await readJson(req);
  const room = await findRoomByCode(code);
  const player = await requirePlayer(room.id, body.playerId);
  if (!player.team_id) throw new ApiError(400, "你還沒被分到任何一組");

  const drinkName = cleanText(body.drinkName, 40);
  if (!drinkName) throw new ApiError(400, "酒名要 1~40 字");
  const recipeId = typeof body.recipeId === "string" && body.recipeId ? body.recipeId : null;

  const round = await getCurrentRound(room);
  if (!round || round.status !== "choosing") throw new ApiError(409, "現在不是選酒時間");

  const { error } = await getAdminSupabase()
    .from("team_choices")
    .upsert(
      {
        round_id: round.id,
        team_id: player.team_id,
        room_id: room.id,
        drink_name: drinkName,
        recipe_id: recipeId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "round_id,team_id" },
    );
  if (error) throw error;
  return { ok: true };
});
