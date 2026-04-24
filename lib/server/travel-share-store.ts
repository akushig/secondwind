// 서버 전용: travel 공유 스냅샷을 Upstash Redis 에 7일 TTL 로 저장한다.

import { Redis } from "@upstash/redis";
import { randomBytes } from "crypto";
import {
  isTravelPlan,
  normalizeTravelInput,
  type TravelInput,
  type TravelPlan,
} from "@/lib/common/services/travel";

export const TRAVEL_SHARE_TTL_SECONDS = 7 * 24 * 60 * 60;
const ID_LENGTH = 6;
const MAX_ID_ATTEMPTS = 12;
const ID_CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

export type TravelShareSnapshot = {
  input: TravelInput;
  plan: TravelPlan;
  model?: string;
  createdAt: string;
  expiresAt: string;
};

let cachedClient: Redis | null | undefined;

function getClient(): Redis | null {
  if (cachedClient === undefined) {
    const url = process.env.KV_REST_API_URL;
    const token = process.env.KV_REST_API_TOKEN;
    cachedClient = url && token ? new Redis({ url, token }) : null;
  }
  return cachedClient;
}

export function isTravelShareConfigured(): boolean {
  return getClient() !== null;
}

function shareKey(id: string): string {
  return `sw:travel:share:${id}`;
}

export function isShareId(id: string): boolean {
  return new RegExp(`^[0-9A-Za-z]{${ID_LENGTH}}$`).test(id);
}

export async function createTravelShare(input: TravelInput, plan: TravelPlan, model?: string): Promise<{
  id: string;
  snapshot: TravelShareSnapshot;
} | null> {
  const redis = getClient();
  if (!redis) return null;

  const now = Date.now();
  const snapshot: TravelShareSnapshot = {
    input,
    plan,
    model,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TRAVEL_SHARE_TTL_SECONDS * 1000).toISOString(),
  };

  for (let attempt = 0; attempt < MAX_ID_ATTEMPTS; attempt += 1) {
    const id = generateShareId();
    const key = shareKey(id);
    const exists = await redis.exists(key);
    if (exists) continue;
    await redis.set(key, JSON.stringify(snapshot), { ex: TRAVEL_SHARE_TTL_SECONDS });
    return { id, snapshot };
  }

  throw new Error("share-id-collision");
}

export async function getTravelShare(id: string): Promise<TravelShareSnapshot | null> {
  if (!isShareId(id)) return null;
  const redis = getClient();
  if (!redis) return null;

  const raw = await redis.get(shareKey(id));
  return parseSnapshot(raw);
}

export function parseSnapshot(raw: unknown): TravelShareSnapshot | null {
  const parsed = parseJsonSafe(raw);
  if (!parsed) return null;
  const input = normalizeTravelInput(parsed.input);
  if (!input || !isTravelPlan(parsed.plan)) return null;
  const model = typeof parsed.model === "string" ? parsed.model : undefined;
  const createdAt = typeof parsed.createdAt === "string" ? parsed.createdAt : "";
  const expiresAt = typeof parsed.expiresAt === "string" ? parsed.expiresAt : "";
  if (!createdAt || Number.isNaN(Date.parse(createdAt))) return null;
  if (!expiresAt || Number.isNaN(Date.parse(expiresAt))) return null;
  return { input, plan: parsed.plan, model, createdAt, expiresAt };
}

function generateShareId(): string {
  const bytes = randomBytes(ID_LENGTH);
  let out = "";
  for (const byte of bytes) {
    out += ID_CHARS[byte % ID_CHARS.length];
  }
  return out;
}

function parseJsonSafe(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
