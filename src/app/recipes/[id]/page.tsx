"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Button, Card, ErrorText } from "@/components/ui";
import { useAction } from "@/hooks/useAction";
import { useRecipe } from "@/hooks/useRecipes";
import { callApi } from "@/lib/apiClient";
import { lastRoom } from "@/lib/session";

export default function RecipePage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-zinc-400">載入中…</p>}>
      <RecipeDetail />
    </Suspense>
  );
}

function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { recipe, status } = useRecipe(id);
  const { busy, error, run } = useAction();
  const [room, setRoom] = useState<ReturnType<typeof lastRoom>>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- 每次回到這頁都重新讀取房間 */
    setRoom(lastRoom());
    setAdded(false);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const header = <PageHeader title="酒譜" back={{ href: "/recipes", label: "酒譜" }} />;
  if (status === "loading") return <>{header}<p className="py-20 text-center text-zinc-400">載入中…</p></>;
  if (status !== "ready" || !recipe) {
    return (
      <>
        {header}
        <Card className="text-center text-zinc-400">
          {status === "not-found" ? "找不到這份酒譜（可能已經被刪除）" : "讀取失敗，請重新整理"}
        </Card>
      </>
    );
  }

  async function addToRoom() {
    if (!room || !recipe) return;
    const ok = await run(() =>
      callApi(`/api/rooms/${room.code}/drinks`, {
        playerId: room.session.playerId,
        name: recipe.name,
        recipeId: recipe.id,
      }),
    );
    if (ok) setAdded(true);
  }

  async function remove() {
    if (!recipe || !confirm(`確定刪除「${recipe.name}」？刪除後無法復原`)) return;
    const ok = await run(() => callApi(`/api/recipes/${recipe.id}`, {}, { method: "DELETE" }));
    if (ok) router.replace("/recipes");
  }

  return (
    <>
      <PageHeader
        title={recipe.name}
        back={{ href: "/recipes", label: "酒譜" }}
        action={
          <Link href={`/recipes/${recipe.id}/edit`} className="text-amber-300">
            編輯
          </Link>
        }
      />

      {recipe.photo_url && (
        // eslint-disable-next-line @next/next/no-img-element -- 照片在 Supabase，用一般 img 最單純
        <img src={recipe.photo_url} alt={recipe.name} className="max-h-80 w-full rounded-2xl object-cover" />
      )}

      <Card>
        <h2 className="text-2xl font-black">{recipe.name}</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {[recipe.base_spirit && `基酒：${recipe.base_spirit}`, recipe.created_by && `by ${recipe.created_by}`]
            .filter(Boolean)
            .join("｜")}
        </p>
      </Card>

      {recipe.ingredients.length > 0 && (
        <Card>
          <h3 className="mb-2 font-bold">材料</h3>
          <ul className="flex flex-col divide-y divide-zinc-800">
            {recipe.ingredients.map((item, i) => (
              <li key={i} className="flex justify-between gap-4 py-2">
                <span>{item.name}</span>
                <span className="shrink-0 text-zinc-400">{item.amount}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {recipe.steps && (
        <Card>
          <h3 className="mb-2 font-bold">做法</h3>
          <p className="whitespace-pre-wrap text-zinc-200">{recipe.steps}</p>
        </Card>
      )}
      {recipe.notes && (
        <Card>
          <h3 className="mb-2 font-bold">備註</h3>
          <p className="whitespace-pre-wrap text-zinc-300">{recipe.notes}</p>
        </Card>
      )}

      <ErrorText>{error}</ErrorText>

      {room &&
        (added ? (
          <Link
            href={`/room/${room.code}`}
            className="rounded-xl bg-emerald-600 py-3 text-center font-semibold text-white"
          >
            ✓ 已加入酒單，回房間 {room.code}
          </Link>
        ) : (
          <Button disabled={busy} onClick={addToRoom}>
            ＋ 加入本場酒單（房間 {room.code}）
          </Button>
        ))}

      <Button variant="ghost" className="text-rose-400" disabled={busy} onClick={remove}>
        刪除這份酒譜
      </Button>
    </>
  );
}
