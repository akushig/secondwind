// 서버 전용: Upstash Redis 로 Naver Local Search 일일 호출 수를 누적한다.
// KV 환경변수가 없으면 모든 함수가 no-op / null 로 동작해 빌드·런타임을 방해하지 않는다.
//
// 데이터 구조:
//   sw:naver:daily:{YYYY-MM-DD}    STRING (Redis INCR), TTL ~25h
//
// 키가 KST 자정 기준 일일 단위라 별도 cron 없이 자동 리셋.

import { Redis } from "@upstash/redis";

const DAY_TTL_SECONDS = 25 * 60 * 60; // 25시간 — 자정 경계 여유

// 2026-04 기준 Naver Open API 무료 플랜 일일 호출 한도 (지역검색).
export const NAVER_DAILY_LIMIT = 25_000;

export type NaverQuotaSnapshot = {
  configured: true;
  date: string; // YYYY-MM-DD (KST)
  used: number;
  limit: number;
};

export type NaverQuotaUnavailable = { configured: false };

let cachedClient: Redis | null | undefined;

function getClient(): Redis | null {
  if (cachedClient === undefined) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    cachedClient = url && token ? new Redis({ url, token }) : null;
  }
  return cachedClient;
}

export function isNaverQuotaConfigured(): boolean {
  return getClient() !== null;
}

function todayKstDate(): string {
  // KST = UTC+9. Naver 의 일일 카운터는 KST 자정 기준이 자연.
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

function dailyKey(date: string): string {
  return `sw:naver:daily:${date}`;
}

export async function recordNaverCalls(count: number): Promise<void> {
  if (count <= 0) return;
  const redis = getClient();
  if (!redis) return;
  const date = todayKstDate();
  const key = dailyKey(date);
  try {
    const newValue = await redis.incrby(key, count);
    // 첫 카운트면 TTL 설정 (incrby 후 expire 멱등하지만 Redis 에 한 번만 보내도 OK)
    if (newValue === count) {
      await redis.expire(key, DAY_TTL_SECONDS);
    }
  } catch {
    // KV 일시 장애는 무시 — 다음 호출에서 재시도
  }
}

export async function getNaverDailySnapshot(): Promise<NaverQuotaSnapshot | NaverQuotaUnavailable> {
  const redis = getClient();
  if (!redis) return { configured: false };
  const date = todayKstDate();
  try {
    const raw = await redis.get<number | string>(dailyKey(date));
    const used = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 0;
    return {
      configured: true,
      date,
      used: Number.isFinite(used) ? used : 0,
      limit: NAVER_DAILY_LIMIT,
    };
  } catch {
    return { configured: true, date, used: 0, limit: NAVER_DAILY_LIMIT };
  }
}
