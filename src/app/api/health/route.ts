// GET /api/health：設定檢查頁。只回報「有沒有設定、格式對不對」，不會顯示任何金鑰內容。
import { connection } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/server";

function keyKind(key: string | undefined): string {
  if (!key) return "沒有設定 ❌";
  const k = key.trim();
  if (k.startsWith("sb_secret_")) return "secret key";
  if (k.startsWith("sb_publishable_")) return "publishable key";
  if (k.startsWith("eyJ")) return "舊版 JWT key";
  return "格式看不懂 ❌（應該是 sb_ 開頭）";
}

export async function GET() {
  await connection(); // 每次打開都重新檢查，不要用編譯時的結果

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const report: Record<string, string> = {
    版本: "health-1",
    NEXT_PUBLIC_SUPABASE_URL: !url
      ? "沒有設定 ❌"
      : /^https:\/\/[a-z0-9]+\.supabase\.co\/?$/.test(url)
        ? "格式正確 ✅"
        : "格式不對 ❌（應該像 https://xxxx.supabase.co，後面不能有其他路徑）",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: keyKind(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    SUPABASE_SECRET_KEY: keyKind(process.env.SUPABASE_SECRET_KEY),
  };
  if (report.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === "publishable key") {
    report.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY += " ✅";
  } else if (!report.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.includes("❌")) {
    report.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY += " ❌（這格要填 sb_publishable_ 開頭的）";
  }
  if (report.SUPABASE_SECRET_KEY === "secret key") {
    report.SUPABASE_SECRET_KEY += " ✅";
  } else if (!report.SUPABASE_SECRET_KEY.includes("❌")) {
    report.SUPABASE_SECRET_KEY += " ❌（這格要填 sb_secret_ 開頭的）";
  }

  // 實際連一次資料庫看看
  for (const table of ["rooms", "room_secrets"]) {
    try {
      const { error } = await getAdminSupabase().from(table).select("*").limit(1);
      report[`讀取 ${table}`] = error ? `失敗 ❌ ${error.code ?? ""} ${error.message}` : "成功 ✅";
    } catch (err) {
      report[`讀取 ${table}`] = `失敗 ❌ ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return Response.json(report);
}
