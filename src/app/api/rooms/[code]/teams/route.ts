// POST /api/rooms/ABCD/teams：主持人新增一組
import { getAdminSupabase } from "@/lib/supabase/server";
import { MAX_TEAMS, defaultTeamName, normalizeTeamName } from "@/lib/grouping";
import { ApiError, handle, readJson, requireHost } from "@/lib/server/api";



export const POST = handle(async (req: Request, ctx: RouteContext<"/api/rooms/[code]/teams">) => {
  const { code } = await ctx.params;
  const room = await requireHost(req, code);
  const body = await readJson(req);
  const db = getAdminSupabase();

  const { data: teams, error: listErr } = await db
    .from("teams")
    .select("sort_order")
    .eq("room_id", room.id);
  if (listErr) throw listErr;
  if (teams.length >= MAX_TEAMS) throw new ApiError(400, `最多 ${MAX_TEAMS} 組`);

  const nextOrder = teams.reduce((max, t) => Math.max(max, t.sort_order + 1), 0);
  const name = normalizeTeamName(body.name) ?? defaultTeamName(nextOrder);

  const { data, error } = await db
    .from("teams")
    .insert({ room_id: room.id, name, sort_order: nextOrder })
    .select()
    .single();
  if (error) throw error;
  return { team: data };
});
