    // Based off of https://github.com/pwa-builder/PWABuilder/blob/main/docs/sw.js

    /*
      Welcome to our basic Service Worker! This Service Worker offers a basic offline experience
      while also being easily customizeable. You can add in your own code to implement the capabilities
      listed below, or change anything else you would like.


      Need an introduction to Service Workers? Check our docs here: https://docs.pwabuilder.com/#/home/sw-intro
      Want to learn more about how our Service Worker generation works? Check our docs here: https://docs.pwabuilder.com/#/studio/existing-app?id=add-a-service-worker

      Did you know that Service Workers offer many more capabilities than just offline? 
        - Background Sync: https://microsoft.github.io/win-student-devs/#/30DaysOfPWA/advanced-capabilities/06
        - Periodic Background Sync: https://web.dev/periodic-background-sync/
        - Push Notifications: https://microsoft.github.io/win-student-devs/#/30DaysOfPWA/advanced-capabilities/07?id=push-notifications-on-the-web
        - Badges: https://microsoft.github.io/win-student-devs/#/30DaysOfPWA/advanced-capabilities/07?id=application-badges
    */

    const HOSTNAME_WHITELIST = [
        self.location.hostname,
        'fonts.gstatic.com',
        'fonts.googleapis.com',
        'cdn.jsdelivr.net'
    ]

    // The Util Function to hack URLs of intercepted requests
    const getFixedUrl = (req) => {
        var now = Date.now()
        var url = new URL(req.url)

        // 1. fixed http URL
        // Just keep syncing with location.protocol
        // fetch(httpURL) belongs to active mixed content.
        // And fetch(httpRequest) is not supported yet.
        url.protocol = self.location.protocol

        // 2. add query for caching-busting.
        // Github Pages served with Cache-Control: max-age=600
        // max-age on mutable content is error-prone, with SW life of bugs can even extend.
        // Until cache mode of Fetch API landed, we have to workaround cache-busting with query string.
        // Cache-Control-Bug: https://bugs.chromium.org/p/chromium/issues/detail?id=453190
        if (url.hostname === self.location.hostname) {
            url.search += (url.search ? '&' : '?') + 'cache-bust=' + now
        }
        return url.href
    }

    /**
     *  @Lifecycle Activate
     *  New one activated when old isnt being used.
     *
     *  waitUntil(): activating ====> activated
     */
    self.addEventListener('activate', event => {
      event.waitUntil(self.clients.claim())
    })

    /**
     *  @Functional Fetch
     *  All network requests are being intercepted here.
     *
     *  void respondWith(Promise<Response> r)
     */
    self.addEventListener('fetch', event => {
    // Skip some of cross-origin requests, like those for Google Analytics.
    if (HOSTNAME_WHITELIST.indexOf(new URL(event.request.url).hostname) > -1) {
        event.respondWith(
            caches.match(event.request)
                .then(cachedResponse => {
                    // 如果缓存中有响应,直接返回
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // 否则发起网络请求
                    return fetch(event.request)
                        .then(response => {
                            // 检查是否为有效响应
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }

                            // 克隆响应,因为响应流只能使用一次
                            const responseToCache = response.clone();

                            caches.open('pwa-cache')
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });

                            return response;
                        })
                        .catch(() => {
                            return caches.match('/shu-maomeng/offline.html');
                        });
                })
        );
    }
    })

    self.addEventListener('install', event => {
      event.waitUntil(
        caches.open('pwa-cache').then(cache => {
          return cache.addAll([
            '/shu-maomeng/',
            '/shu-maomeng/offline.html',
            '/shu-maomeng/assets/css/main.css',
            '/shu-maomeng/assets/js/main.js',
            '/shu-maomeng/assets/img/favicons/android-chrome-192x192.png',
            '/shu-maomeng/assets/img/favicons/android-chrome-512x512.png',
            // 添加其他重要资源...
          ]);
        })
      );
    })
