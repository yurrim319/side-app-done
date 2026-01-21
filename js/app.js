// 메인 애플리케이션 로직
(function() {
  'use strict';

  // 모바일 디버깅용 로그 함수
  var debugPanel = {
    element: null,
    logs: [],
    init: function() {
      this.element = document.getElementById('debug-panel');
      // URL에 ?debug 파라미터가 있으면 디버그 패널 표시
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

  // Safari 호환성: DOMContentLoaded가 이미 발생했는지 확인
  function initApp() {
    debugPanel.init();
    debugPanel.log('✅ App initialized');
    console.log('✅ App initialized');

    // 애플리케이션 초기화
    init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    // DOM이 이미 로드된 경우 즉시 실행
    initApp();
  }

  // 전역 상태 관리
  var quests = [];

  function init() {
    // 저장된 퀘스트 불러오기
    loadQuests();

    // 탭 전환 기능 초기화
    initTabs();

    // 모달 기능 초기화
    initModals();

    // 글자 수 카운터 초기화
    initCharCounter();

    // 퀘스트 추가 폼 초기화
    initQuestForm();

    // 초기 렌더링
    renderQuests();
  }

  // ==========================================
  // 탭 전환
  // ==========================================

  function initTabs() {
    var tabs = document.querySelectorAll('.tab');
    var tabContents = document.querySelectorAll('.tab-content');

    if (!tabs || tabs.length === 0) {
      console.error('Tabs not found');
      return;
    }

    // 저장된 탭 불러오기
    var savedTab = localStorage.getItem('currentTab') || 'active';
    switchTab(savedTab);

    // 각 탭에 클릭 이벤트 추가
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function(e) {
        e.preventDefault();
        var targetTab = this.getAttribute('data-tab');
        switchTab(targetTab);

        // 현재 탭 저장
        localStorage.setItem('currentTab', targetTab);

        debugPanel.log('📑 Tab: ' + targetTab);
        console.log('📑 Tab switched to:', targetTab);
      }, false);
    }

    console.log('✅ Tabs initialized');
  }

  function switchTab(tabName) {
    var tabs = document.querySelectorAll('.tab');
    var tabContents = document.querySelectorAll('.tab-content');

    // 모든 탭 비활성화
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('active');
    }

    // 모든 탭 콘텐츠 숨기기
    for (var j = 0; j < tabContents.length; j++) {
      tabContents[j].classList.remove('active');
    }

    // 특정 탭 활성화
    var targetTabBtn = document.querySelector('.tab[data-tab="' + tabName + '"]');
    if (targetTabBtn) {
      targetTabBtn.classList.add('active');
    }

    // 해당 탭 콘텐츠 표시
    var targetContent = document.getElementById(tabName + '-tab');
    if (targetContent) {
      targetContent.classList.add('active');
    }
  }

  // ==========================================
  // 모달 관리
  // ==========================================

  function initModals() {
    debugPanel.log('🔧 Initializing modals...');
    console.log('🔧 Initializing modals...');

    // 퀘스트 추가 모달 관련 요소
    var addQuestBtn = document.getElementById('add-quest-btn');
    var addQuestModal = document.getElementById('add-quest-modal');
    var addModalClose = document.getElementById('add-modal-close');
    var addCancelBtn = document.getElementById('add-cancel-btn');

    // 퀘스트 완료 모달 관련 요소
    var completeQuestModal = document.getElementById('complete-quest-modal');
    var completeModalClose = document.getElementById('complete-modal-close');
    var completeCancelBtn = document.getElementById('complete-cancel-btn');

  // 요소 존재 확인
  if (!addQuestBtn) {
    debugPanel.log('❌ add-quest-btn not found');
    console.error('❌ add-quest-btn not found');
    return;
  }
  if (!addQuestModal) {
    debugPanel.log('❌ add-quest-modal not found');
    console.error('❌ add-quest-modal not found');
    return;
  }
  if (!completeQuestModal) {
    debugPanel.log('❌ complete-quest-modal not found');
    console.error('❌ complete-quest-modal not found');
    return;
  }

    debugPanel.log('✅ All modal elements found');
    console.log('✅ All modal elements found');

    // 오버레이 요소 가져오기 (안전하게)
    var addModalOverlay = addQuestModal.querySelector('.modal-overlay');
    var completeModalOverlay = completeQuestModal.querySelector('.modal-overlay');

    // 퀘스트 추가 모달 열기
    if (addQuestBtn) {
      addQuestBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        debugPanel.log('🔵 FAB clicked');
        console.log('🔵 FAB clicked - opening add quest modal');
        openModal(addQuestModal);
      }, false);
    }

    // 퀘스트 추가 모달 닫기 (X 버튼)
    if (addModalClose) {
      addModalClose.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔴 Close button clicked');
        closeModal(addQuestModal);
      }, false);
    }

    // 퀘스트 추가 모달 닫기 (취소 버튼)
    if (addCancelBtn) {
      addCancelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔴 Cancel button clicked');
        closeModal(addQuestModal);
      }, false);
    }

    // 퀘스트 추가 모달 닫기 (오버레이 클릭)
    if (addModalOverlay) {
      addModalOverlay.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔴 Overlay clicked');
        closeModal(addQuestModal);
      }, false);
    }

    // 퀘스트 완료 모달 닫기 (X 버튼)
    if (completeModalClose) {
      completeModalClose.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal(completeQuestModal);
      }, false);
    }

    // 퀘스트 완료 모달 닫기 (취소 버튼)
    if (completeCancelBtn) {
      completeCancelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal(completeQuestModal);
      }, false);
    }

    // 퀘스트 완료 모달 닫기 (오버레이 클릭)
    if (completeModalOverlay) {
      completeModalOverlay.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal(completeQuestModal);
      }, false);
    }

    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        if (addQuestModal && addQuestModal.classList.contains('active')) {
          closeModal(addQuestModal);
        }
        if (completeQuestModal && completeQuestModal.classList.contains('active')) {
          closeModal(completeQuestModal);
        }
      }
    }, false);

    debugPanel.log('✅ Event listeners attached');
    console.log('✅ Modal event listeners attached');
  }

  // 모달 열기
  function openModal(modal) {
    if (!modal) {
      debugPanel.log('❌ Modal is null');
      console.error('❌ Modal element is null');
      return;
    }

    debugPanel.log('📂 Opening: ' + modal.id);
    console.log('📂 Opening modal:', modal.id);
    modal.classList.add('active');

    // body 스크롤 방지
    document.body.style.overflow = 'hidden';

    // 모달 상태 확인
    debugPanel.log('Classes: ' + modal.className);
    console.log('Modal classes after opening:', modal.className);
  }

  // 모달 닫기
  function closeModal(modal) {
    if (!modal) {
      console.error('❌ Modal element is null');
      return;
    }

    console.log('📁 Closing modal:', modal.id);
    modal.classList.remove('active');

    // body 스크롤 복원
    document.body.style.overflow = '';

    // 입력 필드 초기화 (퀘스트 추가 모달인 경우)
    if (modal.id === 'add-quest-modal') {
      var titleInput = document.getElementById('quest-title');
      var pointsInput = document.getElementById('quest-points');
      var charCount = document.getElementById('title-char-count');

      if (titleInput) titleInput.value = '';
      if (pointsInput) pointsInput.value = '100';
      if (charCount) charCount.textContent = '0';
    }

    // 이미지 미리보기 초기화 (퀘스트 완료 모달인 경우)
    if (modal.id === 'complete-quest-modal') {
      var imageInput = document.getElementById('quest-image');
      var imagePreview = document.getElementById('image-preview');

      if (imageInput) imageInput.value = '';
      if (imagePreview) {
        imagePreview.innerHTML = '';
        imagePreview.classList.remove('active');
      }
    }
  }

  // ==========================================
  // 글자 수 카운터
  // ==========================================

  function initCharCounter() {
    var titleInput = document.getElementById('quest-title');
    var charCount = document.getElementById('title-char-count');

    if (titleInput && charCount) {
      titleInput.addEventListener('input', function() {
        var length = titleInput.value.length;
        charCount.textContent = length;
      }, false);
      console.log('✅ Character counter initialized');
    }
  }

  // ==========================================
  // 스토리지 관리
  // ==========================================

  function loadQuests() {
    try {
      var savedQuests = localStorage.getItem('quests');
      quests = savedQuests ? JSON.parse(savedQuests) : [];
      debugPanel.log('✅ Loaded ' + quests.length + ' quests');
      console.log('✅ Loaded quests:', quests);
    } catch (error) {
      console.error('Failed to load quests:', error);
      quests = [];
    }
  }

  function saveQuests() {
    try {
      localStorage.setItem('quests', JSON.stringify(quests));
      debugPanel.log('✅ Saved ' + quests.length + ' quests');
      console.log('✅ Saved quests');
      return true;
    } catch (error) {
      console.error('Failed to save quests:', error);
      debugPanel.log('❌ Save failed');
      return false;
    }
  }

  // ==========================================
  // 퀘스트 추가 폼
  // ==========================================

  function initQuestForm() {
    var addSubmitBtn = document.getElementById('add-submit-btn');

    if (addSubmitBtn) {
      addSubmitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleAddQuest();
      }, false);
      console.log('✅ Quest form initialized');
    }
  }

  function handleAddQuest() {
    var titleInput = document.getElementById('quest-title');
    var pointsInput = document.getElementById('quest-points');

    if (!titleInput || !pointsInput) {
      debugPanel.log('❌ Form inputs not found');
      return;
    }

    var title = titleInput.value.trim();
    var points = parseInt(pointsInput.value, 10);

    // 유효성 검사
    if (!title) {
      alert('퀘스트 이름을 입력해주세요!');
      titleInput.focus();
      return;
    }

    if (title.length > 50) {
      alert('퀘스트 이름은 50자 이내로 입력해주세요!');
      titleInput.focus();
      return;
    }

    if (isNaN(points) || points < 10 || points > 1000) {
      alert('포인트는 10~1000 사이로 입력해주세요!');
      pointsInput.focus();
      return;
    }

    // 새 퀘스트 생성
    var newQuest = {
      id: Date.now(),
      title: title,
      points: points,
      completed: false,
      image: null,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    // 퀘스트 추가
    quests.push(newQuest);

    // 저장
    saveQuests();

    // UI 업데이트
    renderQuests();

    // 모달 닫기
    var addQuestModal = document.getElementById('add-quest-modal');
    closeModal(addQuestModal);

    debugPanel.log('✅ Quest added: ' + title);
    console.log('✅ Quest added:', newQuest);
  }

  // ==========================================
  // 퀘스트 렌더링
  // ==========================================

  function renderQuests() {
    var activeList = document.getElementById('active-quest-list');
    var activeEmpty = document.getElementById('active-empty');
    var completedList = document.getElementById('completed-quest-list');
    var completedEmpty = document.getElementById('completed-empty');
    var totalPointsEl = document.getElementById('total-points');

    if (!activeList || !completedList) {
      console.error('Quest list elements not found');
      return;
    }

    // 진행중/완료 퀘스트 분리
    var activeQuests = quests.filter(function(q) { return !q.completed; });
    var completedQuests = quests.filter(function(q) { return q.completed; });

    // 진행중 퀘스트 렌더링
    if (activeQuests.length === 0) {
      activeList.innerHTML = '';
      if (activeEmpty) activeEmpty.style.display = 'block';
    } else {
      if (activeEmpty) activeEmpty.style.display = 'none';
      activeList.innerHTML = activeQuests.map(function(quest) {
        return createQuestCard(quest);
      }).join('');
    }

    // 완료 퀘스트 렌더링
    if (completedQuests.length === 0) {
      completedList.innerHTML = '';
      if (completedEmpty) completedEmpty.style.display = 'block';
    } else {
      if (completedEmpty) completedEmpty.style.display = 'none';
      completedList.innerHTML = completedQuests.map(function(quest) {
        return createQuestCard(quest);
      }).join('');
    }

    // 총 포인트 계산
    var totalPoints = completedQuests.reduce(function(sum, quest) {
      return sum + quest.points;
    }, 0);

    if (totalPointsEl) {
      totalPointsEl.textContent = totalPoints;
    }

    debugPanel.log('📊 Active: ' + activeQuests.length + ', Done: ' + completedQuests.length);
    console.log('📊 Rendered - Active:', activeQuests.length, 'Completed:', completedQuests.length);
  }

  function createQuestCard(quest) {
    var completedClass = quest.completed ? ' completed' : '';
    var buttonText = quest.completed ? '✓' : '완료';

    return '<div class="quest-card' + completedClass + '" data-id="' + quest.id + '">' +
      '<div class="quest-card-content">' +
        '<div class="quest-card-title">' + escapeHtml(quest.title) + '</div>' +
        '<div class="quest-card-points">' + quest.points + 'P</div>' +
      '</div>' +
      '<button class="quest-card-btn" onclick="handleQuestAction(' + quest.id + ')">' +
        buttonText +
      '</button>' +
    '</div>';
  }

  // HTML 이스케이프 (XSS 방지)
  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ==========================================
  // 퀘스트 액션 (완료/삭제)
  // ==========================================

  // 전역 함수로 노출 (onclick 이벤트용)
  window.handleQuestAction = function(questId) {
    var quest = quests.find(function(q) { return q.id === questId; });

    if (!quest) {
      console.error('Quest not found:', questId);
      return;
    }

    if (quest.completed) {
      // 완료된 퀘스트는 삭제
      if (confirm('이 퀘스트를 삭제하시겠습니까?')) {
        deleteQuest(questId);
      }
    } else {
      // 진행중 퀘스트는 완료 처리
      completeQuest(questId);
    }
  };

  function completeQuest(questId) {
    var quest = quests.find(function(q) { return q.id === questId; });

    if (!quest) return;

    // 완료 상태로 변경
    quest.completed = true;
    quest.completedAt = new Date().toISOString();

    // 저장 및 렌더링
    saveQuests();
    renderQuests();

    debugPanel.log('✅ Quest completed: ' + quest.title);
    console.log('✅ Quest completed:', quest);
  }

  function deleteQuest(questId) {
    var index = quests.findIndex(function(q) { return q.id === questId; });

    if (index === -1) return;

    var deletedQuest = quests[index];
    quests.splice(index, 1);

    // 저장 및 렌더링
    saveQuests();
    renderQuests();

    debugPanel.log('🗑️ Quest deleted: ' + deletedQuest.title);
    console.log('🗑️ Quest deleted:', deletedQuest);
  }

})(); // IIFE 종료
