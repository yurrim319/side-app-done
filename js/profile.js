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
