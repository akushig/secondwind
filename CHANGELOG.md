# Changelog

secondwind 의 주요 변경 사항을 기록합니다. 날짜 포맷은 `YYYY-MM-DD`, 버전은 4자리 `MAJOR.MINOR.PATCH.MICRO`.

## [0.1.0.0] - 2026-04-23

### Added
- Next.js 15 (App Router) + TypeScript + Tailwind CSS 기반 플랫폼 스캐폴딩.
- 랜딩 페이지 (`/`) 에 3개 서비스 카드 — `travel` (지헌), `diary` (태훈 placeholder), `experiment-3` (덕우 placeholder).
- 여행 계획 서비스 (`/travel`) v0:
  - 폼 입력 — 목적지·기간·인원(성인/청소년/어린이/영유아 세분화 토글)·자유 요청사항.
  - 공용 API 프록시 `/api/gemini` 로 Gemini 2.5 Flash Lite 호출해 JSON 플랜 생성.
  - 각 일자 타임라인 카드 — 시간·텍스트·지도 링크에 펼치면 주소·전화·카테고리·비용·추천 메뉴 표시.
  - 장소 간 이동 정보 row (이동수단·시간·비용) 삽입.
  - Naver Local Search 로 실제 장소 enrich (bigram Jaccard 매칭·재시도·destination prefix).
  - 예상 총 경비 breakdown (활동·이동·기타) + `<details>` 안에 세부 내역 표시.
- 공통 모듈 — `components/common/service-card.tsx`, `lib/common/{env,llm}.ts`, `lib/common/services/{travel,travel-enrich}.ts`.
- 팀 규칙 문서 — `docs/decisions/0001-v0-stack-and-accepted-risks.md` 에 거절한 리뷰 챌린지 4건·수용한 리스크 5건 기록.
- 환경변수 템플릿 `.env.local.example` (`GEMINI_API_KEY`, `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`).
- `.eslintrc.json` 에 cross-service import 차단 규칙.

### Changed
- `CLAUDE.md` / `AGENTS.md` / `app/README.md` 를 v0 스캐폴딩 진입 상태로 최신화.
- `.gitignore` 에 `.next/`, `out/`, `*.tsbuildinfo` 추가.
