"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button, Card, ErrorText, Input } from "@/components/ui";
import { callApi } from "@/lib/apiClient";
import { resizeImage } from "@/lib/imageResize";
import { BASE_SPIRITS } from "@/lib/recipe";
import { lastNickname } from "@/lib/session";
import type { RecipeDraftData } from "@/lib/recipeDraft";
import type { Ingredient, Recipe } from "@/lib/types";

export type RecipeDraft = RecipeDraftData;

const labelClass = "mb-1 block text-sm text-zinc-400";
const fieldClass =
  "w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none";

export function RecipeForm({
  recipe,
  draft,
  onSaved,
}: {
  /** 有值 = 編輯既有的酒譜 */
  recipe?: Recipe;
  /** 新增時預先填好的內容（例如從拉霸機帶過來） */
  draft?: RecipeDraft;
  onSaved: (recipe: Recipe) => void;
}) {
  const start = recipe ?? draft;
  const [name, setName] = useState(start?.name ?? "");
  const [baseSpirit, setBaseSpirit] = useState(start?.base_spirit ?? "");
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    start?.ingredients?.length ? start.ingredients : [{ name: "", amount: "" }],
  );
  const [steps, setSteps] = useState(recipe?.steps ?? "");
  const [notes, setNotes] = useState(recipe?.notes ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(recipe?.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 選單裡沒有的基酒（舊資料或自訂）也要能顯示
  const spiritOptions: string[] =
    baseSpirit && !(BASE_SPIRITS as readonly string[]).includes(baseSpirit)
      ? [...BASE_SPIRITS, baseSpirit]
      : [...BASE_SPIRITS];

  function updateIngredient(index: number, patch: Partial<Ingredient>) {
    setIngredients((list) => list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function pickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 讓同一張照片可以重選
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const small = await resizeImage(file);
      const form = new FormData();
      form.append("file", small, "photo.jpg");
      const res = await fetch("/api/recipes/photo", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "照片上傳失敗");
      setPhotoUrl(data.url);
    } catch (err) {
      setError((err as Error).message || "照片上傳失敗");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        name,
        base_spirit: baseSpirit,
        ingredients,
        steps,
        notes,
        photo_url: photoUrl,
        created_by: recipe?.created_by ?? lastNickname(),
      };
      const res = recipe
        ? await callApi<{ recipe: Recipe }>(`/api/recipes/${recipe.id}`, body, { method: "PATCH" })
        : await callApi<{ recipe: Recipe }>("/api/recipes", body);
      onSaved(res.recipe);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      // 一定要解除「儲存中」：Next.js 會保留離開的頁面，不解除的話下次回來按鈕會卡住
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="recipe-name">
            名稱 *
          </label>
          <Input
            id="recipe-name"
            value={name}
            maxLength={40}
            placeholder="例如：琴通寧"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="recipe-base">
            基酒
          </label>
          <select
            id="recipe-base"
            className={fieldClass}
            value={baseSpirit}
            onChange={(e) => setBaseSpirit(e.target.value)}
          >
            <option value="">（不指定）</option>
            {spiritOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <span className={labelClass}>材料與份量</span>
        {ingredients.map((item, i) => (
          <div key={i} className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Input
                aria-label={`材料 ${i + 1}`}
                placeholder="材料"
                value={item.name}
                maxLength={30}
                onChange={(e) => updateIngredient(i, { name: e.target.value })}
              />
            </div>
            <div className="w-24 shrink-0">
              <Input
                aria-label={`份量 ${i + 1}`}
                placeholder="份量"
                value={item.amount}
                maxLength={20}
                onChange={(e) => updateIngredient(i, { amount: e.target.value })}
              />
            </div>
            <button
              type="button"
              aria-label={`移除材料 ${i + 1}`}
              className="shrink-0 px-2 text-xl text-zinc-500"
              onClick={() =>
                setIngredients((list) =>
                  list.length > 1 ? list.filter((_, j) => j !== i) : [{ name: "", amount: "" }],
                )
              }
            >
              ×
            </button>
          </div>
        ))}
        {ingredients.length < 20 && (
          <Button
            type="button"
            variant="ghost"
            className="self-start"
            onClick={() => setIngredients((list) => [...list, { name: "", amount: "" }])}
          >
            ＋ 加一項材料
          </Button>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div>
          <label className={labelClass} htmlFor="recipe-steps">
            做法
          </label>
          <textarea
            id="recipe-steps"
            className={fieldClass}
            rows={4}
            maxLength={2000}
            value={steps}
            placeholder="例如：杯中加滿冰塊，倒入琴酒，補滿通寧水，輕輕攪拌。"
            onChange={(e) => setSteps(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="recipe-notes">
            備註
          </label>
          <textarea
            id="recipe-notes"
            className={fieldClass}
            rows={2}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <span className={labelClass}>照片（可選）</span>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- 照片在 Supabase，用一般 img 最單純
          <img src={photoUrl} alt="酒譜照片" className="max-h-64 w-full rounded-xl object-cover" />
        )}
        <div className="flex gap-2">
          <label className="flex min-h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 font-semibold">
            {uploading ? "上傳中…" : photoUrl ? "換一張" : "📷 選擇照片"}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={pickPhoto} />
          </label>
          {photoUrl && (
            <Button type="button" variant="ghost" onClick={() => setPhotoUrl(null)}>
              移除
            </Button>
          )}
        </div>
      </Card>

      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={saving || uploading || !name.trim()}>
        {saving ? "儲存中…" : recipe ? "儲存修改" : "新增酒譜"}
      </Button>
    </form>
  );
}
