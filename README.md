# done? - 퀘스트 트래커

게임처럼 즐기는 할일 관리 앱

## 🌐 라이브 데모

[배포된 앱 보기](https://yurrim319.github.io/side-app-done/)

> 📱 모바일에서 접속하면 PWA로 설치 가능합니다.

## 프로젝트 구조

```
side-app-done/
├── index.html          # 메인 HTML 파일
├── profile.html        # 프로필 페이지
├── admin.html          # 관리자 페이지
├── manifest.json       # PWA 매니페스트
├── sw.js              # Service Worker
├── css/
│   └── style.css       # 스타일시트
├── js/
│   ├── app.js          # 메인 애플리케이션 로직
│   ├── profile.js      # 프로필 페이지 로직
│   ├── admin.js        # 관리자 페이지 로직
│   └── storage.js      # 로컬 스토리지 관리 유틸리티
├── icons/             # PWA 아이콘
└── README.md           # 프로젝트 설명
```

## 시작하기

### 로컬 실행

1. `index.html` 파일을 브라우저에서 열어 실행합니다.
2. 또는 로컬 서버 실행:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Node.js (http-server)
   npx http-server
   ```

### GitHub Pages 배포

자세한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참고하세요.

## 기능

- ✅ 일일 퀘스트 관리
- ✅ 반복 퀘스트 지원
- ✅ 사진 인증 시스템
- ✅ 포인트 시스템
- ✅ 연속 달성일 추적
- ✅ 프로필 통계
- ✅ 주간 활동 히트맵
- ✅ 성취 배지 시스템
- ✅ PWA 지원 (오프라인 작동, 홈 화면 추가)

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Storage**: localStorage API
- **PWA**: Service Worker, Web App Manifest
- **배포**: GitHub Pages

