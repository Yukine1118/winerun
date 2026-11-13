// API 路由共用的小工具（只在伺服器端執行）
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getAdminSupabase } from "@/lib/supabase/server";
import { normalizeRoomCode } from "@/lib/roomCode";
import type { Room } from "@/lib/types";

/** 房間代碼在這段時間內不會重複；查詢時也只找這段時間內建立的房間 */
export const ROOM_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

/** 用來在程式裡「丟出」一個帶 HTTP 狀態碼的錯誤 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** 把 API 處理函式包起來：成功回傳 JSON，失敗回傳 { error } */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<unknown>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      const data = await fn(...args);
      return Response.json(data ?? { ok: true });
    } catch (err) {
      if (err instanceof ApiError) {
        return Response.json({ error: err.message }, { status: err.status });
      }
      console.error(err);
      return Response.json({ error: "伺服器發生錯誤，請再試一次" }, { status: 500 });
    }
  };
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}

export function newHostToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** 依代碼找「最近建立、還在有效期內」的房間，找不到就丟 404 */
export async function findRoomByCode(rawCode: string): Promise<Room> {
  const code = normalizeRoomCode(rawCode);
  if (!code) throw new ApiError(400, "房間代碼格式不正確");
  const since = new Date(Date.now() - ROOM_LIFETIME_MS).toISOString();
  const { data, error } = await getAdminSupabase()
    .from("rooms")
    .select("*")
    .eq("code", code)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, "找不到這個房間，請確認代碼");
  return data as Room;
}

/** 確認請求帶的主持人密鑰正確；不正確就丟 403 */
export async function requireHost(req: Request, rawCode: string): Promise<Room> {
  const room = await findRoomByCode(rawCode);
  const token = req.headers.get("x-host-token") ?? "";
  const { data, error } = await getAdminSupabase()
    .from("room_secrets")
    .select("host_token_hash")
    .eq("room_id", room.id)
    .maybeSingle();
  if (error) throw error;
  const expected = Buffer.from(data?.host_token_hash ?? "", "hex");
  const actual = Buffer.from(hashToken(token), "hex");
  if (!token || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new ApiError(403, "只有主持人可以做這個操作");
  }
  return room;
}

/** 確認玩家屬於這個房間 */
export async function requirePlayer(roomId: string, playerId: unknown) {
  if (typeof playerId !== "string" || !playerId) throw new ApiError(400, "缺少玩家資訊");
  const { data, error } = await getAdminSupabase()
    .from("players")
    .select("*")
    .eq("id", playerId)
    .eq("room_id", roomId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(403, "你不在這個房間裡，請重新加入");
  return data;
}
