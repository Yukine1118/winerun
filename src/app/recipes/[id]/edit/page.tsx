"use client";

import { Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { RecipeForm } from "@/components/RecipeForm";
import { Card } from "@/components/ui";
import { useRecipe } from "@/hooks/useRecipes";

export default function EditRecipePage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-zinc-400">載入中…</p>}>
      <EditRecipe />
    </Suspense>
  );
}

function EditRecipe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { recipe, status } = useRecipe(id);

  return (
    <>
      <PageHeader title="編輯酒譜" back={{ href: `/recipes/${id}`, label: "返回" }} />
      {status === "loading" && <p className="py-20 text-center text-zinc-400">載入中…</p>}
      {status !== "loading" && !recipe && <Card className="text-center text-zinc-400">找不到這份酒譜</Card>}
      {/* key 帶內容：酒譜被改過後再進來，表單會用最新內容重新開始 */}
      {recipe && <RecipeForm key={JSON.stringify(recipe)} recipe={recipe} onSaved={() => router.replace(`/recipes/${id}`)} />}
    </>
  );
}
