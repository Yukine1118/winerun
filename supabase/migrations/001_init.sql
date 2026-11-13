-- =====================================================================
-- 酒精路跑 App：資料表初始化
-- 用法：Supabase 後台 → SQL Editor → New query → 貼上全部 → Run
-- 可以重複執行（已存在的東西會略過）。
-- =====================================================================

-- ---------- 房間 ----------
create table if not exists rooms (
  id            uuid primary key default gen_random_uuid(),
  code          char(4) not null,
  -- lobby：等人加入 / grouping：分組中 / choosing：選酒中 / revealed：已公布
  status        text not null default 'lobby'
                check (status in ('lobby', 'grouping', 'choosing', 'revealed')),
  current_round int  not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists rooms_code_idx on rooms (code, created_at desc);

-- 主持人密鑰（只存雜湊值）。沒有任何 RLS policy → 瀏覽器完全讀不到。
create table if not exists room_secrets (
  room_id          uuid primary key references rooms (id) on delete cascade,
  host_token_hash  text not null
);

-- ---------- 組別、玩家 ----------
create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references rooms (id) on delete cascade,
  name        text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists teams_room_idx on teams (room_id);

create table if not exists players (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references rooms (id) on delete cascade,
  nickname   text not null,
  team_id    uuid references teams (id) on delete set null,
  is_host    boolean not null default false,
  joined_at  timestamptz not null default now()
);
create index if not exists players_room_idx on players (room_id);

-- ---------- 酒譜（跨場次永久保存）----------
create table if not exists recipes (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  base_spirit  text not null default '',
  ingredients  jsonb not null default '[]'::jsonb,   -- [{ "name": "琴酒", "amount": "45ml" }]
  steps        text not null default '',
  notes        text not null default '',
  photo_url    text,
  created_by   text not null default '',
  created_at   timestamptz not null default now()
);

-- ---------- 本場酒單、輪次、選酒、配對 ----------
create table if not exists room_drinks (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references rooms (id) on delete cascade,
  name        text not null,
  recipe_id   uuid references recipes (id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists room_drinks_room_idx on room_drinks (room_id);

create table if not exists rounds (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid not null references rooms (id) on delete cascade,
  round_no    int  not null,
  status      text not null default 'choosing' check (status in ('choosing', 'revealed')),
  created_at  timestamptz not null default now(),
  unique (room_id, round_no)
);

create table if not exists team_choices (
  round_id    uuid not null references rounds (id) on delete cascade,
  team_id     uuid not null references teams (id) on delete cascade,
  room_id     uuid not null references rooms (id) on delete cascade,
  drink_name  text not null,
  recipe_id   uuid references recipes (id) on delete set null,
  updated_at  timestamptz not null default now(),
  primary key (round_id, team_id)
);

create table if not exists pairings (
  round_id      uuid not null references rounds (id) on delete cascade,
  room_id       uuid not null references rooms (id) on delete cascade,
  from_team_id  uuid not null references teams (id) on delete cascade,
  to_team_id    uuid not null references teams (id) on delete cascade,
  primary key (round_id, from_team_id),
  unique (round_id, to_team_id),
  check (from_team_id <> to_team_id)
);

-- =====================================================================
-- 安全規則（RLS）：瀏覽器只能「讀」，所有寫入都走我們自己的伺服器 API
-- =====================================================================
alter table rooms         enable row level security;
alter table room_secrets  enable row level security;
alter table teams         enable row level security;
alter table players       enable row level security;
alter table recipes       enable row level security;
alter table room_drinks   enable row level security;
alter table rounds        enable row level security;
alter table team_choices  enable row level security;
alter table pairings      enable row level security;

do $$
declare t text;
begin
  foreach t in array array['rooms','teams','players','recipes','room_drinks','rounds','team_choices','pairings']
  loop
    if not exists (select 1 from pg_policies where tablename = t and policyname = 'public read') then
      execute format('create policy "public read" on %I for select using (true)', t);
    end if;
  end loop;
end $$;

-- =====================================================================
-- 即時同步（Realtime）：這些表有變動時，推播給訂閱的手機
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array['rooms','teams','players','room_drinks','rounds','team_choices','pairings','recipes']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;

-- =====================================================================
-- 酒譜照片：公開讀取的 Storage bucket（上傳也走伺服器 API）
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;
