// 按鈕操作共用：送出 → 失敗顯示錯誤 → 成功後重抓資料
"use client";

import { useCallback, useState } from "react";

export function useAction(onDone?: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      setBusy(true);
      setError(null);
      try {
        await action();
        onDone?.();
        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      } finally {
        setBusy(false);
      }
    },
    [onDone],
  );

  return { busy, error, run, setError };
}
