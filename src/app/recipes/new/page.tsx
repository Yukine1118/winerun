"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { RecipeForm, type RecipeDraft } from "@/components/RecipeForm";
import { takeRecipeDraft } from "@/lib/recipeDraft";

export default function NewRecipePage() {
  const router = useRouter();
  // 拉霸機「存成酒譜」會先把內容放進草稿，這裡讀出來預先填好
  const [draft, setDraft] = useState<RecipeDraft | null | undefined>(undefined);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 讀取這支手機暫存的草稿
    setDraft(takeRecipeDraft());
  }, []);

  return (
    <>
      <PageHeader title="新增酒譜" back={{ href: "/recipes", label: "酒譜" }} />
      {draft !== undefined && (
        <RecipeForm draft={draft ?? undefined} onSaved={(r) => router.replace(`/recipes/${r.id}`)} />
      )}
    </>
  );
}
