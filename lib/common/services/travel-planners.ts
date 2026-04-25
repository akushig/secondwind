import { callLlm, type GeminiModel, type GeminiUsage, type RateLimitHit } from "@/lib/common/llm";
import {
  buildTravelPrompt,
  parseTravelPlan,
  TRAVEL_PLAN_SCHEMA,
  type PlaceStats,
  type PlanningModel,
  type TravelInput,
  type TravelPlan,
} from "./travel";
import { computePlaceStats, enrichPlan } from "./travel-enrich";

export type TravelPlannerResult =
  | {
      status: "ok";
      plan: TravelPlan;
      planningModel: PlanningModel;
      llmModel: GeminiModel;
      promptVersion: string;
      usage: GeminiUsage;
      placeStats: PlaceStats;
      rateLimitHits?: RateLimitHit[];
    }
  | { status: "not-configured" }
  | { status: "disabled"; reason: string }
  | { status: "invalid-response"; raw: string }
  | { status: "error"; reason: string; model?: string };

type PlannerConfig = {
  temperature: number;
  repairPass: boolean;
};

const PLANNER_CONFIG: Record<PlanningModel, PlannerConfig> = {
  classic: { temperature: 0.6, repairPass: false },
  balanced: { temperature: 0.35, repairPass: true },
  verified: { temperature: 0.2, repairPass: false },
};

const REPAIR_LIMIT = 6;

type RepairTarget = {
  id: string;
  item: TravelPlan["days"][number]["items"][number];
  dayLabel: string;
};

type RepairSuggestion = {
  id: string;
  place_query: string;
};

const REPAIR_SCHEMA = {
  type: "object",
  properties: {
    replacements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          place_query: { type: "string" },
        },
        required: ["id", "place_query"],
      },
    },
  },
  required: ["replacements"],
} as const;

export async function runTravelPlanner(input: TravelInput): Promise<TravelPlannerResult> {
  const config = PLANNER_CONFIG[input.planningModel];
  const { system, user } = buildTravelPrompt(input);
  const result = await callLlm({
    system,
    user,
    // 3박+많은 item+긴 rationale 케이스에서 6144 가 빡빡해 truncation 이 났던 정황이 있어 8192 로 상향.
    maxTokens: 8192,
    responseSchema: TRAVEL_PLAN_SCHEMA,
    temperature: config.temperature,
  });

  if (result.status === "not-configured" || result.status === "disabled") return result;
  if (result.status === "error") return { status: "error", reason: result.reason, model: result.model };

  const plan = parseTravelPlan(result.text);
  if (!plan) return { status: "invalid-response", raw: result.text.slice(0, 500) };

  await enrichPlan(plan, input.destination);
  let usage = result.usage;
  const rateLimitHits = [...(result.rateLimitHits ?? [])];
  let repairedPlaces = 0;

  if (config.repairPass) {
    const repair = await repairPlaceQueries(plan, input);
    usage = addUsage(usage, repair.usage);
    rateLimitHits.push(...repair.rateLimitHits);
    repairedPlaces = repair.repairedPlaces;
  }

  return {
    status: "ok",
    plan,
    planningModel: input.planningModel,
    llmModel: result.model,
    promptVersion: result.promptVersion,
    usage,
    placeStats: computePlaceStats(plan, repairedPlaces),
    ...(rateLimitHits.length > 0 ? { rateLimitHits } : {}),
  };
}

async function repairPlaceQueries(
  plan: TravelPlan,
  input: TravelInput,
): Promise<{ repairedPlaces: number; usage: GeminiUsage; rateLimitHits: RateLimitHit[] }> {
  const targets = collectRepairTargets(plan).slice(0, REPAIR_LIMIT);
  if (targets.length === 0) {
    return { repairedPlaces: 0, usage: emptyUsage(), rateLimitHits: [] };
  }

  const result = await callLlm({
    system: [
      "당신은 한국 여행 일정의 지도 검색어를 고치는 보조자입니다.",
      "실패한 place_query 를 같은 활동을 대표하는 실제 단일 POI 고유명사로만 교체하세요.",
      "지역+카테고리 조합, 불확실한 상호명, 여러 업체가 섞인 시설명은 빈 문자열로 두세요.",
      "활동 자체를 바꾸거나 일정 순서, 시간, 설명을 수정하지 마세요.",
      "응답은 반드시 JSON 입니다.",
    ].join("\n"),
    user: buildRepairPrompt(input, targets),
    maxTokens: 1024,
    responseSchema: REPAIR_SCHEMA,
    temperature: 0.1,
  });

  if (result.status !== "ok") {
    return {
      repairedPlaces: 0,
      usage: emptyUsage(),
      rateLimitHits: result.status === "error" ? result.rateLimitHits ?? [] : [],
    };
  }

  const suggestions = parseRepairSuggestions(result.text);
  if (suggestions.length === 0) {
    return { repairedPlaces: 0, usage: result.usage, rateLimitHits: result.rateLimitHits ?? [] };
  }

  const changed = applyRepairSuggestions(targets, suggestions);
  if (changed.length === 0) {
    return { repairedPlaces: 0, usage: result.usage, rateLimitHits: result.rateLimitHits ?? [] };
  }

  await enrichPlan(plan, input.destination);
  return {
    repairedPlaces: changed.filter((item) => item.place).length,
    usage: result.usage,
    rateLimitHits: result.rateLimitHits ?? [],
  };
}

