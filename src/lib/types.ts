// 資料表的 TypeScript 型別（和 supabase/migrations/001_init.sql 對應）

export type RoomStatus = "lobby" | "grouping" | "choosing" | "revealed";

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  current_round: number;
  created_at: string;
}

export interface Team {
  id: string;
  room_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  nickname: string;
  team_id: string | null;
  is_host: boolean;
  joined_at: string;
}

export interface Ingredient {
  name: string;
  amount: string;
}

export interface Recipe {
  id: string;
  name: string;
  base_spirit: string;
  ingredients: Ingredient[];
  steps: string;
  notes: string;
  photo_url: string | null;
  created_by: string;
  created_at: string;
}

export interface RoomDrink {
  id: string;
  room_id: string;
  name: string;
  recipe_id: string | null;
  created_at: string;
}

export interface Round {
  id: string;
  room_id: string;
  round_no: number;
  status: "choosing" | "revealed";
  created_at: string;
}

export interface TeamChoice {
  round_id: string;
  team_id: string;
  room_id: string;
  drink_name: string;
  recipe_id: string | null;
  updated_at: string;
}

export interface Pairing {
  round_id: string;
  room_id: string;
  from_team_id: string;
  to_team_id: string;
}
