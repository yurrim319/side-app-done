# done? - 아키텍처 문서

## 문서 목적

이 문서는 **done?** 앱의 기술적 구조와 시스템 설계를 설명합니다. 개발자가 코드 구조, 데이터 흐름, 모듈 간 상호작용을 이해하는 데 도움을 줍니다.

**다른 문서와의 차이:**
- `DEVELOPMENT.md`: 프로젝트 개요, 기능 명세, 개발 로드맵 (비즈니스 관점)
- `ARCHITECTURE.md`: 시스템 구조, 데이터 흐름, 모듈 설계 (기술 관점)
- `.cursorrules`: AI가 따를 개발 규칙 (실행 관점)

---

## 시스템 개요

**done?**는 클라이언트 사이드에서만 동작하는 PWA(Progressive Web App)입니다.

**Phase 1 특징:**
- 서버 없음 (localStorage만 사용)
- 오프라인 작동 가능
- 모바일 우선 설계
- 단일 페이지 애플리케이션 (SPA)

---

## 데이터 흐름

### 퀘스트 완료 플로우
```
사용자: 퀘스트 완료 버튼 클릭
    ↓
app.js: 사진 인증 모달 표시
    ↓
사용자: 사진 촬영/선택
    ↓
app.js: 이미지 압축 (5MB, 800px)
    ↓
app.js: base64 변환
    ↓
storage.js: completeQuest(id, imageData)
    ↓
storage.js: localStorage 업데이트
    ↓
app.js: UI 리렌더링 (포인트, 통계 업데이트)
```

### 퀘스트 추가 플로우
```
사용자: 퀘스트 추가 폼 제출
    ↓
app.js: 입력 검증 (제목 50자, 포인트 10-1000)
    ↓
storage.js: addQuest(title, points)
    ↓
storage.js: localStorage에 저장
    ↓
app.js: 진행중 탭에 표시
```

### 광고 시청 플로우
```
사용자: 광고 시청 버튼 클릭
    ↓
app.js: 오늘 시청 횟수 확인 (최대 3회)
    ↓
app.js: AdMob 광고 표시
    ↓
광고 완료 콜백
    ↓
storage.js: updateAdReward() (200P 추가)
    ↓
app.js: 포인트 업데이트
```

---

## 모듈 구조

### 1. Storage 모듈 (`js/storage.js`)

**책임**: localStorage와의 모든 인터페이스 담당

**주요 메서드:**
```javascript
// 퀘스트 관리
getQuests()                    // 모든 퀘스트 조회
getActiveQuests()              // 진행중 퀘스트만
getCompletedQuests()           // 완료된 퀘스트만
addQuest(title, points)        // 퀘스트 추가
completeQuest(id, imageData)   // 퀘스트 완료 (사진 필수)
deleteQuest(id)                // 퀘스트 삭제

// 포인트 및 통계
getTotalPoints()               // 총 포인트
getCompletedCount()            // 완료한 퀘스트 수
getStreak()                    // 연속 달성일
getAveragePoints()             // 평균 포인트

// 광고 관리
getAdData()                    // 오늘 광고 시청 데이터
updateAdReward()               // 광고 시청 후 포인트 추가
canWatchAd()                   // 오늘 더 시청 가능한지 (0-3회)

// 유틸리티
save(key, data)                // 일반 저장
load(key)                      // 일반 로드
remove(key)                    // 삭제
clear()                        // 전체 삭제
```

**데이터 구조:**
```javascript
// localStorage 키 구조
{
  "quests": [
    {
      id: 1737352800000,              // timestamp
      title: "아침 6시 기상",         // 최대 50자
      points: 100,                    // 10-1000
      completed: false,
      image: "data:image/jpeg;base64,...", // base64 or null
      createdAt: "2025-01-20T09:00:00.000Z",
      completedAt: null
    }
  ],
  "adData": {
    date: "2025-01-20",               // 오늘 날짜
    count: 2                           // 오늘 시청 횟수 (0-3)
  }
}
```

### 2. App 모듈 (`js/app.js`)

**책임**: UI 렌더링 및 사용자 인터랙션 처리

**주요 기능:**

**UI 렌더링:**
- `renderQuests(tab)` - 진행중/완료 탭별 퀘스트 목록 표시
- `updatePointsDisplay()` - 총 포인트 업데이트
- `updateStats()` - 통계 화면 업데이트
- `showModal(modalId)` - 모달 표시/숨김

**이벤트 처리:**
- 퀘스트 추가 폼 제출
- 퀘스트 완료 버튼 클릭
- 사진 인증 (카메라/갤러리)
- 이미지 압축 및 base64 변환
- 퀘스트 삭제
- 광고 시청 버튼
- 탭 전환 (진행중/완료)

**비즈니스 로직:**
- 입력 검증 (제목 길이, 포인트 범위)
- 이미지 용량 체크 (5MB)
- 이미지 리사이징 (800px 너비)
- 자정 광고 리셋 체크

