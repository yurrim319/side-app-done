# GitHub Pages 활성화 가이드

## 📋 단계별 가이드

### 1단계: GitHub 리포지토리 접속

1. 브라우저에서 https://github.com/yurrim319/side-app-done 접속
2. GitHub에 로그인되어 있는지 확인

### 2단계: Settings 메뉴로 이동

1. 리포지토리 페이지 상단의 **"Settings"** 탭 클릭
   - Code, Issues, Pull requests 옆에 있는 Settings

### 3단계: Pages 메뉴 찾기

1. Settings 페이지 왼쪽 사이드바에서 **"Pages"** 클릭
   - "General", "Access", "Secrets and variables" 섹션 아래에 있음
   - 또는 Settings 페이지에서 스크롤 다운하면 "Pages" 섹션을 찾을 수 있음

### 4단계: GitHub Pages 설정

1. **"Source"** 섹션에서:
   - **"Deploy from a branch"** 선택 (기본값)
   
2. **"Branch"** 드롭다운에서:
   - **"main"** 선택
   
3. **"Folder"** 드롭다운에서:
   - **"/ (root)"** 선택

4. **"Save"** 버튼 클릭

### 5단계: 배포 확인

1. 저장 후 페이지가 새로고침되면 상단에 배포 상태가 표시됨
2. **"Your site is live at"** 메시지와 함께 URL이 표시됨:
   ```
   https://yurrim319.github.io/side-app-done/
   ```

3. 배포 완료까지 **5-10분** 소요될 수 있음
   - 초록색 체크 표시가 나타나면 배포 완료

### 6단계: 배포 테스트

1. 배포된 URL 클릭하거나 직접 접속:
   ```
   https://yurrim319.github.io/side-app-done/
   ```

2. 정상 작동 확인:
   - 페이지가 로드되는지 확인
   - 개발자 도구 (F12) → Application → Service Workers에서 등록 확인

## 🖼️ 시각적 가이드

### Settings 페이지에서 Pages 찾기

```
Repository Settings
├── General
├── Access
├── Secrets and variables
├── ...
└── Pages  ← 여기 클릭!
```

### Pages 설정 화면

```
Source
┌─────────────────────────────────────┐
│ ○ None                              │
│ ● Deploy from a branch  ← 선택      │
│ ○ GitHub Actions                    │
└─────────────────────────────────────┘

Branch
┌─────────────────────────────────────┐
│ [main ▼]  ← main 선택               │
└─────────────────────────────────────┘

Folder
┌─────────────────────────────────────┐
│ [/ (root) ▼]  ← / (root) 선택       │
└─────────────────────────────────────┘

[Save]  ← 저장 버튼 클릭
```

## ⚠️ 주의사항

1. **배포 시간**: 처음 배포는 5-10분 정도 소요될 수 있습니다
2. **HTTPS 자동 적용**: GitHub Pages는 자동으로 HTTPS를 제공합니다
3. **업데이트**: 코드를 push하면 자동으로 재배포됩니다

## 🔍 배포 상태 확인

### 배포 중
- 노란색 원 아이콘과 "Your site is being built from the latest commit" 메시지

### 배포 완료
- 초록색 체크 아이콘과 "Your site is live at" 메시지

### 배포 실패
- 빨간색 X 아이콘과 에러 메시지
- 에러 메시지를 확인하고 문제 해결 필요

## 🐛 문제 해결

### Pages 메뉴가 보이지 않는 경우

1. **권한 확인**: 리포지토리 소유자이거나 관리자 권한이 있는지 확인
2. **리포지토리 타입**: Public 또는 Private 리포지토리 모두 가능
3. **Settings 접근**: Settings 탭이 보이지 않으면 권한 문제일 수 있음

### 배포가 실패하는 경우

1. **파일 확인**: `index.html` 파일이 루트에 있는지 확인
2. **에러 로그**: Settings → Pages에서 에러 메시지 확인
3. **파일 경로**: 모든 파일 경로가 올바른지 확인

## ✅ 체크리스트

배포 전 확인:
- [ ] Settings → Pages 메뉴 접근 가능
- [ ] Source: Deploy from a branch 선택
- [ ] Branch: main 선택
- [ ] Folder: / (root) 선택
- [ ] Save 버튼 클릭
- [ ] 배포 상태 확인 (초록색 체크)
- [ ] 배포된 URL 접속 테스트

## 📞 추가 도움

문제가 계속되면:
1. GitHub 문서: https://docs.github.com/en/pages
2. 리포지토리 Issues에 문제 보고
3. 배포 로그 확인 (Settings → Pages → 배포 이력)
