// 讀取一個房間的所有資料，並在任何人改動時自動更新（Supabase Realtime）
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Pairing, Player, Room, RoomDrink, Round, Team, TeamChoice } from "@/lib/types";

export interface RoomSnapshot {
  room: Room;
  teams: Team[];
  players: Player[];
  drinks: RoomDrink[];
  rounds: Round[];
  choices: TeamChoice[];
  pairings: Pairing[];
}

const ROOM_TABLES = ["teams", "players", "room_drinks", "rounds", "team_choices", "pairings"] as const;
const LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;

async function fetchSnapshot(code: string): Promise<RoomSnapshot | null> {
  const db = getBrowserSupabase();
  const since = new Date(Date.now() - LIFETIME_MS).toISOString();
  const { data: room, error } = await db
    .from("rooms")
    .select("*")
    .eq("code", code)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!room) return null;

  const byRoom = (table: string, order: string) =>
    db.from(table).select("*").eq("room_id", room.id).order(order, { ascending: true });

  const [teams, players, drinks, rounds, choices, pairings] = await Promise.all([
    byRoom("teams", "sort_order"),
    byRoom("players", "joined_at"),
    byRoom("room_drinks", "created_at"),
    byRoom("rounds", "round_no"),
    byRoom("team_choices", "updated_at"),
    byRoom("pairings", "round_id"),
  ]);
  for (const r of [teams, players, drinks, rounds, choices, pairings]) {
    if (r.error) throw r.error;
  }
  return {
    room: room as Room,
    teams: teams.data as Team[],
    players: players.data as Player[],
    drinks: drinks.data as RoomDrink[],
    rounds: rounds.data as Round[],
    choices: choices.data as TeamChoice[],
    pairings: pairings.data as Pairing[],
  };
}

export function useRoomRealtime(code: string) {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roomId = snapshot?.room.id;

  const reload = useCallback(async () => {
    try {
      const snap = await fetchSnapshot(code);
      if (!snap) {
        setStatus("not-found");
        return;
      }
      setSnapshot(snap);
      setStatus("ready");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus((s) => (s === "loading" ? "error" : s));
    }
  }, [code]);

  // 很多變動常常一起發生（例如隨機分組一次改 10 個人），等 150ms 再一次重抓
  const scheduleReload = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(reload, 150);
  }, [reload]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 第一次進頁面要抓資料
    reload();
  }, [reload]);

  // 訂閱即時更新
  useEffect(() => {
    if (!roomId) return;
    const db = getBrowserSupabase();
    const channel = db.channel(`room:${roomId}`);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
      scheduleReload,
    );
    for (const table of ROOM_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter: `room_id=eq.${roomId}` },
        scheduleReload,
      );
      // Supabase 的限制：「刪除」事件無法用 room_id 過濾，所以另外訂閱全部的刪除
      channel.on("postgres_changes", { event: "DELETE", schema: "public", table }, scheduleReload);
    }
    channel.subscribe((s) => {
      // 斷線重連後補抓一次，避免漏掉中間的變化
      if (s === "SUBSCRIBED") scheduleReload();
    });

    // 手機切回這個 App 時也重抓（螢幕關掉時連線可能被系統中斷）
    const onVisible = () => {
      if (document.visibilityState === "visible") scheduleReload();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      db.removeChannel(channel);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [roomId, scheduleReload]);

  return { snapshot, status, error, reload };
}
