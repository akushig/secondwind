import Link from "next/link";
import { ServiceCard } from "@/components/common/service-card";

export default function LandingPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          덜 짜도 되는 도구들
        </h1>
        <p className="max-w-prose text-neutral-600 dark:text-neutral-300">
          secondwind 는 3명 (지헌·태훈·덕우) 이 같이 운영하는 작은 실험장입니다.
          각자 하나씩 서비스를 올리고, 인프라·UI·배포만 공유합니다.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link href="/travel" className="block">
          <ServiceCard
            title="travel"
            owner="지헌"
            status="ready"
            summary="J 강박에 쓰이는 여행 계획. 더 적은 결정으로 하나의 확정안을 받습니다."
          />
        </Link>
        <ServiceCard
          title="diary"
          owner="태훈"
          status="coming-soon"
          summary="준비 중"
        />
        <ServiceCard
          title="experiment-3"
          owner="덕우"
          status="coming-soon"
          summary="준비 중"
        />
      </section>
    </div>
  );
}
