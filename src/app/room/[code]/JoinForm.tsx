"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, ErrorText, Input } from "@/components/ui";
import { callApi } from "@/lib/apiClient";
import { lastNickname, saveSession, type RoomSession } from "@/lib/session";

export function JoinForm({ code, onJoined }: { code: string; onJoined: (s: RoomSession) => void }) {
  const [nickname, setNickname] = useState(() =>
    typeof window === "undefined" ? "" : lastNickname(),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await callApi<{ roomId: string; playerId: string }>(
        `/api/rooms/${code}/join`,
        { nickname },
      );
      const session = { roomId: res.roomId, playerId: res.playerId, nickname: nickname.trim() };
      saveSession(code, session);
      onJoined(session);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">加入房間</h2>
        <Input
          placeholder="你的暱稱"
          value={nickname}
          maxLength={20}
          autoFocus
          onChange={(e) => setNickname(e.target.value)}
        />
        <Button type="submit" disabled={busy || !nickname.trim()}>
          {busy ? "加入中…" : "加入"}
        </Button>
        <ErrorText>{error}</ErrorText>
      </form>
    </Card>
  );
}
