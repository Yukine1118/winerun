"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui";
import { pickRandom, spinReels, type ReelConfig } from "@/lib/slot";

const ITEM_HEIGHT = 72; // 每一格的高度（px），要和下面的 h-[72px] 一致
const BASE_SECONDS = 1.3; // 第一個轉輪轉多久
const STAGGER_SECONDS = 0.5; // 後面的轉輪每個多轉多久（一個一個停下來比較有感覺）

interface Props {
  reels: ReelConfig[];
  /** 進階版：每個轉輪可以鎖定 */
  lockable?: boolean;
  /** 開始轉的時候傳 null；全部停下來後傳結果 */
  onResult: (values: (string | null)[] | null) => void;
}

export function SlotMachine({ reels, lockable = false, onResult }: Props) {
  const [values, setValues] = useState<(string | null)[]>(() => reels.map(() => null));
  const [strips, setStrips] = useState<string[][]>(() => reels.map(() => ["？"]));
  const [spinIds, setSpinIds] = useState<number[]>(() => reels.map(() => 0));
  const [locked, setLocked] = useState<boolean[]>(() => reels.map(() => false));
  const [spinning, setSpinning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 離開頁面時（頁面會被 Next.js 保留）停掉計時器，回來時按鈕才不會卡在「轉動中」
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      setSpinning(false);
    };
  }, []);

  const active = reels.map((r) => r.items.length > 0);
  const canSpin = active.some(Boolean) && !spinning;

  function spin() {
    const next = spinReels(
      reels.map((r) => r.items),
      values,
      locked,
    );
    // 鎖定而且沒變的轉輪不用動
    const moves = next.map((v, i) => v !== null && !(locked[i] && v === values[i]));

    setStrips((old) =>
      old.map((strip, i) => {
        if (!moves[i]) return next[i] === null ? strip : [next[i]!];
        // 轉輪內容：目前這格 → 一串隨機的過場 → 抽中的那格
        const fillers = Array.from({ length: 12 + i * 6 }, () => pickRandom(reels[i].items));
        return [values[i] ?? "？", ...fillers, next[i]!];
      }),
    );
    setSpinIds((ids) => ids.map((id, i) => (moves[i] ? id + 1 : id)));
    setValues(next);
    setSpinning(true);
    onResult(null);

    const lastMoving = moves.lastIndexOf(true);
    const wait = lastMoving === -1 ? 0 : (BASE_SECONDS + lastMoving * STAGGER_SECONDS) * 1000 + 150;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSpinning(false);
      onResult(next);
      try {
        navigator.vibrate?.(60); // 停下來時手機震一下（不支援的手機會略過）
      } catch {
        /* ignore */
      }
    }, wait);
  }

  const single = reels.length === 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 rounded-2xl border-2 border-amber-400/70 bg-zinc-950 p-2">
        {reels.map((reel, i) =>
          active[i] ? (
            <div key={reel.label} className="flex min-w-0 flex-1 flex-col gap-1">
              {!single && <div className="text-center text-xs text-zinc-400">{reel.label}</div>}
              <div className="h-[72px] overflow-hidden rounded-xl bg-zinc-900">
                <div
                  key={spinIds[i]}
                  className={strips[i].length > 1 ? "reel-strip" : ""}
                  style={
                    {
                      "--end": `-${(strips[i].length - 1) * ITEM_HEIGHT}px`,
                      "--dur": `${BASE_SECONDS + i * STAGGER_SECONDS}s`,
                    } as CSSProperties
                  }
                >
                  {strips[i].map((item, j) => (
                    <div
                      key={j}
                      className={`flex h-[72px] items-center justify-center px-1 text-center leading-tight font-bold ${
                        single ? "text-2xl" : "text-base"
                      } ${locked[i] ? "text-amber-300" : ""}`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              {lockable && (
                <button
                  disabled={spinning || values[i] === null}
                  onClick={() => setLocked((l) => l.map((v, j) => (j === i ? !v : v)))}
                  aria-pressed={locked[i]}
                  className={`rounded-lg py-1.5 text-xs disabled:opacity-40 ${
                    locked[i] ? "bg-amber-400 font-bold text-zinc-950" : "bg-zinc-800 text-zinc-300"
                  }`}
                >
                  {locked[i] ? "🔒 已鎖定" : "🔓 鎖定"}
                </button>
              )}
            </div>
          ) : null,
        )}
        {!active.some(Boolean) && (
          <div className="flex h-[72px] flex-1 items-center justify-center text-zinc-500">
            清單是空的，沒有東西可以抽
          </div>
        )}
      </div>

      <Button disabled={!canSpin} onClick={spin} className="text-lg">
        {spinning ? "轉動中…" : values.some((v) => v !== null) ? "🎰 再拉一次" : "🎰 拉！"}
      </Button>
    </div>
  );
}
