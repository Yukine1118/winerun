// POST /api/rooms/ABCD/rounds：主持人開始新的一輪選酒
import { getAdminSupabase } from "@/lib/supabase/server";
import { ApiError, getCurrentRound, handle, requireHost } from "@/lib/server/api";

export const POST = handle(async (req: Request, ctx: RouteContext<"/api/rooms/[code]/rounds">) => {
  const { code } = await ctx.params;
  const room = await requireHost(req, code);
  const db = getAdminSupabase();

  const current = await getCurrentRound(room);
  if (current?.status === "choosing") throw new ApiError(409, "這一輪還沒公布結果");

  const [{ data: teams, error: teamsErr }, { data: players, error: playersErr }] = await Promise.all([
    db.from("teams").select("id, name").eq("room_id", room.id),
    db.from("players").select("team_id").eq("room_id", room.id),
  ]);
  if (teamsErr) throw teamsErr;
  if (playersErr) throw playersErr;

  if (teams.length < 2) throw new ApiError(400, "至少需要 2 組才能配對，請先分組");
  const empty = teams.filter((t) => !players.some((p) => p.team_id === t.id));
  if (empty.length > 0) {
    throw new ApiError(400, `「${empty.map((t) => t.name).join("、")}」沒有成員，請先刪除或加人`);
  }

  const roundNo = room.current_round + 1;
  const { error: roundErr } = await db.from("rounds").insert({ room_id: room.id, round_no: roundNo });
  if (roundErr) throw roundErr;

  const { error: roomErr } = await db
    .from("rooms")
    .update({ status: "choosing", current_round: roundNo })
    .eq("id", room.id);
  if (roomErr) throw roomErr;

  return { roundNo };
});
