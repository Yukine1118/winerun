// 伺服器專用的 Supabase 連線：用「秘密金鑰」，可以寫入資料。
// ⚠️ 只能在 src/app/api/** 裡使用，絕對不能被瀏覽器的程式碼 import。
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error("getAdminSupabase() 只能在伺服器端使用");
  }
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SECRET_KEY，請檢查 .env.local");
  }
  admin = createClient(url, key, { auth: { persistSession: false } });
  return admin;
}
