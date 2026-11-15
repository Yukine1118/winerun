// POST /api/rooms/ABCD/rounds/cancel：主持人回到分組畫面
// 如果這一輪還在選酒（沒公布），就把這一輪取消掉；已公布的輪次會保留在紀錄裡。
import { getAdminSupabase } from "@/lib/supabase/server";
import { getCurrentRound, handle, requireHost } from "@/lib/server/api";

export const POST = handle(
  async (req: Request, ctx: RouteContext<"/api/rooms/[code]/rounds/cancel">) => {
    const { code } = await ctx.params;
    const room = await requireHost(req, code);
    const db = getAdminSupabase();

    const round = await getCurrentRound(room);
    let currentRound = room.current_round;
    if (round?.status === "choosing") {
      const { error } = await db.from("rounds").delete().eq("id", round.id);
      if (error) throw error;
      currentRound -= 1;
    }

    const { error } = await db
      .from("rooms")
      .update({ status: "lobby", current_round: currentRound })
      .eq("id", room.id);
    if (error) throw error;
    return { ok: true };
  },
);
