// 메인 애플리케이션 로직
(function() {
  'use strict';

  // ==========================================
  // 디버그 패널
  // ==========================================
  var debugPanel = {
    element: null,
    logs: [],
    init: function() {
      this.element = document.getElementById('debug-panel');
      if (window.location.search.indexOf('debug') !== -1) {
        this.show();
      }
    },
    show: function() {
      if (this.element) {
        this.element.style.display = 'block';
      }
    },
    log: function(message) {
      var timestamp = new Date().toLocaleTimeString();
      var logMessage = '[' + timestamp + '] ' + message;
      this.logs.push(logMessage);
      if (this.logs.length > 10) this.logs.shift();
      if (this.element) {
        this.element.innerHTML = this.logs.join('<br>');
        this.element.scrollTop = this.element.scrollHeight;
      }
      console.log(logMessage);
    }
  };

  // ==========================================
  // 앱 초기화
  // ==========================================
  function initApp() {
    debugPanel.init();
    debugPanel.log('✅ App initialized');
    console.log('✅ App initialized');
    init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  // ==========================================
  // 전역 상태
  // ==========================================
  var quests = [];
  var currentTab = 'home';
  var currentMonth = new Date();
  var selectedQuestId = null;
  var currentCompressedImage = null;
  var isAddingQuest = false; // 퀘스트 추가 중 플래그
  var lastAddQuestTime = 0; // 마지막 퀘스트 추가 시각 (중복 클릭 방지)

  // ==========================================
  // 초기화
  // ==========================================
  function init() {
    loadQuests();
    initTabs();
    initModals();
    initQuestForm();
    initImageUpload();
    
    // 날짜 입력 필드 초기화
    var dateInput = document.getElementById('quest-date');
    if (dateInput) {
      dateInput.value = getTodayDateString();
    }
    
    renderAll();
  }

  // ==========================================
  // 로컬 스토리지
  // ==========================================
  function loadQuests() {
    try {
      var stored = localStorage.getItem('quests');
      quests = stored ? JSON.parse(stored) : [];
      debugPanel.log('📂 Loaded ' + quests.length + ' quests');
    } catch (error) {
      console.error('Failed to load quests:', error);
      quests = [];
    }
  }

  function saveQuests() {
    try {
      localStorage.setItem('quests', JSON.stringify(quests));
      debugPanel.log('💾 Saved ' + quests.length + ' quests');
    } catch (error) {
      console.error('Failed to save quests:', error);
    }
  }

  // ==========================================
  // 탭 전환
  // ==========================================
  function initTabs() {
    var tabs = document.querySelectorAll('.tab');

    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function(e) {
        e.preventDefault();
        var targetTab = this.getAttribute('data-tab');
        switchTab(targetTab);
      }, false);
    }
  }

  function switchTab(tab) {
    currentTab = tab;

    // 탭 버튼 상태 업데이트
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-tab') === tab) {
        tabs[i].classList.add('active');
      } else {
        tabs[i].classList.remove('active');
      }
    }

    // 콘텐츠 표시/숨김
    var contents = document.querySelectorAll('.content');
    for (var j = 0; j < contents.length; j++) {
      contents[j].classList.remove('active');
    }

    var targetContent = document.getElementById(tab + '-content');
    if (targetContent) {
      targetContent.classList.add('active');
    }

    // 탭별 렌더링
    if (tab === 'home') {
      renderTodayQuests();
    } else if (tab === 'calendar') {
      renderCalendar();
    }

    debugPanel.log('📑 Switched to ' + tab + ' tab');
  }

  // ==========================================
  // 홈 탭 - 오늘의 퀘스트
  // ==========================================
  function renderTodayQuests() {
    var today = getTodayDateString();
    var todayQuests = quests.filter(function(q) {
      return q.date === today;
    });

    var completed = todayQuests.filter(function(q) { return q.completed; }).length;
    var total = todayQuests.length;

    // 진행률 업데이트
    var progressFill = document.getElementById('today-progress');
    var progressText = document.getElementById('progress-text');

    if (progressFill && progressText) {
      var percentage = total > 0 ? (completed / total) * 100 : 0;
      progressFill.style.width = percentage + '%';
      progressText.textContent = completed + '/' + total;
    }

    // 퀘스트 리스트 렌더링
    var listEl = document.getElementById('today-quest-list');
    var emptyEl = document.getElementById('today-empty');

    if (!listEl || !emptyEl) return;

    if (todayQuests.length === 0) {
      listEl.innerHTML = '';
      emptyEl.classList.remove('hidden');
    } else {
      emptyEl.classList.add('hidden');
      var html = todayQuests.map(function(quest) {
        return renderQuestCard(quest);
      }).join('');
      listEl.innerHTML = html;
    }

    updateStats();
  }

  function renderQuestCard(quest) {
    var completedClass = quest.completed ? ' completed' : '';
    var checkedClass = quest.completed ? ' checked' : '';
    var titleClass = quest.completed ? ' completed' : '';

    var html = '<div class="quest-card' + completedClass + '">' +
      '<div class="quest-card-header">' +
        '<div class="quest-card-left">' +
          '<div class="quest-checkbox' + checkedClass + '" onclick="handleCheckboxClick(\'' + quest.id + '\')"></div>' +
          '<div class="quest-info">' +
            '<h3 class="quest-title' + titleClass + '">' + escapeHtml(quest.title) + '</h3>' +
            '<div class="quest-meta">' +
              '<span class="quest-points">+' + quest.points + ' 포인트</span>';

    if (quest.completed && quest.completedAt) {
      html += '<span class="quest-time">' + formatRelativeTime(quest.completedAt) + '</span>';
    }

    html += '</div>' +
          '</div>' +
        '</div>' +
        '<div class="quest-actions">';

    if (!quest.completed) {
      html += '<button class="btn-complete" onclick="openCompleteModal(\'' + quest.id + '\')">' +
        '📷 인증하기' +
      '</button>';
    } else if (quest.verified) {
      html += '<div class="badge-verified">인증완료</div>';
    }

    html += '</div>' +
      '</div>' +
    '</div>';

    return html;
  }

  // 체크박스 클릭 (완료되지 않은 경우 완료 모달 열기)
  window.handleCheckboxClick = function(questId) {
    var quest = quests.find(function(q) { return q.id === questId; });
    if (quest && !quest.completed) {
      openCompleteModal(questId);
    }
  };

  // ==========================================
  // 캘린더 탭
  // ==========================================
  function renderCalendar() {
    var year = currentMonth.getFullYear();
    var month = currentMonth.getMonth();

    // 타이틀 업데이트
    var titleEl = document.getElementById('calendar-title');
    if (titleEl) {
      titleEl.textContent = year + '년 ' + (month + 1) + '월';
    }

    // 그리드 렌더링
    var gridEl = document.getElementById('calendar-grid');
    if (!gridEl) return;

    var firstDay = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0);
    var daysInMonth = lastDay.getDate();
    var startingDayOfWeek = firstDay.getDay();

    var html = '';

    // 빈 칸 추가
    for (var i = 0; i < startingDayOfWeek; i++) {
      html += '<div class="calendar-day empty"></div>';
    }

    // 날짜 추가
    for (var day = 1; day <= daysInMonth; day++) {
      html += renderCalendarDay(year, month, day);
    }

    gridEl.innerHTML = html;
  }

  function renderCalendarDay(year, month, day) {
    var date = new Date(year, month, day);
    var dateString = formatDateString(date);
    var dayQuests = quests.filter(function(q) { return q.date === dateString; });
    var completed = dayQuests.filter(function(q) { return q.completed; });

    var today = new Date();
    var isToday = day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear();

    var topPhoto = getTopPhotoForDay(dayQuests);
    var hasQuests = dayQuests.length > 0;
    var allCompleted = hasQuests && completed.length === dayQuests.length;

    var classes = 'calendar-day';
    if (isToday) classes += ' today';
    if (topPhoto) classes += ' has-photo';

    var html = '<div class="' + classes + '" onclick="openDayDetail(\'' + dateString + '\')">';

    if (topPhoto) {
      // 사진이 있는 경우
      html += '<img src="' + topPhoto + '" alt="Quest photo" class="day-photo">' +
        '<div class="day-number">' + day + '</div>';

      if (hasQuests) {
        html += '<div class="day-count">' + completed.length + '/' + dayQuests.length + '</div>';
      }
    } else {
      // 사진이 없는 경우
      html += '<div class="day-number">' + day + '</div>';

      if (hasQuests) {
        var circleClass = allCompleted ? 'all-completed' : 'partial';
        html += '<div class="day-quest-indicator">' +
          '<div class="day-circle ' + circleClass + '">' + completed.length + '</div>' +
          '<div class="day-total">/' + dayQuests.length + '</div>' +
        '</div>';
      }
    }

    html += '</div>';
    return html;
  }

  function getTopPhotoForDay(dayQuests) {
    var completedWithPhotos = dayQuests.filter(function(q) {
      return q.completed && q.image;
    });

    if (completedWithPhotos.length === 0) return null;

    // 가장 포인트가 높은 퀘스트의 사진 반환
    var topQuest = completedWithPhotos.reduce(function(prev, current) {
      return (prev.points > current.points) ? prev : current;
    });

    return topQuest.image;
  }

  // 월 이동
  window.prevMonth = function() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    renderCalendar();
  };

  window.nextMonth = function() {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    renderCalendar();
  };

  // ==========================================
  // 날짜별 상세 모달
  // ==========================================
  window.openDayDetail = function(dateString) {
    var dayQuests = quests.filter(function(q) { return q.date === dateString; });
    var completed = dayQuests.filter(function(q) { return q.completed; });
    var totalPoints = completed.reduce(function(sum, q) { return sum + q.points; }, 0);

    // 날짜 포맷팅
    var date = parseDateString(dateString);
    var dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    var formatted = date.getFullYear() + '년 ' + (date.getMonth() + 1) + '월 ' +
                    date.getDate() + '일 (' + dayNames[date.getDay()] + ')';

    // 모달 업데이트
    var titleEl = document.getElementById('day-detail-title');
    var summaryEl = document.getElementById('day-detail-summary');
    var listEl = document.getElementById('day-detail-list');
    var emptyEl = document.getElementById('day-detail-empty');

    if (titleEl) titleEl.textContent = formatted;
    if (summaryEl) {
      summaryEl.textContent = completed.length + '/' + dayQuests.length + '개 완료 • ' + totalPoints + ' 포인트';
    }

    if (listEl && emptyEl) {
      if (dayQuests.length === 0) {
        listEl.innerHTML = '';
        emptyEl.classList.remove('hidden');
      } else {
        emptyEl.classList.add('hidden');
        var html = dayQuests.map(function(quest) {
          return renderDayDetailItem(quest);
        }).join('');
        listEl.innerHTML = html;
      }
    }

    var modal = document.getElementById('day-detail-modal');
    if (modal) modal.classList.add('active');
  };

  function renderDayDetailItem(quest) {
    var itemClass = quest.completed ? 'day-detail-item' : 'day-detail-item incomplete';
    var html = '<div class="' + itemClass + '">';

    if (quest.image) {
      html += '<div class="day-detail-image">' +
        '<img src="' + quest.image + '" alt="' + escapeHtml(quest.title) + '">' +
      '</div>';
    }

    html += '<div class="day-detail-info">' +
        '<div>' +
          '<h3 class="day-detail-quest-title">' + escapeHtml(quest.title) + '</h3>';

    if (quest.completed && quest.verified) {
      html += '<div class="day-detail-badge">사진 인증 완료</div>';
    } else if (!quest.completed) {
      html += '<div class="day-detail-badge incomplete-badge">미완료</div>';
    }

    html += '</div>' +
        '<div class="day-detail-points' + (quest.completed ? '' : ' incomplete-points') + '">' +
          (quest.completed ? '+' : '') + quest.points + 'P' +
        '</div>' +
      '</div>' +
    '</div>';

    return html;
  }

  // ==========================================
  // 모달 관리
  // ==========================================
  function initModals() {
    // 퀘스트 추가 모달
    var addBtn = document.getElementById('add-quest-btn');
    var addModal = document.getElementById('add-quest-modal');
    var addClose = document.getElementById('add-modal-close');
    var addCancel = document.getElementById('add-cancel-btn');

    if (addBtn && addModal) {
      addBtn.addEventListener('click', function() {
        // 오늘 날짜로 기본 설정
        var dateInput = document.getElementById('quest-date');
        if (dateInput) {
          dateInput.value = getTodayDateString();
        }
        // 폼 초기화
        var titleInput = document.getElementById('quest-title');
        var pointsInput = document.getElementById('quest-points');
        var submitBtn = document.getElementById('add-submit-btn');
        if (titleInput) titleInput.value = '';
        if (pointsInput) pointsInput.value = '20';
        // 버튼 상태 완전 초기화
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '추가';
          submitBtn.style.pointerEvents = '';
          submitBtn.removeAttribute('data-processing');
        }
        isAddingQuest = false; // 플래그 초기화
        lastAddQuestTime = 0; // 타임스탬프 초기화
        addModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }, false);
    }

    if (addClose && addModal) {
      addClose.addEventListener('click', function() {
        addModal.classList.remove('active');
        document.body.style.overflow = '';
      }, false);
    }

    if (addCancel && addModal) {
      addCancel.addEventListener('click', function() {
        addModal.classList.remove('active');
        document.body.style.overflow = '';
      }, false);
    }

    // 완료 모달
    var completeModal = document.getElementById('complete-quest-modal');
    var completeClose = document.getElementById('complete-modal-close');
    var completeCancel = document.getElementById('complete-cancel-btn');

    if (completeClose && completeModal) {
      completeClose.addEventListener('click', function() {
        completeModal.classList.remove('active');
        currentCompressedImage = null;
        selectedQuestId = null;
      }, false);
    }

    if (completeCancel && completeModal) {
      completeCancel.addEventListener('click', function() {
        completeModal.classList.remove('active');
        currentCompressedImage = null;
        selectedQuestId = null;
      }, false);
    }

    // 날짜별 상세 모달
    var dayDetailModal = document.getElementById('day-detail-modal');
    var dayDetailClose = document.getElementById('day-detail-close');

    if (dayDetailClose && dayDetailModal) {
      dayDetailClose.addEventListener('click', function() {
        dayDetailModal.classList.remove('active');
      }, false);
    }

    // 모달 배경 클릭 시 닫기
    var modals = document.querySelectorAll('.modal');
    for (var i = 0; i < modals.length; i++) {
      modals[i].addEventListener('click', function(e) {
        if (e.target === this) {
          this.classList.remove('active');
          document.body.style.overflow = '';
          currentCompressedImage = null;
          selectedQuestId = null;
        }
      }, false);
    }
  }

  // ==========================================
  // 퀘스트 추가
  // ==========================================
  var questFormInitialized = false; // 초기화 플래그
  var lastTouchTime = 0; // 마지막 터치 시간

  function initQuestForm() {
    // 이미 초기화되었으면 다시 초기화하지 않음
    if (questFormInitialized) {
      return;
    }

    var submitBtn = document.getElementById('add-submit-btn');
    if (!submitBtn) {
      return;
    }

    // 터치 이벤트 핸들러
    var handleTouch = function(e) {
      debugPanel.log('📱 Touch event detected');
      lastTouchTime = Date.now();
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // 퀘스트 추가 처리
      handleAddQuest(e);
    };

    // 클릭 이벤트 핸들러
    var handleClick = function(e) {
      // 터치 이벤트 후 500ms 이내에 발생하는 클릭 이벤트는 무시 (모바일)
      var timeSinceTouch = Date.now() - lastTouchTime;
      if (timeSinceTouch < 500) {
        debugPanel.log('🚫 Click ignored (touch event occurred ' + timeSinceTouch + 'ms ago)');
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      debugPanel.log('🖱️ Click event detected');
      e.preventDefault();
      e.stopPropagation();
      handleAddQuest(e);
    };

    // 모든 디바이스에서 두 이벤트 모두 등록 (터치 후 클릭 무시)
    submitBtn.addEventListener('touchend', handleTouch, { passive: false });
    submitBtn.addEventListener('click', handleClick, false);

    questFormInitialized = true;
  }

  function handleAddQuest(e) {
    // 이벤트 기본 동작 방지
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }

    var submitBtn = document.getElementById('add-submit-btn');
    
    // 버튼에 이미 처리 중 표시가 있으면 무시
    if (submitBtn && submitBtn.getAttribute('data-processing') === 'true') {
      debugPanel.log('⚠️ Already processing (data attribute)');
      return;
    }

    // 타임스탬프 기반 중복 클릭 방지 (500ms 이내 중복 클릭 무시)
    var now = Date.now();
    if (now - lastAddQuestTime < 500) {
      debugPanel.log('⚠️ Duplicate click ignored (too fast: ' + (now - lastAddQuestTime) + 'ms)');
      return;
    }
    lastAddQuestTime = now;

    // 이미 처리 중이면 무시
    if (isAddingQuest) {
      debugPanel.log('⚠️ Already processing quest addition');
      return;
    }

    // 버튼 즉시 비활성화 및 처리 중 표시
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '추가 중...';
      submitBtn.setAttribute('data-processing', 'true');
      submitBtn.style.pointerEvents = 'none';
    }

    isAddingQuest = true;

    try {
      var titleInput = document.getElementById('quest-title');
      var pointsInput = document.getElementById('quest-points');
      var dateInput = document.getElementById('quest-date');

      if (!titleInput || !pointsInput || !dateInput) {
        debugPanel.log('❌ Form inputs not found');
        console.error('Form inputs not found');
        isAddingQuest = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '추가';
          submitBtn.removeAttribute('data-processing');
          submitBtn.style.pointerEvents = '';
        }
        return;
      }

      var title = titleInput.value.trim();
      var points = parseInt(pointsInput.value, 10);
      var date = dateInput.value;

      debugPanel.log('📝 Form data: title=' + title + ', points=' + points + ', date=' + date);

      // 유효성 검사
      if (!title) {
        alert('퀘스트 이름을 입력하세요.');
        isAddingQuest = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '추가';
          submitBtn.removeAttribute('data-processing');
          submitBtn.style.pointerEvents = '';
        }
        return;
      }

      if (isNaN(points) || points < 10 || points > 1000) {
        alert('포인트는 10~1000 사이로 입력하세요.');
        isAddingQuest = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '추가';
          submitBtn.removeAttribute('data-processing');
          submitBtn.style.pointerEvents = '';
        }
        return;
      }

      if (!date) {
        alert('날짜를 선택하세요.');
        isAddingQuest = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '추가';
          submitBtn.removeAttribute('data-processing');
          submitBtn.style.pointerEvents = '';
        }
        return;
      }

      // 퀘스트 생성 및 추가
      var newQuest = {
        id: Date.now().toString(),
        title: title,
        points: points,
        date: date,
        completed: false,
        verified: false,
        createdAt: new Date().toISOString()
      };

      debugPanel.log('➕ Creating quest: ' + JSON.stringify(newQuest));
      quests.push(newQuest);
      debugPanel.log('📊 Total quests: ' + quests.length);
      saveQuests();
      debugPanel.log('💾 Saved quests');
      renderAll();
      debugPanel.log('🔄 Rendered all');

      // 폼 초기화
      titleInput.value = '';
      pointsInput.value = '20';
      dateInput.value = getTodayDateString();

      // 모달 닫기
      var modal = document.getElementById('add-quest-modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }

      // 홈 탭으로 전환 (오늘 날짜인 경우)
      if (date === getTodayDateString()) {
        switchTab('home');
      }

      debugPanel.log('✅ Added quest: ' + title);
    } catch (error) {
      debugPanel.log('❌ Error adding quest: ' + error.message);
      console.error('Error adding quest:', error);
      alert('퀘스트 추가 중 오류가 발생했습니다: ' + error.message);
    } finally {
      // 처리 완료 후 플래그 및 버튼 상태 완전 복원
      isAddingQuest = false;
      var submitBtn = document.getElementById('add-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '추가';
        submitBtn.removeAttribute('data-processing');
        submitBtn.style.pointerEvents = '';
      }
    }
  }

  // ==========================================
  // 퀘스트 완료
  // ==========================================
  window.openCompleteModal = function(questId) {
    var quest = quests.find(function(q) { return q.id === questId; });
    if (!quest || quest.completed) return;

    selectedQuestId = questId;

    var titleEl = document.getElementById('complete-quest-title');
    var pointsEl = document.getElementById('complete-quest-points');
    var previewEl = document.getElementById('image-preview');

    if (titleEl) titleEl.textContent = quest.title;
    if (pointsEl) pointsEl.textContent = '+' + quest.points + ' 포인트';
    if (previewEl) {
      previewEl.innerHTML = '';
      previewEl.classList.remove('active');
    }

    currentCompressedImage = null;

    var modal = document.getElementById('complete-quest-modal');
    if (modal) modal.classList.add('active');

    debugPanel.log('📷 Opened complete modal for: ' + quest.title);
  };

  function initImageUpload() {
    var imageInput = document.getElementById('quest-image');
    var imageUploadArea = document.getElementById('image-upload-area');
    var imagePreview = document.getElementById('image-preview');
    var submitBtn = document.getElementById('complete-submit-btn');

    // 업로드 영역 클릭 시 파일 선택
    if (imageUploadArea && imageInput) {
      imageUploadArea.addEventListener('click', function() {
        imageInput.click();
      }, false);
    }

    // 파일 선택 시
    if (imageInput) {
      imageInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;

        debugPanel.log('📷 Image selected: ' + file.name);

        // 이미지 압축 (용량 절약을 위해 품질 낮춤)
        compressImage(file, 600, 0.6)
          .then(function(base64) {
            currentCompressedImage = base64;

            // 미리보기 표시
            if (imagePreview) {
              imagePreview.innerHTML = '<img src="' + base64 + '" alt="preview">';
              imagePreview.classList.add('active');
            }

            debugPanel.log('✅ Image compressed');
          })
          .catch(function(error) {
            alert(error.message);
            imageInput.value = '';
            currentCompressedImage = null;
          });
      }, false);
    }

    // 완료 버튼
    if (submitBtn) {
      submitBtn.addEventListener('click', function() {
        if (!selectedQuestId) return;

        if (!currentCompressedImage) {
          alert('인증 사진을 선택해주세요.');
          return;
        }

        completeQuest(selectedQuestId, currentCompressedImage);

        // 모달 닫기
        var modal = document.getElementById('complete-quest-modal');
        if (modal) modal.classList.remove('active');

        // 초기화
        selectedQuestId = null;
        currentCompressedImage = null;
        if (imageInput) imageInput.value = '';
        if (imagePreview) {
          imagePreview.innerHTML = '';
          imagePreview.classList.remove('active');
        }
      }, false);
    }
  }

  function completeQuest(questId, imageBase64) {
    var quest = quests.find(function(q) { return q.id === questId; });
    if (!quest) return;

    quest.completed = true;
    quest.completedAt = new Date().toISOString();
    quest.image = imageBase64;
    quest.verified = true;

    saveQuests();

    // 이미지 개수 제한 체크 및 자동 정리
    cleanupOldQuestsIfNeeded();

    renderAll();

    debugPanel.log('✅ Quest completed: ' + quest.title);
  }

  // ==========================================
  // 이미지 압축
  // ==========================================
  function compressImage(file, maxWidth, quality) {
    maxWidth = maxWidth || 600;
    quality = quality || 0.6;

    return new Promise(function(resolve, reject) {
      var maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        reject(new Error('이미지 파일은 5MB 이하만 업로드 가능합니다.'));
        return;
      }

      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d');

          var width = img.width;
          var height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          var base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        };
        img.onerror = function() {
          reject(new Error('이미지 로드 실패'));
        };
        img.src = e.target.result;
      };
      reader.onerror = function() {
        reject(new Error('파일 읽기 실패'));
      };
      reader.readAsDataURL(file);
    });
  }

  // ==========================================
  // 자동 정리
  // ==========================================
  function cleanupOldQuestsIfNeeded() {
    try {
      var DEFAULT_MAX_IMAGES = 20;
      var maxImages = parseInt(localStorage.getItem('maxImages') || DEFAULT_MAX_IMAGES, 10);

      var completedWithImages = quests.filter(function(q) {
        return q.completed && q.image;
      });

      if (completedWithImages.length > maxImages) {
        completedWithImages.sort(function(a, b) {
          return new Date(b.completedAt) - new Date(a.completedAt);
        });

        var toDelete = completedWithImages.slice(maxImages);
        var deleteIds = toDelete.map(function(q) { return q.id; });

        quests = quests.filter(function(q) {
          return deleteIds.indexOf(q.id) === -1;
        });

        saveQuests();

        console.log('🗑️ Auto-cleanup:', toDelete.length, 'old quests deleted');
        debugPanel.log('🗑️ ' + toDelete.length + '개 오래된 퀘스트 자동 삭제');
      }
    } catch (error) {
      console.error('Failed to cleanup old quests:', error);
    }
  }

  // ==========================================
  // 통계 업데이트
  // ==========================================
  function updateStats() {
    // 총 포인트
    var totalPoints = quests.filter(function(q) { return q.completed; })
      .reduce(function(sum, q) { return sum + q.points; }, 0);

    var pointsEl = document.getElementById('total-points');
    if (pointsEl) pointsEl.textContent = totalPoints;

    // 연속 달성일
    var streak = calculateStreak();
    var streakEl = document.getElementById('streak-text');
    if (streakEl) streakEl.textContent = streak + '일 연속 달성 중 🔥';
  }

  function calculateStreak() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var streak = 0;
    var checkDate = new Date(today);

    while (true) {
      var dateString = formatDateString(checkDate);
      var dayQuests = quests.filter(function(q) { return q.date === dateString; });
      var allCompleted = dayQuests.length > 0 &&
                        dayQuests.every(function(q) { return q.completed; });

      if (allCompleted) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }

      // 최대 365일까지만 체크
      if (streak >= 365) break;
    }

    return streak;
  }

  // ==========================================
  // 렌더링
  // ==========================================
  function renderAll() {
    if (currentTab === 'home') {
      renderTodayQuests();
    } else if (currentTab === 'calendar') {
      renderCalendar();
    }
    updateStats();
  }

  // ==========================================
  // 유틸리티 함수
  // ==========================================
  function getTodayDateString() {
    var today = new Date();
    return formatDateString(today);
  }

  function formatDateString(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function parseDateString(dateString) {
    var parts = dateString.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  function formatRelativeTime(isoDate) {
    if (!isoDate) return '';

    var now = new Date();
    var date = new Date(isoDate);
    var diffMs = now - date;
    var diffMin = Math.floor(diffMs / 1000 / 60);
    var diffHour = Math.floor(diffMin / 60);
    var diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return '방금 전';
    if (diffHour < 1) return diffMin + '분 전';
    if (diffDay < 1) return diffHour + '시간 전';
    if (diffDay < 7) return diffDay + '일 전';

    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return year + '.' + month + '.' + day;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 월 네비게이션 버튼 연결
  var prevMonthBtn = document.getElementById('prev-month');
  var nextMonthBtn = document.getElementById('next-month');

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', function() {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      renderCalendar();
    }, false);
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', function() {
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      renderCalendar();
    }, false);
  }

  // 전역 함수 노출 (필요한 경우)
  debugPanel.log('🎉 App ready!');

})();
