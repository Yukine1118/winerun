// POST /api/rooms：建立房間（建立者就是主持人）
import { getAdminSupabase } from "@/lib/supabase/server";
import { generateRoomCode, normalizeNickname } from "@/lib/roomCode";
import { ApiError, ROOM_LIFETIME_MS, handle, hashToken, newHostToken, readJson } from "@/lib/server/api";

export const POST = handle(async (req: Request) => {
  const body = await readJson(req);
  const nickname = normalizeNickname(body.nickname);
  if (!nickname) throw new ApiError(400, "請輸入 1~20 字的暱稱");

  const db = getAdminSupabase();
  const since = new Date(Date.now() - ROOM_LIFETIME_MS).toISOString();

  // 產生一個「最近 7 天沒人用過」的代碼（重複就再抽一次）
  let code = "";
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = generateRoomCode();
    const { count, error } = await db
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("code", candidate)
      .gte("created_at", since);
    if (error) throw error;
    if (!count) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new ApiError(503, "暫時無法產生房間代碼，請再試一次");

  const { data: room, error: roomErr } = await db
    .from("rooms")
    .insert({ code })
    .select()
    .single();
  if (roomErr) throw roomErr;

  const hostToken = newHostToken();
  const { error: secretErr } = await db
    .from("room_secrets")
    .insert({ room_id: room.id, host_token_hash: hashToken(hostToken) });
  if (secretErr) throw secretErr;

  const { data: player, error: playerErr } = await db
    .from("players")
    .insert({ room_id: room.id, nickname, is_host: true })
    .select()
    .single();
  if (playerErr) throw playerErr;

  return { code, roomId: room.id, playerId: player.id, hostToken };
});
