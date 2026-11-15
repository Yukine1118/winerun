// POST /api/rooms/ABCD/rounds/reveal：主持人公布結果
// 配對在這一刻才由伺服器產生並寫入，所以事前沒有人（包含主持人）能偷看。
import { getAdminSupabase } from "@/lib/supabase/server";
import { PairingError, generatePairing, validatePairing, type Pair } from "@/lib/pairing";
import { ApiError, getCurrentRound, handle, readJson, requireHost } from "@/lib/server/api";

export const POST = handle(
  async (req: Request, ctx: RouteContext<"/api/rooms/[code]/rounds/reveal">) => {
    const { code } = await ctx.params;
    const room = await requireHost(req, code);
    const body = await readJson(req);
    const allowRepeat = body.allowRepeat === true;
    const db = getAdminSupabase();

    const round = await getCurrentRound(room);
    if (!round) throw new ApiError(409, "還沒開始選酒");
    if (round.status === "revealed") throw new ApiError(409, "這一輪已經公布過了");

    const [teamsRes, choicesRes, historyRes] = await Promise.all([
      db.from("teams").select("id, name").eq("room_id", room.id).order("sort_order"),
      db.from("team_choices").select("team_id").eq("round_id", round.id),
      db.from("pairings").select("from_team_id, to_team_id").eq("room_id", room.id),
    ]);
    for (const r of [teamsRes, choicesRes, historyRes]) if (r.error) throw r.error;
    const teams = teamsRes.data!;

    const waiting = teams.filter((t) => !choicesRes.data!.some((c) => c.team_id === t.id));
    if (waiting.length > 0) {
      throw new ApiError(400, `還有組沒選好：${waiting.map((t) => t.name).join("、")}`);
    }

    const teamIds = teams.map((t) => t.id as string);
    const forbidden: Pair[] = allowRepeat
      ? []
      : historyRes.data!.map((p) => ({ from: p.from_team_id, to: p.to_team_id }));

    let pairs: Pair[];
    try {
      pairs = generatePairing(teamIds, { forbidden });
    } catch (err) {
      if (err instanceof PairingError) throw new ApiError(409, err.message, err.code);
      throw err;
    }
    // 雙重保險：寫入前再檢查一次規則
    const problems = validatePairing(teamIds, pairs, forbidden);
    if (problems.length > 0) throw new Error(`配對結果不合法：${problems.join("；")}`);

    const { error: pairErr } = await db.from("pairings").insert(
      pairs.map((p) => ({
        round_id: round.id,
        room_id: room.id,
        from_team_id: p.from,
        to_team_id: p.to,
      })),
    );
    // 23505 = 已經有資料了（例如連按兩次公布），當作已公布處理
    if (pairErr && pairErr.code !== "23505") throw pairErr;

    const { error: roundErr } = await db.from("rounds").update({ status: "revealed" }).eq("id", round.id);
    if (roundErr) throw roundErr;
    const { error: roomErr } = await db.from("rooms").update({ status: "revealed" }).eq("id", room.id);
    if (roomErr) throw roomErr;

    return { ok: true };
  },
);
