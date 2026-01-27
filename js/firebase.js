// Firebase 설정
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, updateDoc, increment, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAW3SZhfQ9XDdPyITe90NInI-gwxUFCkGw",
  authDomain: "done-app-c307b.firebaseapp.com",
  projectId: "done-app-c307b",
  storageBucket: "done-app-c307b.firebasestorage.app",
  messagingSenderId: "1080384530308",
  appId: "1:1080384530308:web:14aa47d2ac68722e211fd1",
  measurementId: "G-W2CPM1S69W"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// 현재 유저 상태
let currentUser = null;

// 인증 상태 변경 리스너
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
});

// Google 로그인
async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Firestore에 유저 정보 저장/업데이트
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      lastLogin: serverTimestamp()
    }, { merge: true });

    return user;
  } catch (error) {
    console.error('로그인 에러:', error);
    throw error;
  }
}

// 로그아웃
async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('로그아웃 에러:', error);
    throw error;
  }
}

// 유저 포인트 업데이트
async function updateUserPoints(points) {
  if (!currentUser) return;

  await updateDoc(doc(db, 'users', currentUser.uid), {
    totalPoints: increment(points),
    updatedAt: serverTimestamp()
  });
}

// 유저 스트릭 업데이트
async function updateUserStreak(streak) {
  if (!currentUser) return;

  await updateDoc(doc(db, 'users', currentUser.uid), {
    streak: streak,
    updatedAt: serverTimestamp()
  });
}

// 리더보드 가져오기 (상위 N명)
async function getLeaderboard(limitCount = 10) {
  const q = query(
    collection(db, 'users'),
    orderBy('totalPoints', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);
  const leaderboard = [];

  snapshot.forEach((doc) => {
    leaderboard.push({ id: doc.id, ...doc.data() });
  });

  return leaderboard;
}

// 내 순위 가져오기
async function getMyRank() {
  if (!currentUser) return null;

  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  if (!userDoc.exists()) return null;

  const myPoints = userDoc.data().totalPoints || 0;

  // 나보다 포인트 높은 사람 수 카운트
  const q = query(
    collection(db, 'users'),
    orderBy('totalPoints', 'desc')
  );

  const snapshot = await getDocs(q);
  let rank = 1;

  snapshot.forEach((doc) => {
    if (doc.id !== currentUser.uid && (doc.data().totalPoints || 0) > myPoints) {
      rank++;
    }
  });

  return rank;
}

// 전역으로 내보내기
window.firebaseAuth = {
  loginWithGoogle,
  logout,
  getCurrentUser: () => currentUser,
  onAuthStateChanged: (callback) => {
    window.addEventListener('authStateChanged', (e) => callback(e.detail.user));
  }
};

window.firebaseDB = {
  updateUserPoints,
  updateUserStreak,
  getLeaderboard,
  getMyRank
};

// Firebase 로드 완료 알림
console.log('✅ Firebase loaded');
window.firebaseReady = true;
window.dispatchEvent(new CustomEvent('firebaseReady'));
