"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { clearSession, loadSession, rememberRoom, type RoomSession } from "@/lib/session";
import { JoinForm } from "./JoinForm";
import { ShareCode } from "./ShareCode";
import { TeamsPanel } from "./TeamsPanel";
import { ChoosingPanel } from "./ChoosingPanel";
import { ResultPanel } from "./ResultPanel";
import { PastRounds } from "./PastRounds";
import { ErrorText } from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { callApi } from "@/lib/apiClient";
import type { RoomSnapshot } from "@/hooks/useRoomRealtime";
import type { Player } from "@/lib/types";

export function RoomScreen({ code }: { code: string }) {
  const { snapshot, status, error, reload } = useRoomRealtime(code);
  const [session, setSession] = useState<RoomSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 讀取這支手機記住的身分 */
    const saved = loadSession(code);
    if (saved) rememberRoom(code);
    setSession(saved);
    setSessionChecked(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [code]);

  if (status === "loading" || !sessionChecked) {
    return <p className="py-20 text-center text-zinc-400">載入中…</p>;
  }
  if (status === "not-found") {
    return (
      <Card className="mt-10 flex flex-col gap-3 text-center">
        <p className="text-lg">找不到房間 {code}</p>
        <p className="text-sm text-zinc-400">請確認代碼，或房間已超過 7 天。</p>
        <Link href="/" className="text-amber-400 underline">
          回首頁
        </Link>
      </Card>
    );
  }
  if (status === "error" || !snapshot) {
    return <p className="py-20 text-center text-rose-400">連線失敗：{error}</p>;
  }

  // 這支手機記住的身分，必須屬於「目前這間」房間，而且玩家還在
  const me =
    session && session.roomId === snapshot.room.id
      ? snapshot.players.find((p) => p.id === session.playerId)
      : undefined;

  if (!me) {
    return (
      <>
        <ShareCode code={code} compact />
        <JoinForm
          code={code}
          onJoined={(s) => {
            setSession(s);
          }}
        />
      </>
    );
  }

  const isHost = Boolean(session?.hostToken) && me.is_host;

  return (
    <>
      <ShareCode code={code} />
      <Card className="flex items-center justify-between">
        <span>
          我是 <b className="text-amber-400">{me.nickname}</b>
          {isHost && <span className="ml-2 rounded bg-amber-400/20 px-2 py-0.5 text-xs text-amber-300">主持人</span>}
        </span>
        <Button
          variant="ghost"
          className="min-h-0 px-2 py-1 text-sm"
          onClick={() => {
            if (confirm("確定要離開？之後要用代碼重新加入（會變成新的成員）")) {
              clearSession(code);
              setSession(null);
            }
          }}
        >
          離開
        </Button>
      </Card>

      <nav className="flex gap-2 text-sm">
        <Link href="/recipes" className="flex-1 rounded-xl bg-zinc-900 py-2 text-center text-zinc-300">
          📖 酒譜
        </Link>
      </nav>

      <RoomBody
        code={code}
        snapshot={snapshot}
        me={me}
        hostToken={isHost ? session?.hostToken : undefined}
        reload={reload}
      />
    </>
  );
}

/** 依房間目前的狀態，顯示「分組」「選酒」或「結果」畫面 */
function RoomBody({
  code,
  snapshot,
  me,
  hostToken,
  reload,
}: {
  code: string;
  snapshot: RoomSnapshot;
  me: Player;
  hostToken?: string;
  reload: () => void;
}) {
  const { room } = snapshot;
  const round = snapshot.rounds.find((r) => r.round_no === room.current_round);
  const { busy, error, run } = useAction(reload);

  if (room.status === "choosing" && round) {
    return (
      <ChoosingPanel code={code} snapshot={snapshot} round={round} me={me} hostToken={hostToken} onChanged={reload} />
    );
  }
  if (room.status === "revealed" && round) {
    return (
      <ResultPanel code={code} snapshot={snapshot} round={round} me={me} hostToken={hostToken} onChanged={reload} />
    );
  }

  const unassigned = snapshot.players.filter((p) => !p.team_id).length;
  function startRound() {
    if (unassigned > 0 && !confirm(`還有 ${unassigned} 人沒分組（會變成觀眾），確定開始嗎？`)) return;
    run(() => callApi(`/api/rooms/${code}/rounds`, {}, { hostToken }));
  }

  return (
    <>
      <TeamsPanel
        code={code}
        teams={snapshot.teams}
        players={snapshot.players}
        meId={me.id}
        hostToken={hostToken}
        onChanged={reload}
      />
      {hostToken && snapshot.teams.length > 0 && (
        <>
          <ErrorText>{error}</ErrorText>
          <Button disabled={busy} onClick={startRound}>
            🍸 開始選酒（第 {room.current_round + 1} 輪）
          </Button>
        </>
      )}
      <PastRounds snapshot={snapshot} />
    </>
  );
}
