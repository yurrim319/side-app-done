(function() {
  'use strict';

  // ==========================================
  // 초기화
  // ==========================================

  function initApp() {
    console.log('🔧 Admin page initialized');
    init();
  }

  // DOM 로드 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

  function init() {
    loadSettings();
    updateStorageInfo();
    initEventListeners();
  }

  // ==========================================
  // 설정 관리
  // ==========================================

  var DEFAULT_MAX_IMAGES = 20;

  function loadSettings() {
    try {
      var maxImages = localStorage.getItem('maxImages');
      if (maxImages) {
        document.getElementById('max-images').value = parseInt(maxImages, 10);
      } else {
        document.getElementById('max-images').value = DEFAULT_MAX_IMAGES;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  function saveSettings() {
    try {
      var maxImages = parseInt(document.getElementById('max-images').value, 10);

      if (maxImages < 5 || maxImages > 100) {
        showToast('이미지 개수는 5~100 사이여야 합니다.');
        return;
      }

      localStorage.setItem('maxImages', maxImages);
      showToast('설정이 저장되었습니다.');

      // 저장 후 자동 정리 실행
      cleanupOldQuests();
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('설정 저장에 실패했습니다.');
    }
  }

  // ==========================================
  // 스토리지 정보
  // ==========================================

  function updateStorageInfo() {
    try {
      // localStorage 사용량 계산
      var totalSize = 0;
      for (var key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }

      // MB로 변환
      var usedMB = (totalSize / (1024 * 1024)).toFixed(2);
      var limitMB = 5; // 대부분의 브라우저는 5-10MB
      var percentage = Math.min((usedMB / limitMB) * 100, 100);

      // UI 업데이트
      document.getElementById('storage-used').textContent = usedMB;
      document.getElementById('storage-limit').textContent = limitMB;
      document.getElementById('storage-bar').style.width = percentage + '%';

      // 퀘스트 정보
      var quests = JSON.parse(localStorage.getItem('quests') || '[]');
      var completedQuests = quests.filter(function(q) { return q.completed; });
      var imageCount = completedQuests.filter(function(q) { return q.image; }).length;

      document.getElementById('completed-count').textContent = completedQuests.length;
      document.getElementById('image-count').textContent = imageCount;

      // 용량 경고
      if (percentage > 80) {
        document.getElementById('storage-bar').style.background = 'var(--danger-color)';
      } else if (percentage > 60) {
        document.getElementById('storage-bar').style.background = 'var(--warning-color)';
      }
    } catch (error) {
      console.error('Failed to update storage info:', error);
    }
  }

  // ==========================================
  // 이미지 개수 제한 및 자동 정리
  // ==========================================

  function cleanupOldQuests() {
    try {
      var maxImages = parseInt(localStorage.getItem('maxImages') || DEFAULT_MAX_IMAGES, 10);
      var quests = JSON.parse(localStorage.getItem('quests') || '[]');

      // 완료된 퀘스트 중 이미지가 있는 것만 필터링
      var completedWithImages = quests.filter(function(q) {
        return q.completed && q.image;
      });

      // 완료 날짜 최신순으로 정렬
      completedWithImages.sort(function(a, b) {
        return new Date(b.completedAt) - new Date(a.completedAt);
      });

      // 제한 초과 시 오래된 것부터 삭제
      if (completedWithImages.length > maxImages) {
        var toDelete = completedWithImages.slice(maxImages);
        var deleteIds = toDelete.map(function(q) { return q.id; });

        // 삭제할 ID 목록으로 필터링
        var filteredQuests = quests.filter(function(q) {
          return deleteIds.indexOf(q.id) === -1;
        });

        localStorage.setItem('quests', JSON.stringify(filteredQuests));

        showToast(toDelete.length + '개의 오래된 퀘스트가 삭제되었습니다.');
        updateStorageInfo();
      }
    } catch (error) {
      console.error('Failed to cleanup old quests:', error);
    }
  }

  // ==========================================
  // 데이터 내보내기/가져오기
  // ==========================================

  function exportData() {
    try {
      var quests = localStorage.getItem('quests') || '[]';
      var maxImages = localStorage.getItem('maxImages') || DEFAULT_MAX_IMAGES;

      var data = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        settings: {
          maxImages: maxImages
        },
        quests: JSON.parse(quests)
      };

      var dataStr = JSON.stringify(data, null, 2);
      var blob = new Blob([dataStr], { type: 'application/json' });
      var url = URL.createObjectURL(blob);

      var a = document.createElement('a');
      a.href = url;
      a.download = 'done-backup-' + new Date().toISOString().split('T')[0] + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('데이터를 내보냈습니다.');
    } catch (error) {
      console.error('Failed to export data:', error);
      showToast('데이터 내보내기에 실패했습니다.');
    }
  }

  function importData() {
    var fileInput = document.getElementById('import-file');
    fileInput.click();
  }

  function handleImportFile(event) {
    var file = event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);

        if (!data.quests || !Array.isArray(data.quests)) {
          showToast('잘못된 데이터 형식입니다.');
          return;
        }

        if (confirm('기존 데이터를 모두 덮어씁니다. 계속하시겠습니까?')) {
          localStorage.setItem('quests', JSON.stringify(data.quests));

          if (data.settings && data.settings.maxImages) {
            localStorage.setItem('maxImages', data.settings.maxImages);
          }

          loadSettings();
          updateStorageInfo();
          showToast('데이터를 가져왔습니다.');
        }
      } catch (error) {
        console.error('Failed to import data:', error);
        showToast('데이터 가져오기에 실패했습니다.');
      }
    };
    reader.readAsText(file);

    // 파일 입력 초기화
    event.target.value = '';
  }

  // ==========================================
  // 데이터 삭제
  // ==========================================

  function deleteAllData() {
    if (confirm('모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      if (confirm('정말로 삭제하시겠습니까?')) {
        try {
          localStorage.removeItem('quests');
          updateStorageInfo();
          showToast('모든 데이터가 삭제되었습니다.');
        } catch (error) {
          console.error('Failed to delete data:', error);
          showToast('데이터 삭제에 실패했습니다.');
        }
      }
    }
  }

  // ==========================================
  // 토스트 알림
  // ==========================================

  function showToast(message) {
    var toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(function() {
      toast.classList.remove('show');
    }, 3000);
  }

  // ==========================================
  // 이벤트 리스너
  // ==========================================

  function initEventListeners() {
    // 설정 저장
    var saveBtn = document.getElementById('save-max-images');
    if (saveBtn) {
      saveBtn.addEventListener('click', saveSettings, false);
    }

    // 데이터 내보내기
    var exportBtn = document.getElementById('export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', exportData, false);
    }

    // 데이터 가져오기
    var importBtn = document.getElementById('import-data');
    if (importBtn) {
      importBtn.addEventListener('click', importData, false);
    }

    var importFile = document.getElementById('import-file');
    if (importFile) {
      importFile.addEventListener('change', handleImportFile, false);
    }

    // 데이터 삭제
    var deleteBtn = document.getElementById('delete-all-data');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', deleteAllData, false);
    }

    console.log('✅ Event listeners initialized');
  }

})();