---

## 파일 구조 및 역할

```
done-app/
├── index.html              # 메인 HTML 구조
│   ├── 헤더 (포인트, 통계)
│   ├── 탭 (진행중/완료)
│   ├── 퀘스트 목록
│   └── 모달들 (추가, 완료, 통계)
│
├── css/
│   └── style.css          # 전체 스타일 (모바일 우선)
│
├── js/
│   ├── storage.js         # localStorage 관리 (데이터 계층)
│   └── app.js             # UI 로직 (프레젠테이션 계층)
│
├── images/                # 아이콘, PWA 아이콘
│
├── manifest.json          # PWA 설정
│   ├── 앱 이름, 아이콘
│   ├── 시작 URL
│   └── 디스플레이 모드
│
└── service-worker.js      # 오프라인 캐싱
    ├── 정적 파일 캐싱
    └── 오프라인 폴백
```

---

## 상태 관리

**Phase 1은 단순한 상태 관리 방식 사용:**

1. **DOM을 단일 소스로 사용**
   - 별도 상태 객체 없음
   - DOM에서 직접 읽기/쓰기

2. **변경 시 전체 리렌더링**
   - 퀘스트 목록 전체 다시 그리기
   - 성능 이슈 없음 (퀘스트 수가 적음)

3. **LocalStorage와 동기화**
   - 모든 변경사항 즉시 저장
   - 페이지 새로고침 시 localStorage에서 복원

**장점:**
- 단순함 (KISS 원칙)
- 상태 동기화 문제 없음
- 디버깅 쉬움

**단점:**
- 대량 데이터 시 성능 저하 가능
- → Phase 2에서 상태 관리 라이브러리 고려

---

## 이벤트 처리

### 주요 이벤트

**퀘스트 추가:**
```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = inputTitle.value;
  const points = parseInt(inputPoints.value);
  // 검증 → storage.addQuest() → UI 업데이트
});
```

**퀘스트 완료:**
```javascript
button.addEventListener('click', () => {
  showPhotoModal(); // 사진 인증 모달
  // 사진 선택 → 압축 → storage.completeQuest() → UI 업데이트
});
```

**광고 시청:**
```javascript
button.addEventListener('click', () => {
  if (storage.canWatchAd()) {
    showAdMobAd();
    // 광고 완료 → storage.updateAdReward() → UI 업데이트
  }
});
```

---

## 이미지 처리

### 압축 및 저장 플로우

```
원본 이미지 (카메라/갤러리)
    ↓
FileReader로 읽기
    ↓
Canvas에 그리기 (800px 너비로 리사이즈)
    ↓
toDataURL('image/jpeg', 0.8) - base64 변환
    ↓
용량 체크 (5MB 이하)
    ↓
localStorage에 저장
```

**주의사항:**
- base64는 원본보다 약 33% 크기 증가
- localStorage 용량 제한 (약 5-10MB)
- 이미지가 많아지면 용량 초과 가능
- → Phase 2에서 Firebase Storage로 이전

---

## PWA 구조

### Service Worker 역할

**캐싱 전략:**
- 정적 파일 (HTML, CSS, JS) - Cache First
- 이미지 - Network First
- 오프라인 폴백 페이지

**오프라인 지원:**
- 앱 설치 후 오프라인에서도 작동
- localStorage 데이터는 오프라인에서도 접근 가능

### Manifest 설정

```json
{
  "name": "done?",
  "short_name": "done?",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#색상",
  "background_color": "#색상",
  "icons": [...]
}
```

---

## 성능 고려사항

### LocalStorage 최적화

**문제:**
- 동기적 API (블로킹)
- 대량 데이터 시 느림

**해결:**
- 작은 단위로 저장 (퀘스트별로 분리하지 않음)
- 전체 배열을 한 번에 저장/로드
- 변경 시에만 저장 (읽기 최소화)

### 이미지 최적화

**문제:**
- base64는 용량 큼
- localStorage 용량 제한

**해결:**
- 800px 너비로 리사이즈
- JPEG 압축 (품질 0.8)
- 5MB 제한 체크

### DOM 조작 최소화

**문제:**
- 빈번한 DOM 조작은 느림

**해결:**
- 변경 시에만 리렌더링
- DocumentFragment 사용 고려
- Phase 1에서는 충분히 빠름 (퀘스트 수 적음)

---

## Phase 2 아키텍처 변경 예정

### 마이그레이션 전략

1. **데이터 이전**
   - localStorage → Firestore 자동 마이그레이션
   - base64 이미지 → Firebase Storage

2. **코드 구조**
   - 기존 코드 90% 재활용
   - storage.js에 Firebase 메서드 추가
   - 점진적 기능 추가

3. **새로운 모듈**
   - `js/auth.js` - 인증 관리
   - `js/friends.js` - 친구 시스템
   - `js/ranking.js` - 랭킹 시스템

---

Version 1.0 - 2025.01.20
