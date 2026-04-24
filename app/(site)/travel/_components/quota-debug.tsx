"use client";

// TODO: 429 안정화되면 이 파일 + lib/server/quota-store.ts + /api/quota 제거

import { useEffect, useState } from "react";

export type LastCall = {
  model: string;
  prompt: number;
  output: number;
  thoughts?: number;
  total: number;
};

type BlockedInfo = { since: number; until: number; retryMs: number };
type QuotaDim = "rpm" | "tpm" | "rpd";

type ModelSnapshot = {
  model: string;
  rpmUsed: number;
  rpmLimit: number;
  rpdUsed: number;
  rpdLimit: number;
  blocked: Partial<Record<QuotaDim, BlockedInfo>>;
};

type QuotaResponse =
  | { configured: true; byModel: ModelSnapshot[]; tpmUsed: number; tpmLimit: number }
  | { configured: false };

const REFRESH_MS = 15_000;

export function QuotaDebug({ lastCall }: { lastCall?: LastCall }) {
  const [snapshot, setSnapshot] = useState<QuotaResponse | null>(null);
  const [tick, setTick] = useState(0);

  async function fetchSnapshot() {
    try {
      const res = await fetch("/api/quota", { cache: "no-store" });
      const json = (await res.json()) as QuotaResponse;
      setSnapshot(json);
    } catch {
      // 네트워크 일시 장애는 무시 — 다음 틱에 재시도
    }
  }

  useEffect(() => {
    void fetchSnapshot();
  }, [lastCall]);

  useEffect(() => {
    const id = setInterval(() => {
      void fetchSnapshot();
      setTick((t) => t + 1);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  if (!lastCall && !snapshot) return null;

  return (
    <aside className="mt-8 space-y-3 rounded-xl border border-dashed border-[var(--line)] bg-white/70 p-3 text-xs text-[var(--muted)]">
      <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">디버그 (임시)</p>

      {lastCall && (
        <section>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">이번 요청 토큰</p>
          <p className="mt-1 font-mono">
            <span className="text-[var(--muted)]">{lastCall.model}</span>
            {" · "}
            입력 {lastCall.prompt.toLocaleString()} + 출력 {lastCall.output.toLocaleString()}
            {typeof lastCall.thoughts === "number" &&
              ` (thinking ${lastCall.thoughts.toLocaleString()})`}
            {" = "}
            <span className="font-semibold text-[var(--ink)]">
              {lastCall.total.toLocaleString()}
            </span>{" "}
            토큰
          </p>
        </section>
      )}

      {snapshot?.configured === true && (
        <section className="space-y-1" key={tick}>
          <p className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            서버 쿼터 (Upstash 누적 · free tier)
          </p>
          <div className="space-y-1 font-mono">
            {snapshot.byModel.map((m) => (
              <ModelLine key={m.model} m={m} />
            ))}
            <div>
              <span className="text-[var(--muted)]">TPM 합계</span>
              {" · "}
              <Bar used={snapshot.tpmUsed} limit={snapshot.tpmLimit} />
            </div>
          </div>
          <p className="pt-0.5 text-[10px] text-[var(--muted)]">
            RPM/TPM = 최근 60초 · RPD = 마지막 Pacific 자정 이후 (한국시간 오후 리셋, DST 에 따라 16-17시)
          </p>
        </section>
      )}

      {snapshot?.configured === false && (
        <p className="text-[10px] text-[var(--muted)]">
          서버 쿼터 추적 미설정 (Upstash Redis 미연결). 이번 요청 토큰만 표시됨.
        </p>
      )}
    </aside>
  );
}

function ModelLine({ m }: { m: ModelSnapshot }) {
  return (
    <div className="space-y-0.5">
      <div>
        <span className="text-[var(--muted)]">{m.model}</span>
        {" · RPM "}
        <Bar used={m.rpmUsed} limit={m.rpmLimit} />
        {" · RPD "}
        <Bar used={m.rpdUsed} limit={m.rpdLimit} />
      </div>
      {(["rpm", "tpm", "rpd"] as QuotaDim[]).map((dim) => {
        const b = m.blocked[dim];
        if (!b) return null;
        return <BlockedBadge key={dim} dim={dim} info={b} />;
      })}
    </div>
  );
}

function BlockedBadge({ dim, info }: { dim: QuotaDim; info: BlockedInfo }) {
  const remainingMs = Math.max(0, info.until - Date.now());
  return (
    <div className="pl-4 text-[11px] text-rose-600">
      ⚠ {dim.toUpperCase()} 서버 소진 — 약 {formatDuration(remainingMs)} 뒤 복구 예상
    </div>
  );
}

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.ceil(ms / 1000)}초`;
  if (ms < 60 * 60_000) return `${Math.ceil(ms / 60_000)}분`;
  const hours = Math.floor(ms / (60 * 60_000));
  const mins = Math.round((ms - hours * 60 * 60_000) / 60_000);
  return mins > 0 ? `${hours}시간 ${mins}분` : `${hours}시간`;
}

function Bar({ used, limit }: { used: number; limit: number }) {
  const remaining = Math.max(0, limit - used);
  const pct = Math.min(1, used / limit);
  const tone =
    pct < 0.5
      ? "text-[var(--muted)]"
      : pct < 0.9
        ? "text-amber-700"
        : "text-rose-600";
  return (
    <span className={tone}>
      {used.toLocaleString()}/{limit.toLocaleString()} (남음 {remaining.toLocaleString()})
    </span>
  );
}
