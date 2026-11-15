"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AddToRoomButton } from "@/components/AddToRoomButton";
import { SlotMachine } from "@/components/SlotMachine";
import { Card } from "@/components/ui";
import { useRecipes } from "@/hooks/useRecipes";
import { lastRoom } from "@/lib/session";
import { CLASSIC_DRINKS, mergeNames } from "@/lib/slot";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Source = "all" | "room" | "recipes";

/** 基本版：從本場酒單 + 酒譜裡隨機抽一款 */
export function BasicSlot() {
  const { recipes } = useRecipes();
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomDrinks, setRoomDrinks] = useState<string[]>([]);
  const [source, setSource] = useState<Source>("all");
  const [result, setResult] = useState<string | null>(null);

  // 這支手機待過的房間 → 讀它的酒單
  useEffect(() => {
    const room = lastRoom();
    if (!room) return;
    let alive = true;
    getBrowserSupabase()
      .from("room_drinks")
      .select("name")
      .eq("room_id", room.session.roomId)
      .order("created_at")
      .then(({ data }) => {
        if (!alive) return;
        setRoomCode(room.code);
        setRoomDrinks((data ?? []).map((d) => d.name as string));
      });
    return () => {
      alive = false;
    };
  }, []);

  const recipeNames = (recipes ?? []).map((r) => r.name);
  const hasBoth = roomDrinks.length > 0 && recipeNames.length > 0;
  const effective: Source = hasBoth ? source : "all";
  const own =
    effective === "room"
      ? roomDrinks
      : effective === "recipes"
        ? recipeNames
        : mergeNames(roomDrinks, recipeNames);
  const usingClassics = own.length === 0;
  const items = usingClassics ? CLASSIC_DRINKS : own;
  const matched = result ? (recipes ?? []).find((r) => r.name === result) : undefined;

  const sourceChip = (value: Source, label: string) => (
    <button
      key={value}
      onClick={() => {
        setSource(value);
        setResult(null);
      }}
      className={`rounded-full px-3 py-1.5 text-sm ${
        effective === value ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      {hasBoth && (
        <div className="flex gap-2">
          {sourceChip("all", `全部 (${mergeNames(roomDrinks, recipeNames).length})`)}
          {sourceChip("room", `本場酒單 (${roomDrinks.length})`)}
          {sourceChip("recipes", `酒譜 (${recipeNames.length})`)}
        </div>
      )}

      {/* key：候選清單一變，轉輪就重新開始 */}
      <SlotMachine
        key={items.join("\n")}
        reels={[{ label: "酒", items }]}
        onResult={(values) => setResult(values?.[0] ?? null)}
      />

      <p className="text-center text-xs text-zinc-500">
        {usingClassics
          ? "酒單和酒譜都還是空的，先用經典調酒來抽"
          : `從 ${items.length} 款酒裡面抽${roomCode && roomDrinks.length > 0 ? `（含房間 ${roomCode} 的酒單）` : ""}`}
      </p>

      {result && (
        <>
          <Card className="reveal-item border-amber-400 text-center">
            <div className="text-sm text-zinc-400">抽到了</div>
            <div className="my-1 text-3xl font-black text-amber-400">{result}</div>
            {matched && (
              <Link href={`/recipes/${matched.id}`} className="text-sm text-amber-300 underline">
                📖 看酒譜
              </Link>
            )}
          </Card>
          {!roomDrinks.includes(result) && (
            <AddToRoomButton key={result} name={result} recipeId={matched?.id ?? null} />
          )}
        </>
      )}
    </>
  );
}
