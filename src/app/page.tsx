"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorText, Input } from "@/components/ui";
import { callApi } from "@/lib/apiClient";
import { normalizeRoomCode } from "@/lib/roomCode";
import { lastNickname, saveSession } from "@/lib/session";

interface CreateResult {
  code: string;
  roomId: string;
  playerId: string;
  hostToken: string;
}

export default function Home() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 記得上次用的暱稱，省得每次重打
  useEffect(() => {
    // 如果使用者已經開始打字，就不要蓋掉
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 只在第一次載入時讀取 localStorage
    setNickname((current) => current || lastNickname());
  }, []);

  async function createRoom() {
    setError(null);
    setBusy("create");
    try {
      const res = await callApi<CreateResult>("/api/rooms", { nickname });
      saveSession(res.code, {
        roomId: res.roomId,
        playerId: res.playerId,
        nickname: nickname.trim(),
        hostToken: res.hostToken,
      });
      router.push(`/room/${res.code}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      // Next.js 會保留離開的頁面，不解除的話回首頁時按鈕會卡在「建立中…」
      setBusy(null);
    }
  }

  function goJoin(e: FormEvent) {
    e.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (!normalized) {
      setError("房間代碼是 4 碼英文或數字");
      return;
    }
    // 加入表單在房間頁裡，這樣分享連結和輸入代碼走的是同一套流程
    router.push(`/room/${normalized}`);
  }

  return (
    <>
      <header className="py-6 text-center">
        <div className="text-5xl">🍸🏃</div>
        <h1 className="mt-2 text-3xl font-black tracking-wide text-amber-400">酒精路跑</h1>
        <p className="mt-1 text-sm text-zinc-400">分組・抽酒・酒譜・拉霸機</p>
      </header>

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">我是主持人</h2>
        <Input
          placeholder="你的暱稱"
          value={nickname}
          maxLength={20}
          onChange={(e) => setNickname(e.target.value)}
        />
        <Button onClick={createRoom} disabled={busy !== null || !nickname.trim()}>
          {busy === "create" ? "建立中…" : "建立房間"}
        </Button>
      </Card>

      <Card>
        <form onSubmit={goJoin} className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">我要加入</h2>
          <Input
            placeholder="4 碼房間代碼"
            value={code}
            maxLength={4}
            autoCapitalize="characters"
            autoComplete="off"
            className="text-center text-2xl font-bold tracking-[0.5em] uppercase placeholder:text-base placeholder:font-normal placeholder:tracking-normal"
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <Button type="submit" variant="secondary" disabled={code.trim().length !== 4}>
            下一步
          </Button>
        </form>
      </Card>

      <ErrorText>{error}</ErrorText>

      <nav className="flex gap-2">
        <Link
          href="/recipes"
          className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/80 py-4 text-center font-semibold"
        >
          📖 酒譜
        </Link>
        <Link
          href="/slot"
          className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-900/80 py-4 text-center font-semibold"
        >
          🎰 拉霸機
        </Link>
      </nav>
    </>
  );
}
