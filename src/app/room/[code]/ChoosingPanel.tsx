"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, ErrorText, Input } from "@/components/ui";
import type { RoomSnapshot } from "@/hooks/useRoomRealtime";
import { useAction } from "@/hooks/useAction";
import { ApiCallError, callApi } from "@/lib/apiClient";
import type { Player, Round } from "@/lib/types";

interface Props {
  code: string;
  snapshot: RoomSnapshot;
  round: Round;
  me: Player;
  hostToken?: string;
  onChanged: () => void;
}

export function ChoosingPanel({ code, snapshot, round, me, hostToken, onChanged }: Props) {
  const isHost = Boolean(hostToken);
  const { teams, drinks } = snapshot;
  const choices = snapshot.choices.filter((c) => c.round_id === round.id);
  const myTeam = teams.find((t) => t.id === me.team_id);
  const myChoice = choices.find((c) => c.team_id === myTeam?.id);
  const doneCount = teams.filter((t) => choices.some((c) => c.team_id === t.id)).length;
  const allDone = doneCount === teams.length;

  const [custom, setCustom] = useState("");
  const { busy, error, run, setError } = useAction(onChanged);
  const base = `/api/rooms/${code}`;

  function choose(drinkName: string, recipeId: string | null = null) {
    return run(() => callApi(`${base}/choice`, { playerId: me.id, drinkName, recipeId }));
  }

  async function chooseCustom(e: FormEvent) {
    e.preventDefault();
    const name = custom.trim();
    if (!name) return;
    const ok = await choose(name);
    if (!ok) return;
    setCustom("");
    // 順便加進酒單，之後的輪次和拉霸機可以直接用（已經有了就略過）
    callApi(`${base}/drinks`, { playerId: me.id, name }).then(onChanged, () => {});
  }

  async function reveal(allowRepeat = false) {
    setError(null);
    try {
      await callApi(`${base}/rounds/reveal`, { allowRepeat }, { hostToken });
      onChanged();
    } catch (err) {
      // 不重複的配法用完了 → 問主持人要不要允許重複
      if (err instanceof ApiCallError && err.code === "NO_SOLUTION" && !allowRepeat) {
        if (confirm(`${err.message}。\n要允許和之前重複，繼續抽嗎？`)) await reveal(true);
        return;
      }
      setError((err as Error).message);
    }
  }

  return (
    <>
      <Card className="text-center">
        <div className="text-sm text-zinc-400">第 {round.round_no} 輪</div>
        <h2 className="text-2xl font-black text-amber-400">🍸 選酒時間</h2>
        <p className="mt-1 text-sm text-zinc-400">
          每組選一款酒。公布後，你們準備的酒會隨機送給別組喝！
        </p>
      </Card>

      {myTeam ? (
        <Card className="flex flex-col gap-3 border-amber-400/60">
          <h3 className="font-bold">
            {myTeam.name} 要準備的酒
            <span className="ml-2 text-xs font-normal text-zinc-400">同組誰選都可以，可以改</span>
          </h3>
          <div className="rounded-xl bg-zinc-950 p-3 text-center">
            {myChoice ? (
              <span className="text-xl font-bold text-amber-300">{myChoice.drink_name}</span>
            ) : (
              <span className="text-zinc-500">還沒選</span>
            )}
          </div>

          {drinks.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {drinks.map((d) => (
                <li key={d.id} className="flex">
                  <button
                    disabled={busy}
                    onClick={() => choose(d.name, d.recipe_id)}
                    className={`rounded-full px-3 py-1.5 text-sm ${
                      myChoice?.drink_name === d.name
                        ? "bg-amber-400 text-zinc-950"
                        : "bg-zinc-800 text-zinc-200"
                    } ${isHost ? "rounded-r-none" : ""}`}
                  >
                    {d.name}
                  </button>
                  {isHost && (
                    <button
                      disabled={busy}
                      aria-label={`從酒單移除 ${d.name}`}
                      onClick={() =>
                        run(() => callApi(`${base}/drinks/${d.id}`, {}, { hostToken, method: "DELETE" }))
                      }
                      className="rounded-r-full bg-zinc-700 px-2 text-sm text-zinc-400"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={chooseCustom} className="flex gap-2">
            <Input
              placeholder="自己輸入酒名"
              value={custom}
              maxLength={40}
              onChange={(e) => setCustom(e.target.value)}
            />
            <Button type="submit" variant="secondary" className="shrink-0" disabled={busy || !custom.trim()}>
              選這款
            </Button>
          </form>
        </Card>
      ) : (
        <Card className="text-center text-sm text-zinc-400">
          你還沒被分到任何一組，這一輪先當觀眾 👀
        </Card>
      )}

      <Card>
        <h3 className="mb-2 font-bold">
          進度 <span className="text-zinc-400">({doneCount}/{teams.length})</span>
        </h3>
        <ul className="flex flex-col gap-1">
          {teams.map((t) => {
            const done = choices.some((c) => c.team_id === t.id);
            return (
              <li key={t.id} className="flex justify-between text-sm">
                <span>{t.name}</span>
                <span className={done ? "text-emerald-400" : "text-zinc-500"}>
                  {done ? "✓ 選好了" : "選酒中…"}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <ErrorText>{error}</ErrorText>

      {isHost ? (
        <>
          <Button disabled={busy || !allDone} onClick={() => reveal()}>
            {allDone ? "🎉 公布結果" : "等所有組選好…"}
          </Button>
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => {
              if (confirm("取消這一輪，回到分組畫面？")) {
                run(() => callApi(`${base}/rounds/cancel`, {}, { hostToken }));
              }
            }}
          >
            取消這一輪，回到分組
          </Button>
        </>
      ) : (
        <p className="text-center text-sm text-zinc-500">
          {allDone ? "大家都選好了，等主持人公布…" : "等所有組選好…"}
        </p>
      )}
    </>
  );
}
