// DELETE /api/rooms/ABCD/drinks/<id>：主持人把一款酒從本場酒單移除
import { getAdminSupabase } from "@/lib/supabase/server";
import { handle, requireHost } from "@/lib/server/api";

export const DELETE = handle(
  async (req: Request, ctx: RouteContext<"/api/rooms/[code]/drinks/[drinkId]">) => {
    const { code, drinkId } = await ctx.params;
    const room = await requireHost(req, code);
    const { error } = await getAdminSupabase()
      .from("room_drinks")
      .delete()
      .eq("id", drinkId)
      .eq("room_id", room.id);
    if (error) throw error;
    return { ok: true };
  },
);
