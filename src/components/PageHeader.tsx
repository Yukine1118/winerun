"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { lastRoom } from "@/lib/session";

/** 酒譜、拉霸機等頁面共用的標題列：左邊是返回連結，右邊可以放按鈕 */
export function PageHeader({
  title,
  back,
  action,
}: {
  title: string;
  /** 指定返回位置；不指定的話：有房間就回房間，否則回首頁 */
  back?: { href: string; label: string };
  action?: ReactNode;
}) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 讀取這支手機記住的房間
    setRoomCode(lastRoom()?.code ?? null);
  }, []);

  const target = back ?? (roomCode ? { href: `/room/${roomCode}`, label: `回房間 ${roomCode}` } : { href: "/", label: "首頁" });

  return (
    <header className="flex items-center justify-between gap-2">
      <Link href={target.href} className="shrink-0 text-sm text-zinc-400">
        ← {target.label}
      </Link>
      <h1 className="truncate text-lg font-black text-amber-400">{title}</h1>
      <div className="flex shrink-0 justify-end text-sm">{action ?? <span className="w-12" />}</div>
    </header>
  );
}
