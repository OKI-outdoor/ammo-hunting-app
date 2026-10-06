const CACHE_NAME =
  'ammo-hunting-app-v4';

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
    // API通信はキャッシュしない
    // =================================

    if (
      event.request.url.includes(
        'ammo-gas-api.kikorinmura.workers.dev'
      )
    ) {
      return;
    }


    // =================================
    // アプリ本体
    //
    // 1. キャッシュがあれば即表示
    // 2. 裏で最新版を取得
    // 3. 次回起動用キャッシュを更新
    // =================================

    event.respondWith(

      caches
        .match(
          event.request
        )
        .then(cachedResponse => {


          // 裏で最新版を取得
          const networkFetch =

            fetch(
              event.request
            )
              .then(response => {

                if (
                  response &&
                  response.ok
                ) {

                  const copy =
                    response.clone();

                  caches
                    .open(
                      CACHE_NAME
                    )
                    .then(cache => {

                      cache.put(
                        event.request,
                        copy
                      );

                    });

                }

                return response;

              })
              .catch(() => {

                return null;

              });


          // キャッシュがあれば
          // 待たずに即表示
          if (cachedResponse) {

            return cachedResponse;

          }


          // キャッシュがない場合だけ
          // ネットワークを待つ
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
