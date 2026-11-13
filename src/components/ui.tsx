// 共用的小元件：按鈕、卡片、輸入框（統一手機上的大小與風格）
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-amber-400 text-zinc-950 hover:bg-amber-300 active:bg-amber-500",
  secondary: "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700",
  ghost: "bg-transparent text-zinc-300 hover:bg-zinc-800",
  danger: "bg-rose-600 text-white hover:bg-rose-500",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`min-h-12 rounded-xl px-4 py-3 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 ${className}`}>
      {children}
    </section>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none ${className}`}
      {...props}
    />
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-rose-400">{children}</p>;
}
