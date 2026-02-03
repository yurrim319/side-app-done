(function() {
  'use strict';

  var quests = [];
  var repeatQuests = [];

  // 배지 정의
  var BADGES = [
    { id: 'first_step', name: '첫 걸음', icon: '🎯', condition: function(stats) { return stats.totalCompleted >= 1; } },
    { id: 'rookie', name: '루키', icon: '🌱', condition: function(stats) { return stats.totalCompleted >= 10; } },
    { id: 'challenger', name: '챌린저', icon: '💪', condition: function(stats) { return stats.totalCompleted >= 50; } },
    { id: 'week_streak', name: '일주일 연속', icon: '🔥', condition: function(stats) { return stats.streak >= 7; } },
    { id: 'month_streak', name: '한달 연속', icon: '⭐', condition: function(stats) { return stats.streak >= 30; } },
    { id: 'point_master', name: '포인트 마스터', icon: '🏆', condition: function(stats) { return stats.totalPoints >= 1000; } }
  ];

  // ==========================================
  // 초기화
  // ==========================================
  function initApp() {
    console.log('👤 Profile page initialized');
    init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  function init() {
    loadQuests();
    loadRepeatQuests();
    updateProfileStats();
    renderWeeklyHeatmap();
    renderBadges();
    renderCompletedQuests();
    initModal();
    initFriendSection();
  }

  // ==========================================
  // 친구 기능
  // ==========================================
  function initFriendSection() {
    // Firebase 준비 대기
    if (window.firebaseReady) {
      setupFriendListeners();
    } else {
      window.addEventListener('firebaseReady', setupFriendListeners);
    }
  }

  function setupFriendListeners() {
    // 인증 상태 변경 시
    window.firebaseAuth.onAuthStateChanged(function(user) {
      var friendSection = document.getElementById('friend-section');
      if (user) {
        if (friendSection) friendSection.classList.remove('hidden');
        loadFriendData();
      } else {
        if (friendSection) friendSection.classList.add('hidden');
      }
    });

    // 친구 코드 복사 버튼
    var copyBtn = document.getElementById('copy-friend-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', copyFriendCode);
    }

    // 친구 추가 버튼
    var addBtn = document.getElementById('add-friend-btn');
    if (addBtn) {
      addBtn.addEventListener('click', addFriend);
    }

    // 친구 코드 입력 엔터키
    var codeInput = document.getElementById('friend-code-input');
    if (codeInput) {
      codeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          addFriend();
        }
      });
    }
  }

  function loadFriendData() {
    loadMyFriendCode();
    loadFriendRequests();
    loadFriendList();
  }

  // 내 친구 코드 표시
  async function loadMyFriendCode() {
    if (!window.firebaseDB) return;

    try {
      var profile = await window.firebaseDB.getMyProfile();
      var codeEl = document.getElementById('my-friend-code');
      if (codeEl && profile && profile.friendCode) {
        codeEl.textContent = profile.friendCode;
      }
    } catch (error) {
      console.error('친구 코드 로드 실패:', error);
    }
  }

  // 친구 코드 복사
  function copyFriendCode() {
    var codeEl = document.getElementById('my-friend-code');
    if (!codeEl) return;

    var code = codeEl.textContent;
    if (code === '------') return;

    navigator.clipboard.writeText(code).then(function() {
      alert('친구 코드가 복사되었습니다: ' + code);
    }).catch(function() {
      // fallback for older browsers
      var textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('친구 코드가 복사되었습니다: ' + code);
    });
  }

  // 친구 추가
  async function addFriend() {
    var input = document.getElementById('friend-code-input');
    if (!input) return;

    var code = input.value.trim().toUpperCase();
    if (!code || code.length !== 6) {
      alert('6자리 친구 코드를 입력해주세요');
      return;
    }

    try {
      // 친구 코드로 유저 찾기
      var user = await window.firebaseDB.findUserByFriendCode(code);
      if (!user) {
        alert('존재하지 않는 친구 코드입니다');
        return;
      }

      // 친구 요청 보내기
      await window.firebaseDB.sendFriendRequest(user.id);
      alert(user.displayName + '님에게 친구 요청을 보냈습니다');
      input.value = '';
    } catch (error) {
      alert(error.message);
    }
  }

  // 받은 친구 요청 로드
  async function loadFriendRequests() {
    if (!window.firebaseDB) return;

    var listEl = document.getElementById('friend-request-list');
    var emptyEl = document.getElementById('empty-requests');
    var countEl = document.getElementById('request-count');
    if (!listEl || !emptyEl) return;

    try {
      var requests = await window.firebaseDB.getPendingFriendRequests();

      if (countEl) {
        countEl.textContent = requests.length > 0 ? '(' + requests.length + ')' : '';
      }

      if (requests.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
      }

      emptyEl.classList.add('hidden');

      var html = requests.map(function(req) {
        return '<div class="friend-request-item" data-request-id="' + req.id + '">' +
          '<div class="friend-avatar">' +
            (req.fromPhoto ? '<img src="' + req.fromPhoto + '" alt="">' : '👤') +
          '</div>' +
          '<div class="friend-info">' +
            '<div class="friend-name">' + escapeHtml(req.fromName || '익명') + '</div>' +
          '</div>' +
          '<div class="friend-actions">' +
            '<button class="accept-btn" onclick="acceptRequest(\'' + req.id + '\')">수락</button>' +
            '<button class="reject-btn" onclick="rejectRequest(\'' + req.id + '\')">거절</button>' +
          '</div>' +
        '</div>';
      }).join('');

      listEl.innerHTML = html;
    } catch (error) {
      console.error('친구 요청 로드 실패:', error);
    }
  }

  // 친구 목록 로드
  async function loadFriendList() {
    if (!window.firebaseDB) return;

    var listEl = document.getElementById('friend-list');
    var emptyEl = document.getElementById('empty-friends');
    var countEl = document.getElementById('friend-count');
    if (!listEl || !emptyEl) return;

    try {
      var friends = await window.firebaseDB.getFriends();

      if (countEl) {
        countEl.textContent = friends.length > 0 ? '(' + friends.length + ')' : '';
      }

      if (friends.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
        return;
      }

      emptyEl.classList.add('hidden');

      var html = friends.map(function(friend) {
        return '<div class="friend-item" data-friend-id="' + friend.id + '">' +
          '<div class="friend-avatar">' +
            (friend.photoURL ? '<img src="' + friend.photoURL + '" alt="">' : '👤') +
          '</div>' +
          '<div class="friend-info">' +
            '<div class="friend-name">' + escapeHtml(friend.displayName || '익명') + '</div>' +
            '<div class="friend-points">' + (friend.totalPoints || 0) + 'P</div>' +
          '</div>' +
          '<div class="friend-actions">' +
            '<button class="remove-btn" onclick="removeFriendClick(\'' + friend.id + '\')">삭제</button>' +
          '</div>' +
        '</div>';
      }).join('');

      listEl.innerHTML = html;
    } catch (error) {
      console.error('친구 목록 로드 실패:', error);
    }
  }

  // 전역 함수 (onclick에서 호출)
  window.acceptRequest = async function(requestId) {
    try {
      await window.firebaseDB.acceptFriendRequest(requestId);
      alert('친구 요청을 수락했습니다');
      loadFriendRequests();
      loadFriendList();
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  window.rejectRequest = async function(requestId) {
    try {
      await window.firebaseDB.rejectFriendRequest(requestId);
      alert('친구 요청을 거절했습니다');
      loadFriendRequests();
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  window.removeFriendClick = async function(friendId) {
    if (!confirm('이 친구를 삭제하시겠습니까?')) return;

    try {
      await window.firebaseDB.removeFriend(friendId);
      alert('친구가 삭제되었습니다');
      loadFriendList();
    } catch (error) {
      alert('오류: ' + error.message);
    }
  };

  // ==========================================
  // 데이터 로드
  // ==========================================
  function loadQuests() {
    try {
      var data = localStorage.getItem('quests');
      quests = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load quests:', error);
      quests = [];
    }
  }

  function loadRepeatQuests() {
    try {
      var data = localStorage.getItem('repeatQuests');
      repeatQuests = data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load repeat quests:', error);
      repeatQuests = [];
    }
  }

  // ==========================================
  // 프로필 통계
  // ==========================================
  function updateProfileStats() {
    var completedQuests = quests.filter(function(q) { return q.completed; });
    var singlePoints = completedQuests.reduce(function(sum, q) { return sum + q.points; }, 0);

    // 반복 퀘스트 포인트 계산
    var repeatPoints = 0;
    var repeatCompletedCount = 0;
    repeatQuests.forEach(function(rq) {
      if (rq.completedDates) {
        var count = Object.keys(rq.completedDates).length;
        repeatCompletedCount += count;
        repeatPoints += rq.points * count;
      }
    });

    var totalPoints = singlePoints + repeatPoints;
    var totalCompleted = completedQuests.length + repeatCompletedCount;
    var streak = calculateStreak();

    var pointsEl = document.getElementById('profile-points');
    var streakEl = document.getElementById('profile-streak');
    var completedEl = document.getElementById('profile-completed');

    if (pointsEl) pointsEl.textContent = totalPoints;
    if (streakEl) streakEl.textContent = streak + '일';
    if (completedEl) completedEl.textContent = totalCompleted + '개';
  }

  function calculateStreak() {
    var completedDates = quests
      .filter(function(q) { return q.completed; })
      .map(function(q) { return q.date; })
      .filter(function(date, index, self) { return self.indexOf(date) === index; })
      .sort()
      .reverse();

    if (completedDates.length === 0) return 0;

    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var todayString = formatDateString(today);

    var streak = 0;
    var currentDate = new Date(today);

    for (var i = 0; i < completedDates.length; i++) {
      var dateString = formatDateString(currentDate);

      if (completedDates.indexOf(dateString) !== -1) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        if (i === 0 && dateString !== todayString) {
          var yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          var yesterdayString = formatDateString(yesterday);

          if (completedDates.indexOf(yesterdayString) !== -1) {
            currentDate = new Date(yesterday);
            i = -1;
            continue;
          }
        }
        break;
      }
    }

    return streak;
  }

  // ==========================================
  // 주간 히트맵
  // ==========================================
  function getWeeklyActivity() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var weekData = [];
    var dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    for (var i = 6; i >= 0; i--) {
      var date = new Date(today);
      date.setDate(date.getDate() - i);
      var dateString = formatDateString(date);
      var dayOfWeek = date.getDay();

      // 해당 날짜의 일반 퀘스트
      var dayQuests = quests.filter(function(q) { return q.date === dateString; });
      var completedSingle = dayQuests.filter(function(q) { return q.completed; }).length;

      // 해당 날짜의 반복 퀘스트
      var dayRepeatQuests = repeatQuests.filter(function(rq) {
        return rq.repeatDays && rq.repeatDays.indexOf(dayOfWeek) !== -1;
      });
      var completedRepeat = dayRepeatQuests.filter(function(rq) {
        return rq.completedDates && rq.completedDates[dateString];
      }).length;

      var totalQuests = dayQuests.length + dayRepeatQuests.length;
      var completedQuests = completedSingle + completedRepeat;
      var rate = totalQuests > 0 ? Math.round((completedQuests / totalQuests) * 100) : 0;

      weekData.push({
        date: dateString,
        dayName: dayNames[dayOfWeek],
        total: totalQuests,
        completed: completedQuests,
        rate: rate
      });
    }

    return weekData;
  }

  function renderWeeklyHeatmap() {
    var container = document.getElementById('weekly-heatmap');
    if (!container) return;

    var weekData = getWeeklyActivity();
    var html = '';

    weekData.forEach(function(day) {
      var levelClass = 'level-0';
      if (day.rate === 100) {
        levelClass = 'level-3';
      } else if (day.rate >= 50) {
        levelClass = 'level-2';
      } else if (day.rate > 0) {
        levelClass = 'level-1';
      }

      html += '<div class="heatmap-cell ' + levelClass + '">';
      html += '<span class="heatmap-day">' + day.dayName + '</span>';
      html += '<span class="heatmap-dot"></span>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  // ==========================================
  // 성취 배지
  // ==========================================
  function getStats() {
    var completedQuests = quests.filter(function(q) { return q.completed; });
    var singlePoints = completedQuests.reduce(function(sum, q) { return sum + q.points; }, 0);

    var repeatPoints = 0;
    var repeatCompletedCount = 0;
    repeatQuests.forEach(function(rq) {
      if (rq.completedDates) {
        var count = Object.keys(rq.completedDates).length;
        repeatCompletedCount += count;
        repeatPoints += rq.points * count;
      }
    });

    return {
      totalCompleted: completedQuests.length + repeatCompletedCount,
      totalPoints: singlePoints + repeatPoints,
      streak: calculateStreak()
    };
  }

  function checkBadges() {
    var stats = getStats();
    var earned = [];

    BADGES.forEach(function(badge) {
      if (badge.condition(stats)) {
        earned.push(badge.id);
      }
    });

    return earned;
  }

  function renderBadges() {
    var container = document.getElementById('badges-grid');
    if (!container) return;

    var earnedBadges = checkBadges();
    var html = '';

    BADGES.forEach(function(badge) {
      var isEarned = earnedBadges.indexOf(badge.id) !== -1;
      var itemClass = isEarned ? 'badge-item earned' : 'badge-item locked';

      html += '<div class="' + itemClass + '">';
      html += '<span class="badge-icon">' + badge.icon + '</span>';
      html += '<span class="badge-name">' + badge.name + '</span>';
      html += '</div>';
    });

    container.innerHTML = html;
  }

  // ==========================================
  // 완료한 퀘스트 렌더링
  // ==========================================
  function renderCompletedQuests() {
    var completedQuests = quests
      .filter(function(q) { return q.completed; })
      .sort(function(a, b) {
        return new Date(b.completedAt) - new Date(a.completedAt);
      });

    var galleryEl = document.getElementById('completed-quests-gallery');
    var emptyEl = document.getElementById('profile-empty');

    if (!galleryEl || !emptyEl) return;

    if (completedQuests.length === 0) {
      galleryEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }

    emptyEl.classList.add('hidden');

    var html = completedQuests.map(function(quest) {
      return renderGalleryItem(quest);
    }).join('');

    galleryEl.innerHTML = html;

    // 클릭 이벤트 추가
    var feedItems = galleryEl.querySelectorAll('.feed-item');
    feedItems.forEach(function(item) {
      item.addEventListener('click', function() {
        var questId = item.getAttribute('data-quest-id');
        var quest = completedQuests.find(function(q) { return q.id === questId; });
        if (quest) {
          openQuestModal(quest);
        }
      });
    });
  }

  function renderGalleryItem(quest) {
    // 인스타그램 피드 형식: 이미지만 표시
    var html = '<div class="feed-item" data-quest-id="' + quest.id + '">';

    if (quest.image) {
      html += '<div class="feed-photo">' +
        '<img src="' + quest.image + '" alt="' + escapeHtml(quest.title) + '">' +
      '</div>';
    } else {
      html += '<div class="feed-photo no-photo">' +
        '<span class="no-photo-icon">📝</span>' +
      '</div>';
    }

    html += '</div>';

    return html;
  }

  // ==========================================
  // 유틸리티 함수
  // ==========================================
  function formatDateString(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function formatDate(dateString) {
    var date = new Date(dateString);
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return month + '월 ' + day + '일';
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================
  // 모달 관리
  // ==========================================
  function initModal() {
    var modal = document.getElementById('quest-detail-modal');
    var closeBtn = document.getElementById('quest-detail-close');

    if (closeBtn) {
      closeBtn.addEventListener('click', closeQuestModal);
    }

    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeQuestModal();
        }
      });
    }
  }

  function openQuestModal(quest) {
    var modal = document.getElementById('quest-detail-modal');
    var imageEl = document.getElementById('quest-detail-image');
    var titleEl = document.getElementById('quest-detail-title');
    var dateEl = document.getElementById('quest-detail-date');
    var pointsEl = document.getElementById('quest-detail-points');

    if (!modal || !imageEl || !titleEl || !dateEl || !pointsEl) return;

    // 이미지 표시
    if (quest.image) {
      imageEl.innerHTML = '<img src="' + quest.image + '" alt="' + escapeHtml(quest.title) + '">';
    } else {
      imageEl.innerHTML = '<div class="quest-detail-no-photo"><span class="no-photo-icon">📝</span></div>';
    }

    // 제목 표시
    titleEl.textContent = quest.title;

    // 완료 날짜 표시
    if (quest.completedAt) {
      var completedDate = new Date(quest.completedAt);
      dateEl.textContent = formatCompletedDate(completedDate);
    } else {
      dateEl.textContent = formatDate(quest.date);
    }

    // 포인트 표시
    pointsEl.textContent = '+' + quest.points + 'P';

    // 모달 열기
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeQuestModal() {
    var modal = document.getElementById('quest-detail-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  function formatCompletedDate(date) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? '오후' : '오전';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return year + '년 ' + month + '월 ' + day + '일 ' + ampm + ' ' + hours + ':' + minutes;
  }
})();
