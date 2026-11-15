// 把資料庫的「輪次 / 選酒 / 配對」整理成畫面好用的形狀
import type { Pairing, Round, Team, TeamChoice } from "./types";

export interface RoundResult {
  from: Team;
  to: Team;
  drink: string;
  /** 這款酒有對應的酒譜時才有值 */
  recipeId: string | null;
}

export function roundResults(
  round: Round,
  teams: Team[],
  choices: TeamChoice[],
  pairings: Pairing[],
): RoundResult[] {
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const results: RoundResult[] = [];
  for (const p of pairings) {
    if (p.round_id !== round.id) continue;
    const from = teamById.get(p.from_team_id);
    const to = teamById.get(p.to_team_id);
    if (!from || !to) continue;
    const choice = choices.find((c) => c.round_id === round.id && c.team_id === from.id);
    results.push({
      from,
      to,
      drink: choice?.drink_name ?? "（沒有紀錄）",
      recipeId: choice?.recipe_id ?? null,
    });
  }
  return results.sort((a, b) => a.from.sort_order - b.from.sort_order);
}
