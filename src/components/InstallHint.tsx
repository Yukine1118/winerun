"use client";

import { useEffect, useState } from "react";

/** 首頁底部的「加到主畫面」教學；已經從主畫面開啟的話就不顯示 */
export function InstallHint() {
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true; // iPhone 用這個
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 要等到在手機上才知道是不是已安裝
    setInstalled(standalone);
  }, []);

  if (installed) return null;

  return (
    <details className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-300">
      <summary className="cursor-pointer font-semibold">📲 加到手機主畫面，像 App 一樣開啟</summary>
      <div className="mt-3 flex flex-col gap-3 text-zinc-400">
        <p>
          <b className="text-zinc-200">iPhone（Safari）：</b>
          按下方的「分享」按鈕（方框加向上箭頭）→ 往下滑找到「加入主畫面」→ 加入。
        </p>
        <p>
          <b className="text-zinc-200">Android（Chrome）：</b>
          按右上角「⋮」→「加到主畫面」或「安裝應用程式」。
        </p>
        <p className="text-xs text-zinc-500">
          從 LINE 點開連結的話，請先選「用預設瀏覽器開啟」，再照上面的步驟做。
        </p>
      </div>
    </details>
  );
}
