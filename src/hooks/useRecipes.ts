// 讀取酒譜（酒譜不屬於任何房間，所有人共用）
"use client";

import { useCallback, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { Recipe } from "@/lib/types";

const errorMessage = (err: unknown) =>
  err && typeof err === "object" && "message" in err ? String(err.message) : String(err);

/** 全部酒譜（新的在前）。recipes 為 null 代表還在載入。 */
export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const { data, error } = await getBrowserSupabase()
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRecipes(data as Recipe[]);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 第一次進頁面要抓資料
    reload();
  }, [reload]);

  return { recipes, error, reload };
}

/** 單一酒譜。status：loading / ready / not-found / error */
export function useRecipe(id: string) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "not-found" | "error">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await getBrowserSupabase()
          .from("recipes")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (!alive) return;
        if (error) throw error;
        setRecipe(data as Recipe | null);
        setStatus(data ? "ready" : "not-found");
      } catch {
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  return { recipe, status };
}
