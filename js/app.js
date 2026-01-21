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
  var selectedDate = null; // 선택된 날짜 (YYYY-MM-DD 형식)

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

    // 이미지 업로드 초기화
    initImageUpload();

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

    // 퀘스트 완료 모달 제출 버튼
    var completeSubmitBtn = document.getElementById('complete-submit-btn');
    if (completeSubmitBtn) {
      completeSubmitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleCompleteQuest();
      }, false);
    }

    // 퀘스트 상세 모달 관련 요소
    var detailModal = document.getElementById('quest-detail-modal');
    var detailModalClose = document.getElementById('detail-modal-close');
    var detailDeleteBtn = document.getElementById('detail-delete-btn');
    var detailModalOverlay = detailModal ? detailModal.querySelector('.modal-overlay') : null;

    // 상세 모달 닫기 (X 버튼)
    if (detailModalClose) {
      detailModalClose.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal(detailModal);
      }, false);
    }

    // 상세 모달 닫기 (오버레이 클릭)
    if (detailModalOverlay) {
      detailModalOverlay.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal(detailModal);
      }, false);
    }

    // 상세 모달 삭제 버튼
    if (detailDeleteBtn) {
      detailDeleteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        handleDeleteFromDetail();
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
        if (detailModal && detailModal.classList.contains('active')) {
          closeModal(detailModal);
        }
      }
    }, false);

    debugPanel.log('✅ Event listeners attached');
    console.log('✅ Modal event listeners attached');
  }

  // ==========================================
  // 상세 모달에서 삭제 처리
  // ==========================================

  function handleDeleteFromDetail() {
    if (!currentViewingQuestId) {
      console.error('No quest ID found');
      return;
    }

    if (confirm('이 퀘스트를 삭제하시겠습니까?')) {
      deleteQuest(currentViewingQuestId);

      // 상세 모달 닫기
      var detailModal = document.getElementById('quest-detail-modal');
      closeModal(detailModal);

      // 상태 초기화
      currentViewingQuestId = null;

      debugPanel.log('✅ Quest deleted from detail modal');
      console.log('✅ Quest deleted from detail modal');
    }
  }

  // ==========================================
  // 퀘스트 완료 처리
  // ==========================================

  function handleCompleteQuest() {
    // 이미지 선택 필수 검증
    if (!currentCompressedImage) {
      alert('인증 사진을 선택해주세요!');
      debugPanel.log('❌ No image selected');
      return;
    }

    // 현재 완료 중인 퀘스트 ID 확인
    if (!currentCompletingQuestId) {
      console.error('No quest ID found');
      return;
    }

    // 퀘스트 완료 처리
    completeQuest(currentCompletingQuestId, currentCompressedImage);

    // 완료 모달 닫기
    var completeQuestModal = document.getElementById('complete-quest-modal');
    closeModal(completeQuestModal);

    // 상태 초기화
    currentCompletingQuestId = null;
    currentCompressedImage = null;

    debugPanel.log('✅ Quest completion submitted');
    console.log('✅ Quest completion submitted');
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
  // 이미지 압축
  // ==========================================

  /**
   * 이미지 파일을 압축하여 base64로 변환
   * @param {File} file - 압축할 이미지 파일
   * @param {number} maxWidth - 최대 너비 (기본값: 800px)
   * @param {number} quality - 이미지 품질 (0~1, 기본값: 0.8)
   * @returns {Promise<string>} base64 인코딩된 이미지
   */
  function compressImage(file, maxWidth, quality) {
    maxWidth = maxWidth || 800;
    quality = quality || 0.8;

    return new Promise(function(resolve, reject) {
      // 파일 크기 체크 (5MB)
      var maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        reject(new Error('이미지 파일은 5MB 이하만 업로드 가능합니다.'));
        return;
      }

      // 이미지 파일 타입 체크
      if (!file.type.match(/image.*/)) {
        reject(new Error('이미지 파일만 업로드 가능합니다.'));
        return;
      }

      var reader = new FileReader();

      reader.onload = function(e) {
        var img = new Image();

        img.onload = function() {
          // Canvas 생성
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d');

          // 비율 유지하면서 리사이징
          var width = img.width;
          var height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          // 이미지 그리기
          ctx.drawImage(img, 0, 0, width, height);

          // base64로 변환
          try {
            var base64 = canvas.toDataURL('image/jpeg', quality);
            debugPanel.log('✅ Image compressed: ' + Math.round(base64.length / 1024) + 'KB');
            console.log('✅ Image compressed:', width + 'x' + height, Math.round(base64.length / 1024) + 'KB');
            resolve(base64);
          } catch (error) {
            reject(new Error('이미지 압축 중 오류가 발생했습니다.'));
          }
        };

        img.onerror = function() {
          reject(new Error('이미지를 불러올 수 없습니다.'));
        };

        img.src = e.target.result;
      };

      reader.onerror = function() {
        reject(new Error('파일을 읽을 수 없습니다.'));
      };

      reader.readAsDataURL(file);
    });
  }

  // ==========================================
  // 이미지 업로드 핸들러
  // ==========================================

  // 전역 변수: 현재 선택된 이미지 (압축된 base64)
  var currentCompressedImage = null;

  function initImageUpload() {
    var imageInput = document.getElementById('quest-image');
    var imagePreview = document.getElementById('image-preview');

    if (!imageInput || !imagePreview) {
      console.error('Image upload elements not found');
      return;
    }

    imageInput.addEventListener('change', function(e) {
      var file = e.target.files[0];

      if (!file) {
        return;
      }

      debugPanel.log('📷 Image selected: ' + file.name);
      console.log('📷 Image selected:', file.name, Math.round(file.size / 1024) + 'KB');

      // 이미지 압축
      compressImage(file, 800, 0.8)
        .then(function(base64) {
          currentCompressedImage = base64;

          // 미리보기 표시
          imagePreview.innerHTML = '<img src="' + base64 + '" alt="preview">';
          imagePreview.classList.add('active');

          debugPanel.log('✅ Preview displayed');
          console.log('✅ Image preview displayed');
        })
        .catch(function(error) {
          alert(error.message);
          debugPanel.log('❌ Image error: ' + error.message);
          console.error('❌ Image compression error:', error);

          // 입력 초기화
          imageInput.value = '';
          currentCompressedImage = null;
        });
    }, false);

    console.log('✅ Image upload initialized');
  }

  // ==========================================
  // 날짜 포맷팅 유틸
  // ==========================================

  /**
   * ISO 날짜를 상대 시간으로 포맷팅
   * @param {string} isoDate - ISO 8601 날짜 문자열
   * @returns {string} 포맷팅된 날짜 ("방금 전", "3시간 전", "2026.1.21")
   */
  function formatRelativeTime(isoDate) {
    if (!isoDate) return '';

    var now = new Date();
    var date = new Date(isoDate);
    var diffMs = now - date;
    var diffSec = Math.floor(diffMs / 1000);
    var diffMin = Math.floor(diffSec / 60);
    var diffHour = Math.floor(diffMin / 60);
    var diffDay = Math.floor(diffHour / 24);

    // 1분 미만
    if (diffMin < 1) {
      return '방금 전';
    }
    // 1시간 미만
    if (diffHour < 1) {
      return diffMin + '분 전';
    }
    // 24시간 미만
    if (diffDay < 1) {
      return diffHour + '시간 전';
    }
    // 7일 미만
    if (diffDay < 7) {
      return diffDay + '일 전';
    }
    // 7일 이상: 날짜 포맷으로 표시
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return year + '.' + month + '.' + day;
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

    // 완료 퀘스트를 완료 날짜 최신순으로 정렬
    completedQuests.sort(function(a, b) {
      var dateA = new Date(a.completedAt || 0);
      var dateB = new Date(b.completedAt || 0);
      return dateB - dateA; // 최신순 (내림차순)
    });

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

    // 완료 퀘스트 렌더링 (리스트 뷰는 숨김)
    if (completedQuests.length === 0) {
      completedList.innerHTML = '';
      if (completedEmpty) completedEmpty.style.display = 'block';

      // 날짜 피커와 갤러리도 숨김
      var datePickerContainer = document.querySelector('.date-picker-container');
      var galleryEl = document.getElementById('quest-gallery');
      if (datePickerContainer) datePickerContainer.style.display = 'none';
      if (galleryEl) galleryEl.style.display = 'none';
    } else {
      if (completedEmpty) completedEmpty.style.display = 'none';
      completedList.innerHTML = completedQuests.map(function(quest) {
        return createQuestCard(quest);
      }).join('');

      // 날짜 피커와 갤러리 표시 및 렌더링
      var datePickerContainer = document.querySelector('.date-picker-container');
      var galleryEl = document.getElementById('quest-gallery');
      if (datePickerContainer) datePickerContainer.style.display = 'block';
      if (galleryEl) galleryEl.style.display = 'grid';

      renderDatePicker();
      renderQuestGallery();
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

    // 완료된 퀘스트에 이미지가 있으면 썸네일 표시
    var thumbnailHtml = '';
    if (quest.completed && quest.image) {
      thumbnailHtml = '<div class="quest-card-thumbnail">' +
        '<img src="' + quest.image + '" alt="인증 사진">' +
      '</div>';
    }

    // 완료 날짜 표시
    var dateHtml = '';
    if (quest.completed && quest.completedAt) {
      var relativeTime = formatRelativeTime(quest.completedAt);
      dateHtml = '<div class="quest-card-date">' + relativeTime + '</div>';
    }

    return '<div class="quest-card' + completedClass + '" data-id="' + quest.id + '">' +
      thumbnailHtml +
      '<div class="quest-card-content">' +
        '<div class="quest-card-title">' + escapeHtml(quest.title) + '</div>' +
        '<div class="quest-card-points">' + quest.points + 'P</div>' +
        dateHtml +
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

  // 전역 변수: 현재 완료 중인 퀘스트 ID
  var currentCompletingQuestId = null;

  // 전역 함수로 노출 (onclick 이벤트용)
  window.handleQuestAction = function(questId) {
    var quest = quests.find(function(q) { return q.id === questId; });

    if (!quest) {
      console.error('Quest not found:', questId);
      return;
    }

    if (quest.completed) {
      // 완료된 퀘스트는 상세 모달 열기
      openQuestDetailModal(questId);
    } else {
      // 진행중 퀘스트는 완료 모달 열기
      openCompleteModal(questId);
    }
  };

  function openCompleteModal(questId) {
    var quest = quests.find(function(q) { return q.id === questId; });

    if (!quest) return;

    // 현재 완료 중인 퀘스트 ID 저장
    currentCompletingQuestId = questId;

    // 모달에 퀘스트 제목 표시
    var questTitleDisplay = document.getElementById('complete-quest-title');
    if (questTitleDisplay) {
      questTitleDisplay.textContent = quest.title;
    }

    // 이미지 및 미리보기 초기화
    currentCompressedImage = null;
    var imageInput = document.getElementById('quest-image');
    var imagePreview = document.getElementById('image-preview');
    if (imageInput) imageInput.value = '';
    if (imagePreview) {
      imagePreview.innerHTML = '';
      imagePreview.classList.remove('active');
    }

    // 완료 모달 열기
    var completeQuestModal = document.getElementById('complete-quest-modal');
    openModal(completeQuestModal);

    debugPanel.log('📂 Opening complete modal for: ' + quest.title);
    console.log('📂 Opening complete modal for quest:', quest);
  }

  function completeQuest(questId, imageBase64) {
    var quest = quests.find(function(q) { return q.id === questId; });

    if (!quest) return;

    // 완료 상태로 변경
    quest.completed = true;
    quest.completedAt = new Date().toISOString();
    quest.image = imageBase64;

    // 저장 및 렌더링
    saveQuests();
    renderQuests();

    debugPanel.log('✅ Quest completed: ' + quest.title);
    console.log('✅ Quest completed:', quest);
  }

  // ==========================================
  // 완료 퀘스트 상세 모달
  // ==========================================

  // 전역 변수: 현재 보고 있는 퀘스트 ID
  var currentViewingQuestId = null;

  function openQuestDetailModal(questId) {
    var quest = quests.find(function(q) { return q.id === questId; });

    if (!quest) return;

    // 현재 보고 있는 퀘스트 ID 저장
    currentViewingQuestId = questId;

    // 상세 정보 표시
    var detailImage = document.getElementById('detail-image');
    var detailTitle = document.getElementById('detail-title');
    var detailPoints = document.getElementById('detail-points');
    var detailDate = document.getElementById('detail-date');

    if (detailImage && quest.image) {
      detailImage.innerHTML = '<img src="' + quest.image + '" alt="인증 사진">';
    }

    if (detailTitle) {
      detailTitle.textContent = quest.title;
    }

    if (detailPoints) {
      detailPoints.textContent = quest.points + 'P';
    }

    if (detailDate && quest.completedAt) {
      detailDate.textContent = formatRelativeTime(quest.completedAt);
    }

    // 상세 모달 열기
    var detailModal = document.getElementById('quest-detail-modal');
    openModal(detailModal);

    debugPanel.log('📂 Opening detail modal for: ' + quest.title);
    console.log('📂 Opening detail modal for quest:', quest);
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

  // ==========================================
  // 날짜 피커 및 갤러리 뷰
  // ==========================================

  /**
   * 날짜를 YYYY-MM-DD 형식으로 변환
   */
  function formatDateKey(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  /**
   * 완료 퀘스트에서 날짜별로 그룹화
   */
  function getQuestsByDate() {
    var completedQuests = quests.filter(function(q) { return q.completed; });
    var dateMap = {};

    completedQuests.forEach(function(quest) {
      if (quest.completedAt) {
        var date = new Date(quest.completedAt);
        var dateKey = formatDateKey(date);

        if (!dateMap[dateKey]) {
          dateMap[dateKey] = [];
        }
        dateMap[dateKey].push(quest);
      }
    });

    return dateMap;
  }

  /**
   * 날짜 피커 렌더링
   */
  function renderDatePicker() {
    var datePickerEl = document.getElementById('date-picker');
    if (!datePickerEl) return;

    var dateMap = getQuestsByDate();
    var dates = Object.keys(dateMap).sort().reverse(); // 최신 날짜부터

    if (dates.length === 0) {
      datePickerEl.innerHTML = '';
      return;
    }

    // 선택된 날짜가 없으면 첫 번째 날짜 선택
    if (!selectedDate && dates.length > 0) {
      selectedDate = dates[0];
    }

    var html = dates.map(function(dateKey) {
      var date = new Date(dateKey);
      var dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      var dayName = dayNames[date.getDay()];
      var day = date.getDate();
      var month = date.getMonth() + 1;
      var count = dateMap[dateKey].length;
      var isSelected = dateKey === selectedDate;

      return '<button class="date-btn' + (isSelected ? ' active' : '') + '" data-date="' + dateKey + '">' +
        '<div class="date-btn-day">' + month + '/' + day + '</div>' +
        '<div class="date-btn-weekday">' + dayName + '</div>' +
        '<div class="date-btn-count">' + count + '개</div>' +
      '</button>';
    }).join('');

    datePickerEl.innerHTML = html;

    // 날짜 버튼 클릭 이벤트
    var dateButtons = datePickerEl.querySelectorAll('.date-btn');
    for (var i = 0; i < dateButtons.length; i++) {
      dateButtons[i].addEventListener('click', function(e) {
        e.preventDefault();
        var dateKey = this.getAttribute('data-date');
        selectedDate = dateKey;
        renderDatePicker();
        renderQuestGallery();
      }, false);
    }
  }

  /**
   * 갤러리 뷰 렌더링
   */
  function renderQuestGallery() {
    var galleryEl = document.getElementById('quest-gallery');
    if (!galleryEl) return;

    var dateMap = getQuestsByDate();
    var questsForDate = dateMap[selectedDate] || [];

    if (questsForDate.length === 0) {
      galleryEl.innerHTML = '<div class="gallery-empty">이 날짜에 완료한 퀘스트가 없습니다.</div>';
      return;
    }

    // 완료 시간 순으로 정렬 (최신순)
    questsForDate.sort(function(a, b) {
      return new Date(b.completedAt) - new Date(a.completedAt);
    });

    var html = questsForDate.map(function(quest) {
      var time = new Date(quest.completedAt);
      var hours = String(time.getHours()).padStart(2, '0');
      var minutes = String(time.getMinutes()).padStart(2, '0');
      var timeStr = hours + ':' + minutes;

      return '<div class="gallery-item" data-id="' + quest.id + '" onclick="handleQuestAction(' + quest.id + ')">' +
        '<div class="gallery-image">' +
          '<img src="' + quest.image + '" alt="' + escapeHtml(quest.title) + '">' +
        '</div>' +
        '<div class="gallery-info">' +
          '<div class="gallery-title">' + escapeHtml(quest.title) + '</div>' +
          '<div class="gallery-meta">' +
            '<span class="gallery-time">' + timeStr + '</span>' +
            '<span class="gallery-points">' + quest.points + 'P</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    galleryEl.innerHTML = html;
  }

})(); // IIFE 종료
