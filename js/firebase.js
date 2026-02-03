// Firebase 설정
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, updateDoc, increment, serverTimestamp, where, addDoc, deleteDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// 친구 코드 생성 (6자리 영숫자)
function generateFriendCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동되는 문자 제외 (0,O,1,I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 고유한 친구 코드 생성 (중복 체크)
async function createUniqueFriendCode() {
  let code = generateFriendCode();
  let attempts = 0;

  while (attempts < 10) {
    const q = query(collection(db, 'users'), where('friendCode', '==', code));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return code;
    }
    code = generateFriendCode();
    attempts++;
  }

  // 10번 시도 후에도 실패하면 타임스탬프 추가
  return code + Date.now().toString(36).slice(-2).toUpperCase();
}

// Google 로그인
async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // 기존 유저인지 확인
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    let friendCode = userDoc.exists() ? userDoc.data().friendCode : null;

    // 신규 유저면 친구 코드 생성
    if (!friendCode) {
      friendCode = await createUniqueFriendCode();
    }

    // Firestore에 유저 정보 저장/업데이트
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      friendCode: friendCode,
      friends: userDoc.exists() ? (userDoc.data().friends || []) : [],
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

// ==================== 친구 기능 ====================

// 내 프로필 정보 가져오기
async function getMyProfile() {
  if (!currentUser) return null;

  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  if (!userDoc.exists()) return null;

  return { id: userDoc.id, ...userDoc.data() };
}

