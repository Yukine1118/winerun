"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { AdvancedSlot } from "./AdvancedSlot";
import { BasicSlot } from "./BasicSlot";

type Mode = "basic" | "advanced";

export default function SlotPage() {
  const [mode, setMode] = useState<Mode>("basic");

  const tab = (value: Mode, label: string) => (
    <button
      onClick={() => setMode(value)}
      aria-pressed={mode === value}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
        mode === value ? "bg-amber-400 text-zinc-950" : "text-zinc-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader title="🎰 拉霸機" />
      <div className="flex gap-1 rounded-xl bg-zinc-900 p-1">
        {tab("basic", "抽一款酒")}
        {tab("advanced", "隨機特調")}
      </div>
      {/* 兩個模式都保持在畫面裡（只是藏起來），切換時不會弄丟剛抽到的結果 */}
      <div className={mode === "basic" ? "flex flex-col gap-4" : "hidden"}>
        <BasicSlot />
      </div>
      <div className={mode === "advanced" ? "flex flex-col gap-4" : "hidden"}>
        <AdvancedSlot />
      </div>
    </>
  );
}
