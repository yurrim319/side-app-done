(function() {
  'use strict';

  var userId = null;
  var userProfile = null;
  var isOwnProfile = false;
  var isFriend = false;

  // ==========================================
  // 초기화
  // ==========================================
  function initApp() {
    console.log('👤 User profile page initialized');

    // URL에서 userId 가져오기
    var params = new URLSearchParams(window.location.search);
    userId = params.get('id');

    if (!userId) {
      alert('사용자를 찾을 수 없습니다');
      window.location.href = 'index.html';
      return;
    }

    initTabs();
    initModal();
    waitForFirebase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  // ==========================================
  // Firebase 대기
  // ==========================================
  function waitForFirebase() {
    if (window.firebaseReady) {
      loadUserProfile();
    } else {
      window.addEventListener('firebaseReady', loadUserProfile);
    }
  }

  // ==========================================
  // 사용자 프로필 로드
  // ==========================================
  async function loadUserProfile() {
    try {
      // 현재 로그인 유저 확인
      var currentUser = window.firebaseAuth.getCurrentUser();
      isOwnProfile = currentUser && currentUser.uid === userId;

      // 프로필 로드
      userProfile = await window.firebaseDB.getUserProfile(userId);

      if (!userProfile) {
        alert('사용자를 찾을 수 없습니다');
        window.location.href = 'index.html';
        return;
      }

      // 친구 관계 확인
      if (currentUser && !isOwnProfile) {
        isFriend = await window.firebaseDB.isFriendWith(userId);
      }

      renderProfile();
      loadFeed();
      loadFriends();
    } catch (error) {
      console.error('프로필 로드 실패:', error);
      alert('프로필을 불러올 수 없습니다');
    }
  }

  // ==========================================
  // 프로필 렌더링
  // ==========================================
  function renderProfile() {
    // 페이지 타이틀
    var titleEl = document.getElementById('page-title');
    if (titleEl) {
      titleEl.textContent = userProfile.displayName || '사용자';
    }

    // 아바타
    var avatarEl = document.getElementById('user-avatar');
    if (avatarEl) {
      if (userProfile.photoURL) {
        avatarEl.innerHTML = '<img src="' + userProfile.photoURL + '" alt="">';
      } else {
        avatarEl.innerHTML = '<span class="avatar-placeholder">👤</span>';
      }
    }

    // 이름
    var nameEl = document.getElementById('user-name');
    if (nameEl) {
      nameEl.textContent = userProfile.displayName || '사용자';
    }

    // 친구 코드
    var codeEl = document.getElementById('user-friend-code');
    if (codeEl && userProfile.friendCode) {
      codeEl.textContent = '#' + userProfile.friendCode;
    }

    // 통계
    var pointsEl = document.getElementById('user-points');
    var friendsCountEl = document.getElementById('user-friends-count');
    var streakEl = document.getElementById('user-streak');

    if (pointsEl) pointsEl.textContent = userProfile.totalPoints || 0;
    if (friendsCountEl) friendsCountEl.textContent = (userProfile.friends || []).length;
    if (streakEl) streakEl.textContent = userProfile.streak || 0;

    // 액션 버튼
    renderActionButtons();
  }

  function renderActionButtons() {
    var actionsEl = document.getElementById('profile-actions');
    if (!actionsEl) return;

    var currentUser = window.firebaseAuth.getCurrentUser();

    if (isOwnProfile) {
      // 자신의 프로필
      actionsEl.innerHTML =
        '<a href="profile.html" class="profile-action-btn secondary">프로필 편집</a>';
    } else if (!currentUser) {
      // 로그인 안 함
      actionsEl.innerHTML =
        '<button class="profile-action-btn secondary" onclick="alert(\'로그인이 필요합니다\')">친구 추가</button>';
    } else if (isFriend) {
      // 이미 친구
      actionsEl.innerHTML =
        '<button class="profile-action-btn secondary" disabled>친구</button>' +
        '<button class="profile-action-btn danger" onclick="removeFriendFromProfile()">친구 삭제</button>';
    } else {
      // 친구 아님
      actionsEl.innerHTML =
        '<button class="profile-action-btn primary" onclick="sendFriendRequestFromProfile()">친구 추가</button>';
    }
  }

  // ==========================================
  // 피드 로드 (완료한 퀘스트)
  // ==========================================
  async function loadFeed() {
    var feedEl = document.getElementById('user-feed');
    var emptyEl = document.getElementById('empty-feed');
    if (!feedEl || !emptyEl) return;

    try {
      // Firestore에서 해당 사용자의 완료된 퀘스트 가져오기
      var completedQuests = [];

      if (window.firebaseDB && window.firebaseDB.getUserCompletedQuests) {
        completedQuests = await window.firebaseDB.getUserCompletedQuests(userId, 20);
      }

      if (completedQuests.length === 0) {
        feedEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
      }

      emptyEl.classList.add('hidden');

      var html = completedQuests.map(function(quest) {
        var questData = JSON.stringify(quest).replace(/'/g, '&#39;');
        if (quest.image) {
          return '<div class="feed-grid-item" data-quest=\'' + questData + '\'>' +
            '<img src="' + quest.image + '" alt="">' +
          '</div>';
        } else {
          return '<div class="feed-grid-item" data-quest=\'' + questData + '\'>' +
            '<div class="no-image">📝</div>' +
          '</div>';
        }
      }).join('');

      feedEl.innerHTML = html;

      // 클릭 이벤트
      feedEl.querySelectorAll('.feed-grid-item').forEach(function(item) {
        item.addEventListener('click', function() {
          var quest = JSON.parse(item.getAttribute('data-quest'));
          openQuestModal(quest);
        });
      });
    } catch (error) {
      console.error('피드 로드 실패:', error);
      feedEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
    }
  }

  // ==========================================
  // 친구 목록 로드
  // ==========================================
  async function loadFriends() {
    var listEl = document.getElementById('user-friends-list');
    var emptyEl = document.getElementById('empty-friends-tab');
    if (!listEl || !emptyEl) return;

    try {
      var friends = await window.firebaseDB.getUserFriends(userId);

      if (friends.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
      }

      emptyEl.classList.add('hidden');

      var html = friends.map(function(friend) {
        return '<div class="user-friend-item" onclick="goToProfile(\'' + friend.id + '\')">' +
          '<div class="user-friend-avatar">' +
            (friend.photoURL ? '<img src="' + friend.photoURL + '" alt="">' : '👤') +
          '</div>' +
          '<div class="user-friend-info">' +
            '<div class="user-friend-name">' + escapeHtml(friend.displayName || '사용자') + '</div>' +
            '<div class="user-friend-points">' + (friend.totalPoints || 0) + 'P</div>' +
          '</div>' +
        '</div>';
      }).join('');

      listEl.innerHTML = html;
    } catch (error) {
      console.error('친구 목록 로드 실패:', error);
    }
  }

  // ==========================================
  // 탭 관리
  // ==========================================
  function initTabs() {
    var tabBtns = document.querySelectorAll('.user-tab-btn');

    tabBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var tab = btn.getAttribute('data-tab');

        // 버튼 활성화
        tabBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        // 탭 컨텐츠 전환
        document.querySelectorAll('.user-tab-pane').forEach(function(pane) {
          pane.classList.remove('active');
        });
        document.getElementById('tab-' + tab).classList.add('active');
      });
    });
  }

  // ==========================================
  // 모달
  // ==========================================
  function initModal() {
    var modal = document.getElementById('quest-modal');
    var closeBtn = document.getElementById('modal-close');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeModal();
        }
      });
    }
  }

  function openQuestModal(quest) {
    var modal = document.getElementById('quest-modal');
    var imageEl = document.getElementById('quest-modal-image');
    var titleEl = document.getElementById('quest-modal-title');
    var dateEl = document.getElementById('quest-modal-date');
    var pointsEl = document.getElementById('quest-modal-points');

    if (!modal) return;

    if (imageEl) {
      if (quest.image) {
        imageEl.innerHTML = '<img src="' + quest.image + '" alt="">';
      } else {
        imageEl.innerHTML = '<div class="no-image" style="height:150px;display:flex;align-items:center;justify-content:center;font-size:48px;">📝</div>';
      }
    }

    if (titleEl) titleEl.textContent = quest.title;
    if (dateEl) dateEl.textContent = formatDate(quest.completedAt || quest.date);
    if (pointsEl) pointsEl.textContent = '+' + quest.points + 'P';

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    var modal = document.getElementById('quest-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // ==========================================
  // 전역 함수
  // ==========================================
  window.goToProfile = function(id) {
    window.location.href = 'user.html?id=' + id;
  };

  window.sendFriendRequestFromProfile = async function() {
    try {
      await window.firebaseDB.sendFriendRequest(userId);
      alert('친구 요청을 보냈습니다');
      isFriend = false; // 요청 보냄 상태로 버튼 업데이트 필요
      renderActionButtons();
    } catch (error) {
      alert(error.message);
    }
  };

  window.removeFriendFromProfile = async function() {
    if (!confirm('친구를 삭제하시겠습니까?')) return;

    try {
      await window.firebaseDB.removeFriend(userId);
      alert('친구가 삭제되었습니다');
      isFriend = false;
      renderActionButtons();
      loadFriends();
    } catch (error) {
      alert(error.message);
    }
  };

  // ==========================================
  // 유틸리티
  // ==========================================
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(dateString) {
    if (!dateString) return '';
    var date = new Date(dateString);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return year + '년 ' + month + '월 ' + day + '일';
  }
})();
