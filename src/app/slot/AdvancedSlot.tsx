"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AddToRoomButton } from "@/components/AddToRoomButton";
import { SlotMachine } from "@/components/SlotMachine";
import { Button, Card } from "@/components/ui";
import { saveRecipeDraft } from "@/lib/recipeDraft";
import {
  DEFAULT_REELS,
  MAX_REEL_ITEMS,
  comboName,
  comboToRecipeDraft,
  loadReels,
  parseItems,
  type ReelConfig,
} from "@/lib/slot";

const STORAGE_KEY = "winerun:slotReels";

/** 進階版：基酒、軟飲、加料各一個轉輪，可以鎖定、可以自訂內容 */
export function AdvancedSlot() {
  const router = useRouter();
  const [reels, setReels] = useState<ReelConfig[]>(DEFAULT_REELS);
  const [result, setResult] = useState<(string | null)[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<string[]>([]);

  // 讀取這支手機存的自訂轉輪
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 只在載入時讀取 localStorage
      setReels(loadReels(localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* 讀不到就用預設值 */
    }
  }, []);

  function applyReels(next: ReelConfig[]) {
    setReels(next);
    setResult(null);
    setEditing(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.map((r) => r.items)));
    } catch {
      /* 無痕模式存不了：這次還是能用，只是下次會回到預設 */
    }
  }

  const name = result ? comboName(result) : "";

  return (
    <>
      {/* key：轉輪內容一改，轉輪和鎖定狀態就重新開始 */}
      <SlotMachine key={JSON.stringify(reels)} reels={reels} lockable onResult={setResult} />

      <p className="text-center text-xs text-zinc-500">
        喜歡某一格？按「鎖定」後再拉，只會重轉其他的。
      </p>

      {result && name && (
        <>
          <Card className="reveal-item border-amber-400 text-center">
            <div className="text-sm text-zinc-400">今天的特調</div>
            <div className="my-1 text-2xl font-black text-amber-400">{name}</div>
          </Card>
          <Button
            onClick={() => {
              saveRecipeDraft(comboToRecipeDraft(result));
              router.push("/recipes/new");
            }}
          >
            📖 存成酒譜
          </Button>
          <AddToRoomButton key={name} name={name.slice(0, 40)} />
        </>
      )}

      {editing ? (
        <Card className="flex flex-col gap-3">
          <h3 className="font-bold">自訂轉輪內容</h3>
          <p className="text-xs text-zinc-400">
            一行一個，每個轉輪最多 {MAX_REEL_ITEMS} 項。整個清空的話，那個轉輪就不會出現。
            只會存在你這支手機上。
          </p>
          {reels.map((reel, i) => (
            <label key={reel.label} className="flex flex-col gap-1 text-sm text-zinc-400">
              {reel.label}
              <textarea
                rows={5}
                value={drafts[i] ?? ""}
                onChange={(e) => setDrafts((d) => d.map((v, j) => (j === i ? e.target.value : v)))}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-base text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </label>
          ))}
          <Button onClick={() => applyReels(reels.map((r, i) => ({ ...r, items: parseItems(drafts[i] ?? "") })))}>
            儲存
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(false)}>
              取消
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                if (confirm("恢復成預設的轉輪內容？")) applyReels(DEFAULT_REELS);
              }}
            >
              恢復預設
            </Button>
          </div>
        </Card>
      ) : (
        <Button
          variant="ghost"
          onClick={() => {
            setDrafts(reels.map((r) => r.items.join("\n")));
            setEditing(true);
          }}
        >
          ✏️ 自訂轉輪內容
        </Button>
      )}
    </>
  );
}
