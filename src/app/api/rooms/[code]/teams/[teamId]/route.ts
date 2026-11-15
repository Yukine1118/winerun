// PATCH  /api/rooms/ABCD/teams/<id>：主持人改組名
// DELETE /api/rooms/ABCD/teams/<id>：主持人刪除一組（組員變回「未分組」）
import { getAdminSupabase } from "@/lib/supabase/server";
import { normalizeTeamName } from "@/lib/grouping";
import { ApiError, handle, readJson, requireHost, requireLobby } from "@/lib/server/api";

type Ctx = RouteContext<"/api/rooms/[code]/teams/[teamId]">;

export const PATCH = handle(async (req: Request, ctx: Ctx) => {
  const { code, teamId } = await ctx.params;
  const room = await requireHost(req, code);
  const body = await readJson(req);
  const name = normalizeTeamName(body.name);
  if (!name) throw new ApiError(400, "組名要 1~20 字");

  const { data, error } = await getAdminSupabase()
    .from("teams")
    .update({ name })
    .eq("id", teamId)
    .eq("room_id", room.id)
    .select();
  if (error) throw error;
  if (data.length === 0) throw new ApiError(404, "找不到這一組");
  return { team: data[0] };
});

export const DELETE = handle(async (req: Request, ctx: Ctx) => {
  const { code, teamId } = await ctx.params;
  const room = await requireHost(req, code);
  requireLobby(room);
  const { error } = await getAdminSupabase()
    .from("teams")
    .delete()
    .eq("id", teamId)
    .eq("room_id", room.id);
  if (error) throw error;
  return { ok: true };
});
