"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { clearSession, loadSession, type RoomSession } from "@/lib/session";
import { JoinForm } from "./JoinForm";
import { MemberList } from "./MemberList";
import { ShareCode } from "./ShareCode";

export function RoomScreen({ code }: { code: string }) {
  const { snapshot, status, error } = useRoomRealtime(code);
  const [session, setSession] = useState<RoomSession | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 讀取這支手機記住的身分 */
    setSession(loadSession(code));
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

      <MemberList players={snapshot.players} meId={me.id} />

      <Card className="text-center text-sm text-zinc-400">
        {isHost ? "人到齊後就可以開始分組（階段 2 製作中）" : "等主持人開始分組…"}
      </Card>
    </>
  );
}
