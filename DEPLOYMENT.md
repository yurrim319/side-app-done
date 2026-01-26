# GitHub Pages 배포 가이드

## 📋 배포 전 체크리스트

- [x] Service Worker 경로를 상대 경로로 수정 완료
- [x] manifest.json 경로를 상대 경로로 수정 완료
- [x] sw.js 캐시 경로를 상대 경로로 수정 완료

## 🚀 배포 단계

### 1. GitHub 리포지토리 준비

```bash
# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit for GitHub Pages"

# GitHub 리포지토리 연결 (이미 생성되어 있음)
git remote add origin https://github.com/yurrim319/side-app-done.git
git branch -M main
git push -u origin main
```

### 2. GitHub Pages 활성화

1. GitHub 리포지토리 페이지로 이동
2. **Settings** → **Pages** 메뉴 클릭
3. **Source** 섹션에서:
   - **Deploy from a branch** 선택
   - **Branch**: `main` 선택
   - **Folder**: `/ (root)` 선택
4. **Save** 버튼 클릭

### 3. 배포 확인

- 배포 완료까지 **5-10분** 소요
- 배포 후 URL: **`https://yurrim319.github.io/side-app-done/`**
- 리포지토리 Settings → Pages에서 배포 상태 확인 가능

### 4. 테스트

1. 브라우저에서 배포된 URL 접속
2. 개발자 도구 (F12) → **Application** 탭
3. **Service Workers** 섹션에서 등록 확인
4. **Manifest** 섹션에서 manifest.json 로드 확인
5. 모바일 기기에서도 테스트

## 📱 공유 방법

### 방법 1: 직접 URL 공유 (가장 간단)

```
https://yurrim319.github.io/side-app-done/
```

이 URL을 기획자에게 공유하면 됩니다.

### 방법 2: QR 코드 생성

1. QR 코드 생성 사이트 사용 (예: https://www.qr-code-generator.com/)
2. 배포된 URL 입력
3. QR 코드 이미지 다운로드
4. 기획자에게 전달

### 방법 3: PWA 설치 링크 공유

모바일에서 접속 시:
- **iOS Safari**: 공유 버튼 → "홈 화면에 추가"
- **Android Chrome**: 주소창의 설치 배너 또는 메뉴 → "앱 설치"

### 방법 4: README에 배포 링크 추가

리포지토리 README.md에 배포 링크가 이미 추가되어 있습니다:

```markdown
## 🌐 라이브 데모

[배포된 앱 보기](https://yurrim319.github.io/side-app-done/)
```

## 🔄 업데이트 배포

코드 수정 후 배포:

```bash
git add .
git commit -m "Update: 변경 사항 설명"
git push
```

GitHub Pages는 자동으로 재배포됩니다 (몇 분 소요).

## ⚠️ 주의사항

1. **HTTPS 필수**: GitHub Pages는 자동으로 HTTPS 제공 (PWA 필수)
2. **캐시 문제**: 업데이트 후에도 이전 버전이 보이면:
   - 브라우저 캐시 삭제
   - Service Worker 등록 해제 (Application → Service Workers → Unregister)
3. **로컬 스토리지**: 각 사용자의 브라우저에 저장되므로 테스트 시 주의

## 🐛 문제 해결

### Service Worker가 등록되지 않는 경우

1. 개발자 도구 → Console에서 에러 확인
2. `sw.js` 파일이 루트에 있는지 확인
3. HTTPS로 접속 중인지 확인 (localhost는 예외)

### manifest.json이 로드되지 않는 경우

1. Network 탭에서 manifest.json 요청 확인
2. 경로가 올바른지 확인 (`./manifest.json`)
3. Content-Type이 `application/manifest+json`인지 확인

### 캐시 문제

1. 개발자 도구 → Application → Clear storage
2. Service Worker Unregister
3. 페이지 새로고침

## 📞 추가 도움

문제가 발생하면:
1. 브라우저 개발자 도구의 Console과 Network 탭 확인
2. GitHub Actions에서 배포 로그 확인 (있다면)
3. 리포지토리 Issues에 문제 보고
