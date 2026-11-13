// 瀏覽器呼叫我們自己 API 的小工具：失敗時丟出帶中文訊息的錯誤
export async function callApi<T = unknown>(
  path: string,
  body: unknown = {},
  options: { hostToken?: string; method?: string } = {},
): Promise<T> {
  const res = await fetch(path, {
    method: options.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.hostToken ? { "x-host-token": options.hostToken } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `發生錯誤（${res.status}）`);
  }
  return data as T;
}
