import Link from "next/link";
import type { Metadata } from "next";
import { TravelForm } from "../_components/travel-form";
import { getTravelShare, isShareId } from "@/lib/server/travel-share-store";

type Props = {
  params: Promise<{ shareId: string }>;
};

export const metadata: Metadata = {
  title: "shared travel",
  description: "공유받은 여행 계획을 확인하고 다시 수정해 만들 수 있습니다.",
};

export default async function SharedTravelPage({ params }: Props) {
  const { shareId } = await params;
  const snapshot = isShareId(shareId) ? await getTravelShare(shareId) : null;

  if (!snapshot) {
    return (
      <div className="space-y-6">
        <header className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">travel</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            공유 링크가 만료되었거나 찾을 수 없습니다.
          </p>
        </header>
        <Link
          href="/travel"
          className="inline-flex rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          새 여행 계획 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">travel</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          공유받은 입력값과 여행 계획입니다. 필요한 부분을 고쳐서 다시 만들 수 있어요.
        </p>
        <p className="inline-block rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
          {formatSharedDate(snapshot.expiresAt)}까지 열 수 있습니다.
        </p>
      </header>

      <TravelForm
        initialInput={snapshot.input}
        initialPlan={snapshot.plan}
        initialModel={snapshot.model}
      />
    </div>
  );
}

function formatSharedDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "7일 동안";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
