"use client";

import { useState } from "react";
import Link from "next/link";

export function ShareCode({ code, compact = false }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/room/${code}`;
    // 手機上優先用系統分享選單（可以直接丟 LINE），不支援就複製連結
    if (navigator.share) {
      try {
        await navigator.share({ title: "酒精路跑", text: `房間代碼 ${code}`, url });
        return;
      } catch {
        /* 使用者取消分享 → 改成複製 */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("複製這個連結給朋友：", url);
    }
  }

  return (
    <header className="flex items-center justify-between">
      <Link href="/" className="text-sm text-zinc-400">
        ← 首頁
      </Link>
      <div className="text-center">
        <div className="text-xs text-zinc-400">房間代碼</div>
        <div className={`font-black tracking-[0.3em] text-amber-400 ${compact ? "text-2xl" : "text-4xl"}`}>
          {code}
        </div>
      </div>
      <button onClick={share} className="text-sm text-amber-300">
        {copied ? "已複製 ✓" : "邀請"}
      </button>
    </header>
  );
}
