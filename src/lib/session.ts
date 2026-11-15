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
const LAST_ROOM_KEY = "winerun:lastRoom";

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
  rememberRoom(code);
}

/** 記住「最近待的房間」，讓酒譜、拉霸機頁面可以一鍵回房間、把酒加進酒單 */
export function rememberRoom(code: string) {
  safeSet(LAST_ROOM_KEY, code.toUpperCase());
}

export function lastRoom(): { code: string; session: RoomSession } | null {
  const code = safeGet(LAST_ROOM_KEY);
  if (!code) return null;
  const session = loadSession(code);
  return session ? { code, session } : null;
}

export function clearSession(code: string) {
  try {
    localStorage.removeItem(key(code));
    if (safeGet(LAST_ROOM_KEY) === code.toUpperCase()) localStorage.removeItem(LAST_ROOM_KEY);
  } catch {
    /* ignore */
  }
}

export function lastNickname(): string {
  return safeGet(NICKNAME_KEY) ?? "";
}
