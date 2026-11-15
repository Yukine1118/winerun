// POST /api/rooms/ABCD/teams/random：主持人一鍵隨機分組（會取代目前的分組）
import { getAdminSupabase } from "@/lib/supabase/server";
import { MAX_TEAMS, defaultTeamName, randomGroups } from "@/lib/grouping";
import { ApiError, handle, readJson, requireHost, requireLobby } from "@/lib/server/api";

export const POST = handle(
  async (req: Request, ctx: RouteContext<"/api/rooms/[code]/teams/random">) => {
    const { code } = await ctx.params;
    const room = await requireHost(req, code);
    requireLobby(room);
    const body = await readJson(req);
    const teamCount = Number(body.teamCount);
    if (!Number.isInteger(teamCount) || teamCount < 2 || teamCount > MAX_TEAMS) {
      throw new ApiError(400, `組數要在 2 到 ${MAX_TEAMS} 之間`);
    }

    const db = getAdminSupabase();
    const { data: players, error: playersErr } = await db
      .from("players")
      .select("id")
      .eq("room_id", room.id);
    if (playersErr) throw playersErr;
    if (players.length < teamCount) {
      throw new ApiError(400, `目前只有 ${players.length} 人，分不了 ${teamCount} 組`);
    }

    const groups = randomGroups(
      players.map((p) => p.id as string),
      teamCount,
    );

    // 1. 清掉舊的組（組員會自動變回未分組）
    const { error: delErr } = await db.from("teams").delete().eq("room_id", room.id);
    if (delErr) throw delErr;

    // 2. 建立新的組
    const { data: teams, error: insErr } = await db
      .from("teams")
      .insert(
        groups.map((_, i) => ({ room_id: room.id, name: defaultTeamName(i), sort_order: i })),
      )
      .select();
    if (insErr) throw insErr;
    const ordered = [...teams].sort((a, b) => a.sort_order - b.sort_order);

    // 3. 把每個人放進抽到的組
    const results = await Promise.all(
      groups.map((ids, i) =>
        db.from("players").update({ team_id: ordered[i].id }).in("id", ids).eq("room_id", room.id),
      ),
    );
    for (const r of results) if (r.error) throw r.error;

    return { ok: true };
  },
);
