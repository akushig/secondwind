#!/usr/bin/env bash
# secondwind — git hook 설치 스크립트.
#
# 목적: 커밋 시 회사 이메일 도메인이 실수로 섞이는 것을 차단하고,
#      repo-local git identity 가 비어 있으면 경고한다.
#
# 사용:
#   ./scripts/setup-git-hooks.sh
#
# 각 팀원이 clone 후 한 번만 실행하면 됩니다. 이미 설치돼 있어도 안전 (덮어씀).

set -e

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_PATH="$REPO_ROOT/.git/hooks/pre-commit"

mkdir -p "$REPO_ROOT/.git/hooks"

cat > "$HOOK_PATH" <<'HOOK'
#!/bin/sh
# secondwind pre-commit hook — block company identity leaks.
#
# This hook refuses commits made with a company/work account.
# See scripts/setup-git-hooks.sh for the source-of-truth copy.

EMAIL=$(git config user.email)
NAME=$(git config user.name)

if [ -z "$EMAIL" ] || [ -z "$NAME" ]; then
  echo "❌ git user.name 또는 user.email 이 설정되어 있지 않습니다." >&2
  echo "   repo-local 로 설정하세요:" >&2
  echo "     git config user.name <이름>" >&2
  echo "     git config user.email <개인-이메일>" >&2
  exit 1
fi

case "$EMAIL" in
  *woowahan*|*@*.work|*@corp.*|*@*internal*)
    echo "❌ 회사성 이메일이 감지되었습니다: $EMAIL" >&2
    echo "   secondwind 은 개인 GitHub 계정만 허용합니다." >&2
    echo "   변경: git config user.email <개인-이메일>" >&2
    exit 1
    ;;
esac

exit 0
HOOK

chmod +x "$HOOK_PATH"

echo "✅ pre-commit hook 설치 완료: $HOOK_PATH"
echo "   현재 identity: $(git config user.name) <$(git config user.email)>"
