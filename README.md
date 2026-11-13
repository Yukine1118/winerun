# 🍸🏃 酒精路跑

和朋友一起玩的酒精路跑小幫手：房間即時同步、分組、選酒隨機配對、酒譜、拉霸機。

## 第一次設定

1. 到 [Supabase](https://supabase.com) 建立免費專案。
2. 後台 → **SQL Editor** → New query → 貼上 `supabase/migrations/001_init.sql` 全部內容 → **Run**。
3. 複製 `.env.example` 成 `.env.local`，填入專案網址、publishable key、secret key
   （後台 → Project Settings → API Keys）。
4. 安裝並啟動：

```bash
npm install
npm run dev
```

打開 http://localhost:3000 。

## 用手機測試（同一個 Wi-Fi）

`npm run dev` 啟動後，終端機會顯示 `Network: http://192.168.x.x:3000`，用手機瀏覽器開那個網址即可。

## 測試

```bash
npm test
```
