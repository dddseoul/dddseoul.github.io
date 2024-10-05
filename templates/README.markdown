# 이메일 템플릿 생성/수정하기

이메일 템플릿은 `templates` 디렉토리에 마크다운 문서 형태로 관리합니다. 마크다운 기반의 템플릿을 생성 또는 수정한 후 아래 명령어를 실행시켜 HTML 파일로 변환합니다.

```bash
# zsh/bash
REPOSITORY_ROOT=$(git rev-parse --show-toplevel)
cd $REPOSITORY_ROOT
./scripts/md2html.sh
```

```powershell
# PowerShell
$REPOSITORY_ROOT = git rev-parse --show-toplevel
cd $REPOSITORY_ROOT
./scripts/md2html.ps1
```
