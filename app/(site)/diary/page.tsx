import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "diary",
  description: "태훈 오너십 서비스 · 준비 중",
};

export default function DiaryPage() {
  return (
    <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--paper)]/75 p-7 shadow-[var(--shadow-soft)]">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)] sm:text-3xl">diary</h1>
      <p className="mt-3 text-[var(--muted)]">
        태훈이 만들 서비스가 들어올 자리입니다. 준비 중.
      </p>
    </div>
  );
}
