# docs/ — 팀 공유 문서

이 폴더는 secondwind 팀이 공유하는 **회의록·아이데이션·기획·결정** 문서를 담습니다. 사람과 AI 가 함께 읽고 씁니다.

> gstack 의 `/office-hours`, `/autoplan` 등은 기본적으로 `~/.gstack/projects/secondwind/` (각자 홈) 에 문서를 저장합니다. 그중 **팀에 공유할 가치가 있는 것만** 이 폴더로 복사·커밋하세요.

---

## 폴더 구조

| 폴더 | 용도 | 파일명 규칙 |
|---|---|---|
| `meetings/` | 팀 싱크·회의록 | `YYYY-MM-DD-슬러그.md` |
| `ideation/` | 아이데이션 — `/office-hours`, 브레인스토밍 | `YYYY-MM-DD-슬러그.md` |
| `plans/` | 확정된 기획 — `/autoplan`, PRD, 기능 스펙 | `YYYY-MM-DD-슬러그.md` |
| `decisions/` | ADR — 주요 의사결정 기록 | `NNNN-슬러그.md` (`0001`, `0002` ...) |
| `assets/` | 목업·와이어프레임·다이어그램 이미지 | 자유 |

### 파일명 규칙

- **시계열 문서** (meetings / ideation / plans): `YYYY-MM-DD-슬러그.md`
  - 예: `2026-04-28-office-hours-core.md`
  - `ls` 만 쳐도 시간순 정렬됨
- **결정 (decisions)** 만 예외: `NNNN-슬러그.md` (순번, `0001`, `0002` …)
  - 예: `0001-framework-nextjs.md`
  - 뒤집힌 결정 추적이 쉬움

---

## Frontmatter 규칙

`docs/` 아래 모든 `.md` 파일은 아래 frontmatter 를 포함해야 합니다.

```markdown
---
title: 문서 제목
author: ai-office-hours          # 작성자 식별자 (아래 참고)
status: draft                    # draft | reviewed | approved
created: 2026-04-28              # ISO 날짜 (YYYY-MM-DD)
last-edited-by: akushi           # 마지막 수정자
---

# 문서 제목

(본문…)
```

### `author` 값 예시

| 값 | 의미 |
|---|---|
| `human: akushi` | 특정 팀원이 작성 |
| `ai-office-hours` | gstack `/office-hours` 스킬이 작성 |
| `ai-autoplan` | gstack `/autoplan` 스킬이 작성 |
| `ai-claude-code` / `ai-codex` | AI 가 자유 대화 중 작성 |
| `mixed` | 사람과 AI 가 공동 작성 (지속적 협업 문서) |

### `status` 의미

| 값 | 언제 |
|---|---|
| `draft` | 작성 중 · AI 초안 · 미검토 |
| `reviewed` | 팀원 한 명 이상이 검토 완료 |
| `approved` | 팀 합의. 변경 시 별도 논의 필요 |

### 조회 예시

```bash
# AI 가 작성한 문서만 찾기
grep -rl "^author: ai-" docs/

# 아직 draft 인 문서만 찾기
grep -rl "^status: draft" docs/
```

---

## AI 에이전트용 규칙

문서를 **생성·수정할 때 반드시** frontmatter 필드를 채우거나 갱신하세요.

- **새 문서 작성**: 모든 필드 채우기
- **기존 문서 수정**: `last-edited-by` 갱신, 상태가 올라가면 `status` 도 갱신
- **`status: approved`** 문서는 사소한 편집도 **사람에게 먼저 확인** 후 진행

---

## 사람용 가이드

- AI 가 `/office-hours`, `/autoplan` 결과를 `~/.gstack/projects/secondwind/` 에 저장했다면, 공유 가치 있는 것만 여기로 복사·커밋:
  ```bash
  cp ~/.gstack/projects/secondwind/<파일> docs/ideation/$(date +%Y-%m-%d)-<슬러그>.md
  # frontmatter 추가·보정 → git add → git commit
  ```
- 중요한 기술·제품 결정이 생기면 `decisions/` 에 이전 번호 + 1 로 ADR 파일 추가.
- 회의 중 그린 화이트보드 사진 등은 `assets/` 에 업로드하고, 해당 회의록에서 상대 경로로 참조.
