const CACHE_NAME =
  'ammo-hunting-app-v5';

const APP_FILES = [
  './',
  './index.html'
];


// =================================
// インストール
// =================================

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


// =================================
// 有効化
// 古いキャッシュを削除
// =================================

self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(keys => {

          return Promise.all(

            keys.map(key => {

              if (
                key !== CACHE_NAME
              ) {

                return caches.delete(
                  key
                );

              }

            })

          );

        })
        .then(() => {

          return self.clients.claim();

        })

    );

  }
);


// =================================
// 通信処理
// =================================

self.addEventListener(
  'fetch',
  event => {

    if (
      event.request.method !==
      'GET'
    ) {
      return;
    }


    // =================================
    // GAS APIはService Workerで
    // キャッシュしない
    // =================================

    if (
      event.request.url.includes(
        'ammo-gas-api.kikorinmura.workers.dev'
      )
    ) {
      return;
    }


    // =================================
    // index.html / アプリ起動
    //
    // キャッシュを即表示しながら
    // 裏で最新版へ更新
    // =================================

    event.respondWith(

      caches
        .match(
          event.request
        )
        .then(cachedResponse => {

          const networkFetch =
            fetch(
              event.request,
              {
                cache: 'no-store'
              }
            )
              .then(response => {

                if (
                  response &&
                  response.ok
                ) {

                  const copy =
                    response.clone();

                  event.waitUntil(

                    caches
                      .open(CACHE_NAME)
                      .then(cache => {

                        return cache.put(
                          event.request,
                          copy
                        );

                      })

                  );

                }

                return response;

              })
              .catch(() => {

                return null;

              });


          // キャッシュがあれば
          // 即座にアプリを表示
          if (cachedResponse) {

            return cachedResponse;

          }


          // 初回だけネットワークから取得
          return networkFetch
            .then(response => {

              if (response) {

                return response;

              }


              return caches.match(
                './index.html'
              );

            });

        })

    );

  }
);
