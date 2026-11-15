"use client";

import { Button, Card, ErrorText } from "@/components/ui";
import type { RoomSnapshot } from "@/hooks/useRoomRealtime";
import { useAction } from "@/hooks/useAction";
import { callApi } from "@/lib/apiClient";
import { roundResults } from "@/lib/roundView";
import type { Player, Round } from "@/lib/types";
import { PastRounds } from "./PastRounds";

interface Props {
  code: string;
  snapshot: RoomSnapshot;
  round: Round;
  me: Player;
  hostToken?: string;
  onChanged: () => void;
}

const STEP_SECONDS = 0.7;

export function ResultPanel({ code, snapshot, round, me, hostToken, onChanged }: Props) {
  const isHost = Boolean(hostToken);
  const results = roundResults(round, snapshot.teams, snapshot.choices, snapshot.pairings);
  const incoming = results.find((r) => r.to.id === me.team_id); // 我們要喝的
  const outgoing = results.find((r) => r.from.id === me.team_id); // 我們送出去的
  const { busy, error, run } = useAction(onChanged);
  const base = `/api/rooms/${code}`;

  return (
    <>
      <Card className="text-center">
        <div className="text-sm text-zinc-400">第 {round.round_no} 輪</div>
        <h2 className="text-2xl font-black text-amber-400">🎉 結果公布</h2>
      </Card>

      {/* key 帶輪次：每一輪公布時動畫都會重新播放 */}
      <ul key={round.id} className="flex flex-col gap-2">
        {results.map((r, i) => {
          const mine = r.to.id === me.team_id || r.from.id === me.team_id;
          return (
            <li
              key={r.from.id}
              className={`reveal-item rounded-2xl border p-3 ${
                mine ? "border-amber-400/60 bg-amber-400/10" : "border-zinc-800 bg-zinc-900/80"
              }`}
              style={{ animationDelay: `${i * STEP_SECONDS}s` }}
            >
              <div className="text-sm text-zinc-400">{r.from.name} 準備的</div>
              <div className="text-lg font-bold">「{r.drink}」</div>
              <div className="text-sm">
                送給 👉 <b className="text-amber-300">{r.to.name}</b>
              </div>
            </li>
          );
        })}
      </ul>

      {incoming && outgoing && (
        <div
          key={`${round.id}-mine`}
          className="reveal-item"
          style={{ animationDelay: `${results.length * STEP_SECONDS}s` }}
        >
          <Card className="border-amber-400 text-center">
            <div className="text-sm text-zinc-400">你們這組要喝的是</div>
            <div className="my-1 text-3xl font-black text-amber-400">{incoming.drink}</div>
            <div className="text-sm text-zinc-400">（{incoming.from.name} 準備的）</div>
            <div className="mt-3 border-t border-zinc-800 pt-3 text-sm text-zinc-300">
              你們準備的「{outgoing.drink}」要送給 <b>{outgoing.to.name}</b>
            </div>
          </Card>
        </div>
      )}

      <ErrorText>{error}</ErrorText>

      {isHost ? (
        <>
          <Button disabled={busy} onClick={() => run(() => callApi(`${base}/rounds`, {}, { hostToken }))}>
            下一輪 ➜
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => run(() => callApi(`${base}/rounds/cancel`, {}, { hostToken }))}
          >
            回到分組（調整組別）
          </Button>
        </>
      ) : (
        <p className="text-center text-sm text-zinc-500">等主持人開始下一輪…</p>
      )}

      <PastRounds snapshot={snapshot} exceptRoundId={round.id} />
    </>
  );
}
