// POST /api/recipes/photo：上傳酒譜照片，回傳公開網址
// 手機端會先把照片縮小成 JPEG 再上傳，所以這裡的大小上限抓 3MB 就很夠。
import { randomUUID } from "node:crypto";
import { getAdminSupabase } from "@/lib/supabase/server";
import { RECIPE_PHOTO_BUCKET } from "@/lib/recipe";
import { ApiError, handle } from "@/lib/server/api";

const MAX_BYTES = 3 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const POST = handle(async (req: Request) => {
  let file: FormDataEntryValue | null = null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    throw new ApiError(400, "上傳格式不正確");
  }
  if (!(file instanceof Blob)) throw new ApiError(400, "沒有收到照片");
  const ext = EXTENSIONS[file.type];
  if (!ext) throw new ApiError(400, "只接受 JPG、PNG、WebP 圖片");
  if (file.size > MAX_BYTES) throw new ApiError(400, "照片太大了（上限 3MB）");

  const path = `${randomUUID()}.${ext}`;
  const storage = getAdminSupabase().storage.from(RECIPE_PHOTO_BUCKET);
  const { error } = await storage.upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
    cacheControl: "31536000", // 檔名不會重複，可以讓手機快取一年
  });
  if (error) throw error;

  return { url: storage.getPublicUrl(path).data.publicUrl };
});
