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
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !key && "SUPABASE_SECRET_KEY",
  ].filter(Boolean);
  if (!url || !key) {
    throw new Error(`缺少環境變數 ${missing.join("、")}`);
  }
  // 貼上時常會多帶空白或換行，順手去掉
  admin = createClient(url.trim(), key.trim(), { auth: { persistSession: false } });
  return admin;
}
