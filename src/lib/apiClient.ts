// 瀏覽器呼叫我們自己 API 的小工具：失敗時丟出帶中文訊息的錯誤
export class ApiCallError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

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
    const { error, code } = data as { error?: string; code?: string };
    throw new ApiCallError(error ?? `發生錯誤（${res.status}）`, code);
  }
  return data as T;
}
