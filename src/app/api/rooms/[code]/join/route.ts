// POST /api/rooms/ABCD/join：朋友用代碼加入房間
import { getAdminSupabase } from "@/lib/supabase/server";
import { normalizeNickname } from "@/lib/roomCode";
import { ApiError, findRoomByCode, handle, readJson } from "@/lib/server/api";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/rooms/[code]/join">) => {
  const { code } = await ctx.params;
  const body = await readJson(req);
  const nickname = normalizeNickname(body.nickname);
  if (!nickname) throw new ApiError(400, "請輸入 1~20 字的暱稱");

  const room = await findRoomByCode(code);
  const db = getAdminSupabase();

  // 同一個房間不能有兩個一樣的暱稱，避免大家搞混
  const { data: same, error: sameErr } = await db
    .from("players")
    .select("id")
    .eq("room_id", room.id)
    .eq("nickname", nickname)
    .limit(1);
  if (sameErr) throw sameErr;
  if (same && same.length > 0) throw new ApiError(409, "這個暱稱已經有人用了，換一個吧");

  const { data: player, error } = await db
    .from("players")
    .insert({ room_id: room.id, nickname })
    .select()
    .single();
  if (error) throw error;

  return { code: room.code, roomId: room.id, playerId: player.id };
});
