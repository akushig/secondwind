import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "experiment-3",
  description: "덕우 오너십 서비스 · 준비 중",
};

export default function ExperimentThreePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">experiment-3</h1>
      <p className="text-neutral-600 dark:text-neutral-300">
        덕우가 만들 서비스가 들어올 자리입니다. 준비 중.
      </p>
    </div>
  );
}
