// POST /api/recipes：新增酒譜（任何人都可以）
import { getAdminSupabase } from "@/lib/supabase/server";
import { handle, readJson } from "@/lib/server/api";
import { requireRecipeInput } from "@/lib/server/recipes";

export const POST = handle(async (req: Request) => {
  const input = requireRecipeInput(await readJson(req));
  const { data, error } = await getAdminSupabase().from("recipes").insert(input).select().single();
  if (error) throw error;
  return { recipe: data };
});
