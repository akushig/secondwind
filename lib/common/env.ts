export const env = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiDisabled: process.env.GEMINI_DISABLED === "1",
  promptVersion: process.env.PROMPT_VERSION ?? "dev",
  naverClientId: process.env.NAVER_CLIENT_ID ?? "",
  naverClientSecret: process.env.NAVER_CLIENT_SECRET ?? "",
};

export function assertServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("env helpers 는 서버 전용입니다.");
  }
}
