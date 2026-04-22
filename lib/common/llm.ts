import { env, assertServerEnv } from "./env";

export type LlmCallInput = {
  system: string;
  user: string;
  maxTokens?: number;
};

export type LlmResult =
  | { status: "ok"; text: string; promptVersion: string }
  | { status: "disabled"; reason: string }
  | { status: "not-configured" }
  | { status: "error"; reason: string };

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const DEFAULT_TIMEOUT_MS = 60_000;

export async function callLlm(input: LlmCallInput, signal?: AbortSignal): Promise<LlmResult> {
  assertServerEnv();

  if (env.geminiDisabled) {
    return { status: "disabled", reason: "GEMINI_DISABLED=1 — 점검 중" };
  }
  if (!env.geminiApiKey) {
    return { status: "not-configured" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error("timeout")), DEFAULT_TIMEOUT_MS);
  if (signal) {
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }

  try {
    const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(env.geminiApiKey)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: [{ role: "user", parts: [{ text: input.user }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: input.maxTokens ?? 2048,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return { status: "error", reason: `upstream ${res.status}` };
    }

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) {
      return { status: "error", reason: "empty response" };
    }
    return { status: "ok", text, promptVersion: env.promptVersion };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unknown";
    return { status: "error", reason };
  } finally {
    clearTimeout(timeout);
  }
}
