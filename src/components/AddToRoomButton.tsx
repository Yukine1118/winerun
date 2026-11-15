"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, ErrorText } from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { callApi } from "@/lib/apiClient";
import { lastRoom } from "@/lib/session";

/** 「加入本場酒單」按鈕：這支手機有待過的房間才會出現 */
export function AddToRoomButton({ name, recipeId = null }: { name: string; recipeId?: string | null }) {
  const [room, setRoom] = useState<ReturnType<typeof lastRoom>>(null);
  const [added, setAdded] = useState(false);
  const { busy, error, run } = useAction();

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 每次回到這頁都重新讀取房間 */
    setRoom(lastRoom());
    setAdded(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  if (!room) return null;

  if (added) {
    return (
      <Link href={`/room/${room.code}`} className="rounded-xl bg-emerald-600 py-3 text-center font-semibold text-white">
        ✓ 已加入酒單，回房間 {room.code}
      </Link>
    );
  }

  return (
    <>
      <Button
        variant="secondary"
        disabled={busy}
        onClick={async () => {
          const ok = await run(() =>
            callApi(`/api/rooms/${room.code}/drinks`, { playerId: room.session.playerId, name, recipeId }),
          );
          if (ok) setAdded(true);
        }}
      >
        ＋ 加入本場酒單（房間 {room.code}）
      </Button>
      <ErrorText>{error}</ErrorText>
    </>
  );
}
