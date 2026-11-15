# 酒精路跑 App — 給 Claude（和自己）看的專案說明

@AGENTS.md

給朋友在「酒精路跑」活動用的手機網頁 App（PWA）。開連結就能用，不需登入。
介面文字一律**繁體中文**；程式碼註解用中文、commit 訊息用英文。

## 技術選擇
- **Next.js 16（App Router）+ TypeScript + Tailwind v4**，手機優先（版面最大寬度 `max-w-md`）
  - ⚠️ Next 16 和舊版差很多（例如 `params` 是 Promise、`cacheComponents` 開啟時用到 `useParams` 要包 `<Suspense>`）。
    寫之前先查 `node_modules/next/dist/docs/`。
  - ⚠️ **離開的頁面會被保留**（React Activity，最多 3 頁）：表單內容、`saving` 之類的 state 回來時還在。
    送出後一定要在 `finally` 解除 busy 狀態；需要全新表單時用 `key` 重設（見 `src/app/recipes/new/page.tsx`）。
- **Supabase**：PostgreSQL 資料庫 + Realtime 即時同步 + Storage（酒譜照片）
  - 選它而不是 Firebase：Firebase Storage 新專案需要付費方案；Supabase 免費方案就夠。
- **Vercel** 免費方案部署
- **Vitest** 單元測試

## 指令
| 指令 | 用途 |
|---|---|
| `npm install` | 安裝套件（第一次或 package.json 變動後） |
| `npm run dev` | 本機開發伺服器 http://localhost:3000 |
| `npm test` | 跑單元測試 |
| `npm run lint` | 檢查程式碼風格 |
| `npm run build` | 正式編譯（部署前確認不會壞） |

環境變數放在 `.env.local`（範本：`.env.example`，**不可 commit**）。

## 架構規則（重要）
1. **瀏覽器只讀、伺服器才寫**：
   - 瀏覽器用 `src/lib/supabase/client.ts`（publishable key），只做 `select` 與 Realtime 訂閱。
   - 所有寫入都經過 `src/app/api/**/route.ts`，用 `src/lib/supabase/server.ts`（secret key）。
   - 資料庫 RLS 只開「public read」，沒有任何寫入 policy。`room_secrets` 完全不可讀。
2. **主持人權限**：建房時產生 host token，只存在主持人手機 localStorage；資料庫只存 SHA-256 雜湊。
   主持人 API 用 `requireHost(req, code)`（讀 `x-host-token` header）檢查。
3. **玩家身分**：`src/lib/session.ts` 把 `{roomId, playerId, nickname, hostToken?}` 存在 localStorage。
4. **即時同步**：`src/hooks/useRoomRealtime.ts` 訂閱房間相關資料表，任何變動 → 150ms 後重抓整份房間資料。
   新增和房間有關的資料表時，記得：加 `room_id` 欄位、加進 hook 的 `ROOM_TABLES`、加進 SQL 的 Realtime publication。
5. **資料表**定義在 `supabase/migrations/*.sql`，型別對應 `src/lib/types.ts`。改資料表要新增一個編號更大的 SQL 檔，不要改舊的。
6. API 錯誤用 `throw new ApiError(狀態碼, "中文訊息")`，外層 `handle()` 會轉成 `{ error }` JSON。
7. 純邏輯（配對、分組、代碼產生）放 `src/lib/*.ts` 並寫 `*.test.ts`。

## 核心規則：配對演算法（`src/lib/pairing.ts`）
- 每組的酒送給另一組喝：每組恰好送出一次、恰好收到一次、不能送給自己（無固定點的隨機排列）。
- 1 組 → 無法配對；2 組 → 互換。
- **每一輪都是獨立隨機**（使用者的決定）：不看之前幾輪的結果，同樣的配對可以再出現。
  `generatePairing` 仍支援 `forbidden` 參數（有測試），但伺服器目前不使用。

## 房間流程（`rooms.status`）
`lobby`（分組）→ 主持人「開始選酒」→ `choosing` → 主持人「公布結果」→ `revealed` → 「下一輪」回到 `choosing`，或「回到分組」回到 `lobby`。
- 新增 / 刪除 / 隨機分組只能在 `lobby` 做（`requireLobby`）。
- 配對在「公布」那一刻才由伺服器產生（`rounds/reveal`），寫入前用 `validatePairing` 再檢查一次。

## 在 Claude 雲端環境測試的限制
- 伺服器 API 可以直接連 Supabase 測（secret key 由代理注入，啟動時加 `NODE_USE_ENV_PROXY=1`）。
- 瀏覽器端（畫面、Realtime）在雲端環境測不了，要請使用者在 Vercel 網址上用手機驗收。
- `/api/health` 可以檢查部署環境的設定是否正確。

## 開發流程
- 分階段開發，每階段完成要能實際操作，並說明本機執行方式與驗收清單。
- 每完成一個功能就 commit（英文、簡短）。
- 需要花錢或需要使用者決定的事，先問。
