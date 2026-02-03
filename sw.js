var CACHE_NAME = 'done-app-v7';
// GitHub Pages 서브디렉토리 지원을 위한 상대 경로 사용
var basePath = self.location.pathname.replace(/\/sw\.js$/, '') || '.';
var urlsToCache = [
  basePath + '/',
  basePath + '/index.html',
  basePath + '/profile.html',
  basePath + '/admin.html',
  basePath + '/user.html',
  basePath + '/css/style.css',
  basePath + '/js/app.js',
  basePath + '/js/profile.js',
  basePath + '/js/admin.js',
  basePath + '/js/user.js',
  basePath + '/js/storage.js',
  basePath + '/manifest.json'
];

// 설치 시 캐시 저장
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 요청 시 캐시 우선, 없으면 네트워크
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }
        return fetch(event.request).then(function(response) {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          var responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});

// 새 버전 활성화 시 이전 캐시 삭제
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(cacheName) {
          return cacheName !== CACHE_NAME;
        }).map(function(cacheName) {
          return caches.delete(cacheName);
        })
      );
    })
  );
});
