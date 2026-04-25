import { NextResponse } from "next/server";
import {
  isTravelPlan,
  validateTravelInput,
  type TravelInput,
  type TravelPlan,
} from "@/lib/common/services/travel";
import { createTravelShare } from "@/lib/server/travel-share-store";

export const runtime = "nodejs";

type Body = {
  input: TravelInput;
  plan: TravelPlan;
  model?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ status: "error", reason: "invalid-json" }, { status: 400 });
  }

  const validation = validateTravelInput(body.input);
  if (!validation.ok) {
    return NextResponse.json({ status: "error", reason: validation.reason }, { status: 400 });
  }
  if (!isTravelPlan(body.plan)) {
    return NextResponse.json({ status: "error", reason: "invalid-plan" }, { status: 400 });
  }
  const input = validation.input;

  const model = typeof body.model === "string" ? body.model : undefined;

  try {
    const result = await createTravelShare(input, body.plan, model);
    if (!result) {
      return NextResponse.json(
        { status: "not-configured", reason: "KV_REST_API_URL 또는 KV_REST_API_TOKEN 이 없습니다." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      status: "ok",
      id: result.id,
      url: `/travel/${result.id}`,
      expiresAt: result.snapshot.expiresAt,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        reason: err instanceof Error ? err.message : "share-create-failed",
      },
      { status: 500 },
    );
  }
}
