// POST /api/rooms/ABCD/players/<id>/team：主持人把某個人移到某一組（teamId 為 null = 未分組）
import { getAdminSupabase } from "@/lib/supabase/server";
import { ApiError, handle, readJson, requireHost } from "@/lib/server/api";

export const POST = handle(
  async (req: Request, ctx: RouteContext<"/api/rooms/[code]/players/[playerId]/team">) => {
    const { code, playerId } = await ctx.params;
    const room = await requireHost(req, code);
    const body = await readJson(req);
    const teamId = typeof body.teamId === "string" && body.teamId ? body.teamId : null;
    const db = getAdminSupabase();

    if (teamId) {
      const { data: team, error } = await db
        .from("teams")
        .select("id")
        .eq("id", teamId)
        .eq("room_id", room.id)
        .maybeSingle();
      if (error) throw error;
      if (!team) throw new ApiError(404, "找不到這一組");
    }

    const { data, error } = await db
      .from("players")
      .update({ team_id: teamId })
      .eq("id", playerId)
      .eq("room_id", room.id)
      .select();
    if (error) throw error;
    if (data.length === 0) throw new ApiError(404, "找不到這位成員");
    return { ok: true };
  },
);
