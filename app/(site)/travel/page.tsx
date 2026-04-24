import type { Metadata } from "next";
import { TravelForm } from "./_components/travel-form";

export const metadata: Metadata = {
  title: "travel",
  description: "목적지·기간·분위기만 알려주면 하나의 확정안을 드립니다.",
};

export default function TravelPage() {
  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--paper)] p-7 shadow-[var(--shadow-soft)] sm:p-10">
        <div
          aria-hidden
          className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[var(--accent-soft)]"
        />
        <div
          aria-hidden
          className="absolute bottom-8 right-8 hidden h-24 w-36 rotate-[-8deg] rounded-3xl border border-[var(--line)] bg-white/55 sm:block"
        />
        <div className="relative max-w-2xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
            travel concierge
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--ink)] sm:text-5xl sm:leading-tight">
            이번 여행,
            <br />
            하나만 고르면 되게.
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--muted)]">
            목적지와 날짜, 그리고 같이 가는 사람의 맥락만 알려주세요.
            선택지는 숨기고 바로 실행할 수 있는 하나의 확정안을 만듭니다.
          </p>
        </div>
        <p className="relative mt-6 inline-flex rounded-full border border-[var(--accent)]/25 bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--accent-strong)]">
          지금은 국내 여행을 더 잘 맞춥니다. 해외 여행은 다음 이터레이션에서 지원 예정.
        </p>
      </header>

      <TravelForm />
    </div>
  );
}