// 친구 코드로 유저 찾기
async function findUserByFriendCode(friendCode) {
  const q = query(collection(db, 'users'), where('friendCode', '==', friendCode.toUpperCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
}

// 친구 요청 보내기
async function sendFriendRequest(toUserId) {
  if (!currentUser) throw new Error('로그인이 필요합니다');
  if (toUserId === currentUser.uid) throw new Error('자신에게 친구 요청을 보낼 수 없습니다');

  // 이미 친구인지 확인
  const myDoc = await getDoc(doc(db, 'users', currentUser.uid));
  const myFriends = myDoc.data().friends || [];
  if (myFriends.includes(toUserId)) {
    throw new Error('이미 친구입니다');
  }

  // 이미 요청이 있는지 확인
  const existingRequest = query(
    collection(db, 'friendRequests'),
    where('from', '==', currentUser.uid),
    where('to', '==', toUserId),
    where('status', '==', 'pending')
  );
  const existingSnapshot = await getDocs(existingRequest);
  if (!existingSnapshot.empty) {
    throw new Error('이미 친구 요청을 보냈습니다');
  }

  // 상대방이 나에게 이미 요청했는지 확인
  const reverseRequest = query(
    collection(db, 'friendRequests'),
    where('from', '==', toUserId),
    where('to', '==', currentUser.uid),
    where('status', '==', 'pending')
  );
  const reverseSnapshot = await getDocs(reverseRequest);
  if (!reverseSnapshot.empty) {
    throw new Error('상대방이 이미 친구 요청을 보냈습니다. 받은 요청을 확인하세요.');
  }

  // 친구 요청 생성
  await addDoc(collection(db, 'friendRequests'), {
    from: currentUser.uid,
    fromName: currentUser.displayName,
    fromPhoto: currentUser.photoURL,
    to: toUserId,
    status: 'pending',
    createdAt: serverTimestamp()
  });

  return true;
}

// 받은 친구 요청 목록
async function getPendingFriendRequests() {
  if (!currentUser) return [];

  const q = query(
    collection(db, 'friendRequests'),
    where('to', '==', currentUser.uid),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  const requests = [];

  snapshot.forEach((doc) => {
    requests.push({ id: doc.id, ...doc.data() });
  });

  return requests;
}

// 친구 요청 수락
async function acceptFriendRequest(requestId) {
  if (!currentUser) throw new Error('로그인이 필요합니다');

  const requestDoc = await getDoc(doc(db, 'friendRequests', requestId));
  if (!requestDoc.exists()) throw new Error('요청을 찾을 수 없습니다');

  const request = requestDoc.data();
  if (request.to !== currentUser.uid) throw new Error('권한이 없습니다');

  // 양쪽 유저의 friends 배열에 서로 추가
  await updateDoc(doc(db, 'users', currentUser.uid), {
    friends: arrayUnion(request.from)
  });

  await updateDoc(doc(db, 'users', request.from), {
    friends: arrayUnion(currentUser.uid)
  });

  // 요청 삭제
  await deleteDoc(doc(db, 'friendRequests', requestId));

  return true;
}

// 친구 요청 거절
async function rejectFriendRequest(requestId) {
  if (!currentUser) throw new Error('로그인이 필요합니다');

  const requestDoc = await getDoc(doc(db, 'friendRequests', requestId));
  if (!requestDoc.exists()) throw new Error('요청을 찾을 수 없습니다');

  const request = requestDoc.data();
  if (request.to !== currentUser.uid) throw new Error('권한이 없습니다');

  // 요청 삭제
  await deleteDoc(doc(db, 'friendRequests', requestId));

  return true;
}

// 친구 목록 가져오기
async function getFriends() {
  if (!currentUser) return [];

  const myDoc = await getDoc(doc(db, 'users', currentUser.uid));
  if (!myDoc.exists()) return [];

  const friendIds = myDoc.data().friends || [];
  if (friendIds.length === 0) return [];

  const friends = [];
  for (const friendId of friendIds) {
    const friendDoc = await getDoc(doc(db, 'users', friendId));
    if (friendDoc.exists()) {
      friends.push({ id: friendDoc.id, ...friendDoc.data() });
    }
  }

  return friends;
}

// 친구 리더보드 가져오기 (나 + 친구들만)
async function getFriendsLeaderboard() {
  if (!currentUser) return [];

  // 내 정보 가져오기
  const myDoc = await getDoc(doc(db, 'users', currentUser.uid));
  if (!myDoc.exists()) return [];

  const myData = { id: myDoc.id, ...myDoc.data() };
  const friendIds = myData.friends || [];

  // 친구 정보 가져오기
  const leaderboard = [myData];

  for (const friendId of friendIds) {
    const friendDoc = await getDoc(doc(db, 'users', friendId));
    if (friendDoc.exists()) {
      leaderboard.push({ id: friendDoc.id, ...friendDoc.data() });
    }
  }

  // 포인트 순으로 정렬
  leaderboard.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

  return leaderboard;
}

// 친구들 중 내 순위
async function getMyRankAmongFriends() {
  if (!currentUser) return null;

  const leaderboard = await getFriendsLeaderboard();
  const myIndex = leaderboard.findIndex(user => user.id === currentUser.uid);

  return myIndex !== -1 ? myIndex + 1 : null;
}

// 친구 삭제
async function removeFriend(friendId) {
  if (!currentUser) throw new Error('로그인이 필요합니다');

  // 양쪽에서 서로 삭제
  await updateDoc(doc(db, 'users', currentUser.uid), {
    friends: arrayRemove(friendId)
  });

  await updateDoc(doc(db, 'users', friendId), {
    friends: arrayRemove(currentUser.uid)
  });

  return true;
}

// ==================== 사용자 프로필 조회 ====================

// 특정 사용자 프로필 가져오기 (userId로)
async function getUserProfile(userId) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return null;

  return { id: userDoc.id, ...userDoc.data() };
}

// 특정 사용자의 친구 목록 가져오기
async function getUserFriends(userId) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return [];

  const friendIds = userDoc.data().friends || [];
  if (friendIds.length === 0) return [];

  const friends = [];
  for (const friendId of friendIds) {
    const friendDoc = await getDoc(doc(db, 'users', friendId));
    if (friendDoc.exists()) {
      friends.push({ id: friendDoc.id, ...friendDoc.data() });
    }
  }

  return friends;
}

// 나와 특정 사용자가 친구인지 확인
async function isFriendWith(userId) {
  if (!currentUser) return false;

  const myDoc = await getDoc(doc(db, 'users', currentUser.uid));
  if (!myDoc.exists()) return false;

  const myFriends = myDoc.data().friends || [];
  return myFriends.includes(userId);
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
  getMyRank,
  // 친구 기능
  getMyProfile,
  findUserByFriendCode,
  sendFriendRequest,
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend,
  getFriendsLeaderboard,
  getMyRankAmongFriends,
  // 사용자 프로필 조회
  getUserProfile,
  getUserFriends,
  isFriendWith
};

// Firebase 로드 완료 알림
console.log('✅ Firebase loaded');
window.firebaseReady = true;
window.dispatchEvent(new CustomEvent('firebaseReady'));
