import { Card } from "@/components/ui";
import type { RoomSnapshot } from "@/hooks/useRoomRealtime";
import { roundResults } from "@/lib/roundView";

/** 之前幾輪的結果（點開才顯示） */
export function PastRounds({ snapshot, exceptRoundId }: { snapshot: RoomSnapshot; exceptRoundId?: string }) {
  const past = snapshot.rounds
    .filter((r) => r.status === "revealed" && r.id !== exceptRoundId)
    .sort((a, b) => b.round_no - a.round_no);
  if (past.length === 0) return null;

  return (
    <Card>
      <h3 className="mb-2 font-bold">之前的結果</h3>
      {past.map((round) => (
        <details key={round.id} className="border-t border-zinc-800 py-2">
          <summary className="cursor-pointer text-sm text-zinc-300">第 {round.round_no} 輪</summary>
          <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-400">
            {roundResults(round, snapshot.teams, snapshot.choices, snapshot.pairings).map((r) => (
              <li key={r.from.id}>
                {r.from.name} 的「{r.drink}」→ <b className="text-zinc-200">{r.to.name}</b>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </Card>
  );
}