function collectRepairTargets(plan: TravelPlan): RepairTarget[] {
  const targets: RepairTarget[] = [];
  plan.days.forEach((day, dayIndex) => {
    day.items.forEach((item, itemIndex) => {
      if (!item.place_query) return;
      if (item.place && !item.place_warning) return;
      targets.push({
        id: `d${dayIndex + 1}i${itemIndex + 1}`,
        item,
        dayLabel: day.label,
      });
    });
  });
  return targets;
}

function buildRepairPrompt(input: TravelInput, targets: RepairTarget[]): string {
  const lines = [
    `목적지: ${input.destination}`,
    `기간: ${input.startDate} ~ ${input.endDate}`,
    input.prompt.trim() ? `자유 요청: ${input.prompt.trim()}` : "자유 요청: (없음)",
    "",
    "아래 항목들의 place_query 만 고쳐주세요.",
    "좋은 대체어가 없으면 place_query 를 빈 문자열로 반환하세요.",
    "",
  ];

  for (const target of targets) {
    lines.push(
      [
        `id: ${target.id}`,
        `day: ${target.dayLabel}`,
        `text: ${target.item.text}`,
        `time: ${target.item.time ?? ""}`,
        `current_place_query: ${target.item.place_query ?? ""}`,
        `warning: ${target.item.place_warning ?? "지도 검색 결과 없음"}`,
      ].join("\n"),
      "",
    );
  }

  lines.push(
    "JSON 스키마:",
    '{ "replacements": [ { "id": string, "place_query": string } ] }',
  );
  return lines.join("\n");
}

function parseRepairSuggestions(raw: string): RepairSuggestion[] {
  try {
    const parsed = JSON.parse(raw.trim()) as { replacements?: unknown };
    if (!Array.isArray(parsed.replacements)) return [];
    return parsed.replacements.flatMap((item) => {
      if (typeof item !== "object" || item === null) return [];
      const r = item as Record<string, unknown>;
      if (typeof r.id !== "string" || typeof r.place_query !== "string") return [];
      return [{ id: r.id, place_query: r.place_query.trim().slice(0, 80) }];
    });
  } catch {
    return [];
  }
}

function applyRepairSuggestions(
  targets: RepairTarget[],
  suggestions: RepairSuggestion[],
): Array<RepairTarget["item"]> {
  const byId = new Map(targets.map((target) => [target.id, target]));
  const changed: Array<RepairTarget["item"]> = [];

  for (const suggestion of suggestions) {
    const target = byId.get(suggestion.id);
    if (!target) continue;
    const nextQuery = suggestion.place_query;
    if (nextQuery === (target.item.place_query ?? "")) continue;

    target.item.place_query = nextQuery || undefined;
    target.item.place = undefined;
    target.item.place_warning = undefined;
    if (nextQuery) changed.push(target.item);
  }

  return changed;
}

function addUsage(a: GeminiUsage, b: GeminiUsage): GeminiUsage {
  return {
    prompt: a.prompt + b.prompt,
    output: a.output + b.output,
    total: a.total + b.total,
    ...sumOptionalThoughts(a, b),
  };
}

function sumOptionalThoughts(a: GeminiUsage, b: GeminiUsage): Pick<GeminiUsage, "thoughts"> {
  if (typeof a.thoughts !== "number" && typeof b.thoughts !== "number") return {};
  return { thoughts: (a.thoughts ?? 0) + (b.thoughts ?? 0) };
}

function emptyUsage(): GeminiUsage {
  return { prompt: 0, output: 0, total: 0 };
}
