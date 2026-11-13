"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { RoomScreen } from "./RoomScreen";

// 房間代碼要等到手機真的打開網址才知道，所以用 Suspense 先顯示「載入中」
export default function RoomPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-zinc-400">載入中…</p>}>
      <RoomFromUrl />
    </Suspense>
  );
}

function RoomFromUrl() {
  const params = useParams<{ code: string }>();
  const code = (params.code ?? "").toUpperCase();
  // key={code}：換房間時整個畫面重新開始，不會殘留上一個房間的狀態
  return <RoomScreen key={code} code={code} />;
}
