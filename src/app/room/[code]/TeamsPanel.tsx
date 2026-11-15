"use client";

import { useState } from "react";
import { Button, Card, ErrorText } from "@/components/ui";
import { callApi } from "@/lib/apiClient";
import { MAX_TEAMS } from "@/lib/grouping";
import type { Player, Team } from "@/lib/types";

interface Props {
  code: string;
  teams: Team[];
  players: Player[];
  meId: string;
  /** 有值代表我是主持人，可以操作 */
  hostToken?: string;
  onChanged: () => void;
}

export function TeamsPanel({ code, teams, players, meId, hostToken, onChanged }: Props) {
  const isHost = Boolean(hostToken);
  const [teamCount, setTeamCount] = useState(2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unassigned = players.filter((p) => !p.team_id || !teams.some((t) => t.id === p.team_id));
  const maxCount = Math.max(2, Math.min(MAX_TEAMS, players.length));
  const count = Math.min(teamCount, maxCount);

  // 所有主持人操作共用：送出 → 失敗顯示錯誤 → 成功後重抓資料
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const api = (path: string, body: unknown = {}, method = "POST") =>
    callApi(`/api/rooms/${code}${path}`, body, { hostToken, method });

  function randomize() {
    if (teams.length > 0 && !confirm("重新隨機分組會取代目前的分組，確定嗎？")) return;
    run(() => api("/teams/random", { teamCount: count }));
  }

  function rename(team: Team) {
    const name = prompt("新的組名（最多 20 字）", team.name);
    if (name === null || name.trim() === team.name) return;
    run(() => api(`/teams/${team.id}`, { name }, "PATCH"));
  }

  function remove(team: Team) {
    if (!confirm(`刪除「${team.name}」？組員會變回未分組`)) return;
    run(() => api(`/teams/${team.id}`, {}, "DELETE"));
  }

  function move(player: Player, teamId: string) {
    run(() => api(`/players/${player.id}/team`, { teamId: teamId || null }));
  }

  const chip = (p: Player) => (
    <PlayerChip
      key={p.id}
      player={p}
      isMe={p.id === meId}
      teams={teams}
      canMove={isHost && !busy}
      onMove={(teamId) => move(p, teamId)}
    />
  );

  return (
    <>
      {isHost && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-bold">分組</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">分成</span>
            <Button
              variant="secondary"
              className="min-h-10 w-10 px-0 py-0"
              disabled={count <= 2}
              onClick={() => setTeamCount(count - 1)}
              aria-label="減少一組"
            >
              −
            </Button>
            <span className="w-8 text-center text-xl font-bold">{count}</span>
            <Button
              variant="secondary"
              className="min-h-10 w-10 px-0 py-0"
              disabled={count >= maxCount}
              onClick={() => setTeamCount(count + 1)}
              aria-label="增加一組"
            >
              ＋
            </Button>
            <span className="text-sm text-zinc-400">組</span>
            <Button className="ml-auto" disabled={busy || players.length < 2} onClick={randomize}>
              🎲 隨機分組
            </Button>
          </div>
          <p className="text-xs text-zinc-500">
            也可以手動：按「新增一組」，再點成員的名字選擇要去哪一組。
          </p>
          <ErrorText>{error}</ErrorText>
        </Card>
      )}

      {teams.map((team) => {
        const members = players.filter((p) => p.team_id === team.id);
        const mine = members.some((p) => p.id === meId);
        return (
          <Card key={team.id} className={mine ? "border-amber-400/60" : ""}>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="font-bold">{team.name}</h3>
              <span className="text-sm text-zinc-400">({members.length})</span>
              {mine && <span className="text-xs text-amber-300">我的組</span>}
              {isHost && (
                <span className="ml-auto flex gap-1">
                  <button className="px-2 text-sm text-zinc-400" disabled={busy} onClick={() => rename(team)}>
                    改名
                  </button>
                  <button className="px-2 text-sm text-rose-400" disabled={busy} onClick={() => remove(team)}>
                    刪除
                  </button>
                </span>
              )}
            </div>
            {members.length > 0 ? (
              <ul className="flex flex-wrap gap-2">{members.map(chip)}</ul>
            ) : (
              <p className="text-sm text-zinc-500">還沒有人</p>
            )}
          </Card>
        );
      })}

      {isHost && teams.length < MAX_TEAMS && (
        <Button variant="secondary" disabled={busy} onClick={() => run(() => api("/teams"))}>
          ＋ 新增一組
        </Button>
      )}

      {(unassigned.length > 0 || teams.length === 0) && (
        <Card>
          <h3 className="mb-3 font-bold">
            {teams.length === 0 ? "成員" : "未分組"}{" "}
            <span className="text-zinc-400">({unassigned.length})</span>
          </h3>
          <ul className="flex flex-wrap gap-2">{unassigned.map(chip)}</ul>
        </Card>
      )}

      {!isHost && teams.length === 0 && (
        <Card className="text-center text-sm text-zinc-400">等主持人分組…</Card>
      )}
    </>
  );
}

function PlayerChip({
  player,
  isMe,
  teams,
  canMove,
  onMove,
}: {
  player: Player;
  isMe: boolean;
  teams: Team[];
  canMove: boolean;
  onMove: (teamId: string) => void;
}) {
  const showSelect = canMove && teams.length > 0;
  return (
    <li
      className={`relative rounded-full px-3 py-1.5 text-sm ${
        isMe ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-200"
      }`}
    >
      {player.is_host && "👑 "}
      {player.nickname}
      {showSelect && " ▾"}
      {/* 主持人：整顆名字上面蓋一個看不見的下拉選單，點名字就會跳出手機原生的選單 */}
      {showSelect && (
        <select
          aria-label={`把 ${player.nickname} 移到哪一組`}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={player.team_id ?? ""}
          onChange={(e) => onMove(e.target.value)}
        >
          <option value="">未分組</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      )}
    </li>
  );
}
