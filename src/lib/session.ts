// 記住「我在這個房間是誰」（存在這支手機的瀏覽器裡，不需要登入）

export interface RoomSession {
  roomId: string;
  playerId: string;
  nickname: string;
  /** 只有主持人才有 */
  hostToken?: string;
}

const key = (code: string) => `winerun:room:${code.toUpperCase()}`;
const NICKNAME_KEY = "winerun:nickname";

function safeGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

function safeSet(k: string, v: string) {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* 無痕模式等情況可能無法儲存，忽略 */
  }
}

export function loadSession(code: string): RoomSession | null {
  const raw = safeGet(key(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoomSession;
  } catch {
    return null;
  }
}

export function saveSession(code: string, session: RoomSession) {
  safeSet(key(code), JSON.stringify(session));
  safeSet(NICKNAME_KEY, session.nickname);
}

export function clearSession(code: string) {
  try {
    localStorage.removeItem(key(code));
  } catch {
    /* ignore */
  }
}

export function lastNickname(): string {
  return safeGet(NICKNAME_KEY) ?? "";
}
