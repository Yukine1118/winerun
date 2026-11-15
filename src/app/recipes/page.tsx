"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Card, Input } from "@/components/ui";
import { useRecipes } from "@/hooks/useRecipes";
import { filterRecipes, usedBaseSpirits } from "@/lib/recipe";

export default function RecipesPage() {
  const { recipes, error } = useRecipes();
  const [query, setQuery] = useState("");
  const [base, setBase] = useState("");

  const bases = usedBaseSpirits(recipes ?? []);
  const shown = filterRecipes(recipes ?? [], query, base);

  const chip = (value: string, label: string) => (
    <button
      key={value}
      onClick={() => setBase(value)}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
        base === value ? "bg-amber-400 text-zinc-950" : "bg-zinc-800 text-zinc-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <PageHeader
        title="📖 酒譜"
        action={
          <Link href="/recipes/new" className="font-semibold text-amber-300">
            ＋ 新增
          </Link>
        }
      />

      <Input
        type="search"
        placeholder="搜尋名稱或材料"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {bases.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {chip("", "全部")}
          {bases.map((b) => chip(b, b))}
        </div>
      )}

      {error && <p className="text-sm text-rose-400">讀取失敗：{error}</p>}
      {!recipes && !error && <p className="py-10 text-center text-zinc-400">載入中…</p>}

      {recipes && recipes.length === 0 && (
        <Card className="text-center text-zinc-400">
          還沒有任何酒譜，
          <Link href="/recipes/new" className="text-amber-300 underline">
            來新增第一份
          </Link>
          吧！
        </Card>
      )}
      {recipes && recipes.length > 0 && shown.length === 0 && (
        <p className="py-6 text-center text-zinc-500">沒有符合的酒譜</p>
      )}

      <ul className="flex flex-col gap-2">
        {shown.map((r) => (
          <li key={r.id}>
            <Link
              href={`/recipes/${r.id}`}
              className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3"
            >
              {r.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- 照片在 Supabase，用一般 img 最單純
                <img src={r.photo_url} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-2xl">
                  🍸
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-bold">{r.name}</span>
                <span className="block truncate text-sm text-zinc-400">
                  {[r.base_spirit, r.ingredients.map((i) => i.name).join("、")].filter(Boolean).join("｜") ||
                    "（沒有填材料）"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
