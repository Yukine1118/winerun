"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { RecipeForm, type RecipeDraft } from "@/components/RecipeForm";
import { takeRecipeDraft } from "@/lib/recipeDraft";

export default function NewRecipePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState<RecipeDraft | undefined>(undefined);
  // Next.js 會保留離開的頁面（包含表單內容）。formKey 一變，表單就整個重新開始。
  const [formKey, setFormKey] = useState(0);

  // 拉霸機「存成酒譜」會先把內容放進草稿，這裡讀出來預先填好
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 讀取這支手機暫存的草稿 */
    const incoming = takeRecipeDraft();
    if (incoming) {
      setDraft(incoming);
      setFormKey((k) => k + 1);
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  return (
    <>
      <PageHeader title="新增酒譜" back={{ href: "/recipes", label: "酒譜" }} />
      {ready && (
        <RecipeForm
          key={formKey}
          draft={draft}
          onSaved={(r) => {
            // 存好後清空表單，下次進來就是全新的一份
            setDraft(undefined);
            setFormKey((k) => k + 1);
            router.replace(`/recipes/${r.id}`);
          }}
        />
      )}
    </>
  );
}
