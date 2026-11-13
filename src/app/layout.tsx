import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "酒精路跑",
  description: "和朋友一起玩的酒精路跑小幫手：分組、抽酒、酒譜、拉霸機",
  appleWebApp: { capable: true, title: "酒精路跑", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full">
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </main>
      </body>
    </html>
  );
}
