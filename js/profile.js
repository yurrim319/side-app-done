(function() {
  'use strict';

  var quests = [];

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
    updateProfileStats();
    renderCompletedQuests();
    initModal();
  }

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

  // ==========================================
  // 프로필 통계
  // ==========================================
  function updateProfileStats() {
    var completedQuests = quests.filter(function(q) { return q.completed; });
    var totalPoints = completedQuests.reduce(function(sum, q) { return sum + q.points; }, 0);
    var streak = calculateStreak();

    var pointsEl = document.getElementById('profile-points');
    var streakEl = document.getElementById('profile-streak');
    var completedEl = document.getElementById('profile-completed');

    if (pointsEl) pointsEl.textContent = totalPoints;
    if (streakEl) streakEl.textContent = streak + '일';
    if (completedEl) completedEl.textContent = completedQuests.length + '개';
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
