// PWA 設定：讓手機可以把這個網站「加到主畫面」，像 App 一樣全螢幕開啟
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "酒精路跑",
    short_name: "酒精路跑",
    description: "和朋友一起玩的酒精路跑小幫手：分組、抽酒、酒譜、拉霸機",
    lang: "zh-Hant",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
