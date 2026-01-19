# done? - 프로젝트 개요

## 1. 프로젝트 정보

### 제품명
**done?** (가제) - 게임처럼 즐기는 할일 관리 앱

### 핵심 컨셉
- 친구들과 할일을 공유하고 인증하며 경쟁하는 폐쇄형 소셜 할일 앱
- 듀오링고(랭킹) + 비리얼(인증샷) + 게이미피케이션

### 개발 기간
- **Phase 1**: 1개월 (2025.01.20 ~ 2025.02.20)
- **Phase 2**: 런칭 후 1-2개월

### 팀
- 개발자 1명 (노베이스, 풀스택)
- PM 1명 (기획, Figma 디자인, 마케팅)

---

## 2. 개발 전략

### 핵심 전략: 서버 없이 먼저 시작

**Phase 1 (1개월)**: 로컬 앱 먼저 만들어서 빠르게 런칭
**Phase 2 (런칭 후)**: 유저 반응 좋으면 서버 추가

---

## 3. 기술 스택

### Phase 1: 로컬 앱 (현재)
```
프론트엔드:
- HTML5
- CSS3 (Flexbox/Grid, 모바일 우선)
- JavaScript (바닐라, ES6+)

데이터 저장:
- localStorage (서버 대신)

앱 형태:
- PWA (Progressive Web App)
  - manifest.json
  - Service Worker

배포:
- Vercel (GitHub 연동 자동 배포)

광고:
- Google AdMob (보상형 광고)
```

**라이브러리:**
- 없음 (순수 바닐라 JS)
- 필요시 추가:
  - canvas-confetti (축하 애니메이션)
  - compressor.js (이미지 압축)

### Phase 2: 서버 추가 (런칭 후)
```
백엔드:
- Firebase
  - Authentication (로그인)
  - Firestore (데이터베이스)
  - Storage (이미지 저장)
  - Cloud Functions (서버 로직)
  - Cloud Messaging (푸시 알림)
```

---

## 4. 핵심 기능

### Phase 1 기능 (필수, 1개월 안에 완성)

**4.1 할일(퀘스트) 관리**
- 퀘스트 추가 (제목 + 포인트 설정)
- 진행중/완료 탭 분리
- 퀘스트 삭제

**4.2 사진 인증 (필수)**
- 완료 시 사진 인증 필수
- 카메라/갤러리 선택
- 이미지 자동 압축 (5MB 제한, 800px 너비)
- base64로 localStorage 저장

**4.3 포인트 시스템**
- 퀘스트 완료 시 포인트 획득
- 총 포인트 표시

**4.4 개인 통계**
- 총 포인트
- 완료한 퀘스트 수
- 연속 달성일 (스트릭)
- 평균 포인트

**4.5 보상형 광고**
- 하루 3회 제한
- 1회당 200P 지급
- 자정 자동 리셋

**4.6 PWA 기능**
- 오프라인 작동
- 홈 화면에 추가
- 앱처럼 전체화면

### Phase 2 기능 (나중에 추가)

**서버 필요 기능들:**
- 로그인/회원가입
- 친구 초대 시스템 (초대 코드)
- 친구 할일 피드 (폐쇄형 SNS)
- 주간/월간 랭킹
- 푸시 알림
- 좋아요/댓글 (선택)

---

## 5. 데이터 구조

### Phase 1: localStorage
```javascript
// 퀘스트 데이터
{
  id: 1234567890,           // timestamp
  title: "아침 6시 기상",   // 최대 50자
  points: 100,              // 10-1000
  completed: false,
  image: null,              // base64 or null
  createdAt: "2025-01-20T09:00:00.000Z",
  completedAt: null
}

// 광고 데이터
{
  date: "2025-01-20",  // 오늘 날짜
  count: 2             // 오늘 시청 횟수 (0-3)
}
```

### Phase 2: Firestore (미리 설계)
```javascript
users/
  {userId}/
    - name
    - email
    - points
    - weeklyPoints
    - friends: []
    - inviteCode

quests/
  {questId}/
    - userId
    - title
    - points
    - completed
    - imageUrl  // Storage URL
    - completedAt
```

---

