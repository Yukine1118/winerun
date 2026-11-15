// 配對演算法：決定「每一組的酒送給哪一組喝」
//
// 規則：
//   a. 每組恰好收到一組送來的酒
//   b. 不能抽到自己組的酒
//   c. 每組的酒只送給一個組
//   （數學上叫「無固定點的隨機排列 / 錯位排列」）
//   多輪模式：forbidden 裡列出以前出現過的配對，這次不能再出現。
import { shuffle } from "./grouping";

export interface Pair {
  /** 準備酒的組 */
  from: string;
  /** 喝這杯酒的組 */
  to: string;
}

export class PairingError extends Error {
  constructor(
    public code: "TOO_FEW_TEAMS" | "DUPLICATE_TEAM" | "NO_SOLUTION",
    message: string,
  ) {
    super(message);
  }
}

export interface PairingOptions {
  /** 不允許出現的配對（通常是前幾輪的結果） */
  forbidden?: readonly Pair[];
  random?: () => number;
}

const MAX_RANDOM_ATTEMPTS = 2000;
const pairKey = (from: string, to: string) => `${from}\u0000${to}`;

export function generatePairing(teamIds: readonly string[], options: PairingOptions = {}): Pair[] {
  const random = options.random ?? Math.random;
  const n = teamIds.length;

  if (n < 2) {
    throw new PairingError("TOO_FEW_TEAMS", "至少需要 2 組才能配對");
  }
  if (new Set(teamIds).size !== n) {
    throw new PairingError("DUPLICATE_TEAM", "組別清單裡有重複的組");
  }

  const forbidden = new Set((options.forbidden ?? []).map((p) => pairKey(p.from, p.to)));
  const allowed = (from: string, to: string) => from !== to && !forbidden.has(pairKey(from, to));

  // 方法一：整副牌洗一洗，只要有任何一組不合規則就整副重洗。
  // 這樣每一種合法結果出現的機率完全相同（最公平）。沒有額外限制時平均約 3 次就成功。
  for (let attempt = 0; attempt < MAX_RANDOM_ATTEMPTS; attempt++) {
    const receivers = shuffle(teamIds, random);
    if (teamIds.every((from, i) => allowed(from, receivers[i]))) {
      return teamIds.map((from, i) => ({ from, to: receivers[i] }));
    }
  }

  // 方法二：玩了很多輪之後，合法的結果變得很少，亂洗很難剛好洗到。
  // 改用「二分圖配對」：只要有解就保證找得到，真的無解才報錯。
  const result = matchWithConstraints(teamIds, allowed, random);
  if (!result) {
    throw new PairingError(
      "NO_SOLUTION",
      `${n} 組最多只能玩 ${n - 1} 輪不重複的配對，已經沒有新的配法了`,
    );
  }
  return result;
}

/** Kuhn 增廣路徑演算法（候選順序隨機，所以結果仍然是隨機的） */
function matchWithConstraints(
  teamIds: readonly string[],
  allowed: (from: string, to: string) => boolean,
  random: () => number,
): Pair[] | null {
  const candidates = new Map<string, string[]>();
  for (const from of teamIds) {
    candidates.set(
      from,
      shuffle(
        teamIds.filter((to) => allowed(from, to)),
        random,
      ),
    );
  }

  const giverOf = new Map<string, string>(); // 收酒的組 → 送酒的組

  const tryAssign = (from: string, visited: Set<string>): boolean => {
    for (const to of candidates.get(from) ?? []) {
      if (visited.has(to)) continue;
      visited.add(to);
      const current = giverOf.get(to);
      // 這個收酒組還沒人送，或原本送的那組可以改送別人 → 就給 from
      if (current === undefined || tryAssign(current, visited)) {
        giverOf.set(to, from);
        return true;
      }
    }
    return false;
  };

  for (const from of shuffle(teamIds, random)) {
    if (!tryAssign(from, new Set())) return null;
  }

  const receiverOf = new Map<string, string>();
  for (const [to, from] of giverOf) receiverOf.set(from, to);
  return teamIds.map((from) => ({ from, to: receiverOf.get(from)! }));
}

/** 檢查一組配對是否符合所有規則；回傳違規說明（空陣列 = 完全合法）。測試和伺服器都會用。 */
export function validatePairing(
  teamIds: readonly string[],
  pairs: readonly Pair[],
  forbidden: readonly Pair[] = [],
): string[] {
  const problems: string[] = [];
  const teams = new Set(teamIds);
  const givers = pairs.map((p) => p.from);
  const receivers = pairs.map((p) => p.to);

  if (pairs.length !== teamIds.length) problems.push("配對數量和組數不一樣");
  if (new Set(givers).size !== givers.length) problems.push("有組送出超過一次");
  if (new Set(receivers).size !== receivers.length) problems.push("有組收到超過一杯");
  for (const id of teamIds) {
    if (!givers.includes(id)) problems.push(`${id} 沒有送出酒`);
    if (!receivers.includes(id)) problems.push(`${id} 沒有收到酒`);
  }
  const banned = new Set(forbidden.map((p) => pairKey(p.from, p.to)));
  for (const p of pairs) {
    if (!teams.has(p.from) || !teams.has(p.to)) problems.push("出現不存在的組");
    if (p.from === p.to) problems.push(`${p.from} 抽到自己的酒`);
    if (banned.has(pairKey(p.from, p.to))) problems.push(`${p.from} → ${p.to} 和之前的輪次重複`);
  }
  return problems;
}
