const CACHE_NAME =
  'ammo-hunting-app-v1';

const APP_FILES = [
  './',
  './index.html'
];


// アプリをスマホに保存
self.addEventListener(
  'install',
  event => {

    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(cache => {
          return cache.addAll(
            APP_FILES
          );
        })
    );

    self.skipWaiting();

  }
);


// 新しいService Workerを有効化
self.addEventListener(
  'activate',
  event => {

    event.waitUntil(
      self.clients.claim()
    );

  }
);


// 通信できない場合は
// スマホに保存した画面を使用
self.addEventListener(
  'fetch',
  event => {

    if (
      event.request.method !==
      'GET'
    ) {
      return;
    }

    event.respondWith(

      fetch(
        event.request
      )
        .then(response => {

          const copy =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then(cache => {

              cache.put(
                event.request,
                copy
              );

            });

          return response;

        })
        .catch(() => {

          return caches
            .match(
              event.request
            )
            .then(response => {

              return (
                response ||
                caches.match(
                  './index.html'
                )
              );

            });

        })

    );

  }
);