## 6. 파일 구조
```
done-app/
├── index.html          (메인 페이지)
├── css/
│   └── style.css      (전체 스타일)
├── js/
│   ├── storage.js     (localStorage 관리)
│   └── app.js         (UI 로직)
├── images/            (아이콘 등)
├── manifest.json      (PWA 설정)
├── service-worker.js  (오프라인 캐싱)
└── README.md
```

---

## 7. 개발 원칙

### 7.1 KISS (Keep It Simple)
- 복잡한 기능 추가 금지
- 핵심만 구현
- 나중에 추가 가능한 건 미룸

### 7.2 모바일 우선
- 핸드폰에서 먼저 테스트
- 터치 영역 충분히 크게 (최소 44px)

### 7.3 코드 구조
```javascript
// storage.js: localStorage만 담당
const Storage = {
  getQuests() { ... },
  addQuest(title, points) { ... },
  completeQuest(id, imageData) { ... },
  deleteQuest(id) { ... },
  getTotalPoints() { ... }
};

// app.js: UI 로직만 담당
function showModal(modalId) { ... }
function loadQuests() { ... }
function updatePoints() { ... }
```

### 7.4 에러 처리
```javascript
// localStorage 용량 초과
try {
  localStorage.setItem('quests', data);
} catch (e) {
  if (e.name === 'QuotaExceededError') {
    alert('저장 공간 부족');
  }
}

// 이미지 용량 체크
if (file.size > 5 * 1024 * 1024) {
  alert('이미지는 5MB 이하만 가능합니다');
  return;
}
```

---

## 8. 개발 로드맵

### Week 1: 핵심 기능
```
□ localStorage 기본 구조
□ 퀘스트 추가/완료/삭제
□ 이미지 업로드 및 압축
□ 포인트 계산
```

### Week 2: 통계 + PWA
```
□ 통계 화면
□ 연속 달성일 계산
□ 광고 연동 (AdMob)
□ PWA 세팅
```

### Week 3: 테스트
```
□ 전체 기능 테스트
□ UI 다듬기
□ 베타 테스터 10명
```

### Week 4: 런칭
```
□ 버그 수정
□ Vercel 배포
□ 베타 런칭 (50명)
□ 피드백 수집
```

---

## 9. Phase 2 청사진

### 추가 기능 우선순위

**1순위:**
- Firebase Authentication
- Firestore DB
- 친구 초대 시스템

**2순위:**
- 주간/월간 랭킹
- 친구 피드
- 푸시 알림

**3순위:**
- 좋아요/댓글
- 코스메틱 구매
- 브랜드 퀘스트

### 마이그레이션 전략
- localStorage → Firestore 자동 이전
- 기존 코드 90% 재활용
- 점진적 기능 추가

---

## 10. 수익화

### Phase 1
- 보상형 광고만 (하루 3회)

### Phase 2
- 코스메틱 판매 (뱃지, 테마)
- 브랜드 퀘스트 (기업 협찬)
- 프리미엄 구독 (선택)

---

## 11. 성공 지표

### 1개월 후 (Phase 1)
```
□ 베타 유저 50명
□ DAU 20명 이상
□ 퀘스트 완료율 60% 이상
```

### 3개월 후 (Phase 2)
```
□ 총 유저 500명
□ DAU 100명
□ 첫 수익 발생
```

---

## 12. Cursor AI 활용 팁

### 효과적인 프롬프트
```
"done? 앱의 [기능]을 [파일]에 구현해줘.
- [구체적 요구사항]
- [기술적 제약사항]
- [참고할 코드/문서]"
```

### 이 문서 활용
```
1. @DOCS.md로 참조
2. 구체적인 기능 단위로 요청
3. 생성된 코드 반드시 이해하고 수정
```

---

## 13. 핵심 요약
```
앱: done? (가제)
컨셉: 친구와 경쟁하는 할일 앱

Phase 1 (1개월):
- HTML/JS + localStorage + PWA
- 퀘스트, 사진 인증, 포인트, 통계
- 서버 없음 (로그인/친구 기능 없음)

Phase 2 (런칭 후):
- Firebase 추가
- 로그인, 친구, 랭킹, 피드

철학:
1. 빠르게 만들어서 빠르게 테스트
2. 복잡한 건 나중에
3. 유저 반응 보고 피봇
```

---

Version 1.0 - 2025.01.20