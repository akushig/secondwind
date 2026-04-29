import { ImageResponse } from "next/og";

// 루트 / 의 OG 카드. Next.js App Router file convention 으로 자동 등록되어
// 더 specific 한 [shareId]/opengraph-image.tsx 가 없는 모든 segment 의 default.

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "secondwind — 3명이 만드는 바이브 코딩 실험장";

const COLORS = {
  background: "#eef3f8",
  paper: "#ffffff",
  ink: "#101828",
  muted: "#64748b",
  line: "#d7dee8",
  accent: "#2563eb",
};

export default async function OpenGraphImage() {
  const headline = "3명이 만드는 바이브 코딩 실험장";
  const sub = "여행 계획부터 시작합니다";
  const fontText = ["secondwind", "TRAVEL", "DIARY", "EXPERIMENT", headline, sub].join(" ");

  let fontData: ArrayBuffer | undefined;
  try {
    fontData = await loadKoreanFont(fontText);
  } catch {
    // 폰트 fetch 실패 시 영문 + 시스템 폰트 fallback
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: COLORS.background,
          padding: "72px 80px",
          fontFamily: fontData ? '"Noto Sans KR", system-ui, sans-serif' : "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: COLORS.accent,
            textTransform: "uppercase",
          }}
        >
          secondwind
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              fontSize: fontData ? 88 : 64,
              fontWeight: 700,
              color: COLORS.ink,
              lineHeight: 1.1,
            }}
          >
            {fontData ? headline : "vibe coding playground"}
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              color: COLORS.muted,
            }}
          >
            {fontData ? sub : "travel · diary · experiment"}
          </div>
        </div>

        <div
          style={{
            marginTop: 48,
            display: "flex",
            gap: 12,
          }}
        >
          {["TRAVEL", "DIARY", "EXPERIMENT"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "10px 20px",
                background: COLORS.paper,
                border: `1px solid ${COLORS.line}`,
                borderRadius: 999,
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.ink,
                letterSpacing: "0.12em",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData
        ? {
            fonts: [
              {
                name: "Noto Sans KR",
                data: fontData,
                weight: 700,
                style: "normal",
              },
            ],
          }
        : {}),
    },
  );
}

async function loadKoreanFont(text: string): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=${encodeURIComponent(text)}`;
  const css = await fetch(cssUrl).then((r) => r.text());
  const match = css.match(/src:\s*url\((https:[^)]+)\)\s*format\(['"](?:opentype|truetype)['"]\)/);
  if (!match || !match[1]) {
    throw new Error("noto-sans-kr-url-not-found");
  }
  const fontRes = await fetch(match[1]);
  return fontRes.arrayBuffer();
}
