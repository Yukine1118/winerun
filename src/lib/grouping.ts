// 隨機分組：把玩家平均分到 N 組（各組人數最多差 1 人）

/** Fisher–Yates 洗牌：公平地打亂順序，不會改到原本的陣列 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function randomGroups<T>(
  players: readonly T[],
  teamCount: number,
  random: () => number = Math.random,
): T[][] {
  if (!Number.isInteger(teamCount) || teamCount < 1) {
    throw new Error("組數至少要 1 組");
  }
  if (teamCount > players.length) {
    throw new Error("組數不能超過人數");
  }
  const groups: T[][] = Array.from({ length: teamCount }, () => []);
  // 洗牌後像發牌一樣輪流發給每一組
  shuffle(players, random).forEach((player, index) => {
    groups[index % teamCount].push(player);
  });
  return groups;
}

export function defaultTeamName(index: number): string {
  return `第 ${index + 1} 組`;
}

/** 組名：去頭尾空白，1~20 字 */
export function normalizeTeamName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const name = input.trim();
  if (name.length < 1 || name.length > 20) return null;
  return name;
}

export const MAX_TEAMS = 20;
