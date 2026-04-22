import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "diary",
  description: "태훈 오너십 서비스 · 준비 중",
};

export default function DiaryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">diary</h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        태훈이 만들 서비스가 들어올 자리입니다. 준비 중.
      </p>
    </div>
  );
}
