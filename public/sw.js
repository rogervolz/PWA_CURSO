importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v47';
var CACHE_DYNAMIC_NAME = 'dynamic-v5';

//var CACHE_MAX_ITEMS = 12 ;

var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
  '/src/js/utility.js',
  '/src/js/feed.js',
  '/src/js/idb.js',
  '/src/js/promise.js',//este arquivo só são usados aqui no curso pois foram feitos para utilizar em old Browsers e não precisaria ser cached em browsers novos
  '/src/js/fetch.js',  //este arquivo só são usados aqui no curso pois foram feitos para utilizar em old Browsers e não precisaria ser cached em browsers novos
  '/src/js/material.min.js',
  '/src/css/app.css',
  '/src/css/feed.css',
  '/src/images/main-image.jpg',
  'https://fonts.googleapis.com/css?family=Roboto:400,700',
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.blue_grey-amber.min.css'
];

// function trimCache(cacheName, maxItems) {
//   caches.open(cacheName)
//     .then(function (cache) {
//       return cache.keys()
//         .then(function (keys) {
//           if (keys.length > maxItems) {
//             cache.delete(keys[0])
//               .then(trimCache(cacheName, maxItems));
//           }
//         });
//     })
// }

self.addEventListener('install', function (event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME)
      .then(function (cache) {
        console.log('[Service Worker] Precaching App Shell');
        cache.addAll(STATIC_FILES);
      })
  )
});

self.addEventListener('activate', function (event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
      .then(function (keyList) {
        return Promise.all(keyList.map(function (key) {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            console.log('[Service Worker] Removing old cache.', key);
            return caches.delete(key);
          }
        }));
      })
  );
  return self.clients.claim();
});

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) { // request targets domain where we serve the page from (i.e. NOT a CDN)
    console.log('matched ', string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

self.addEventListener('fetch', function (event) {

  var url = 'https://radiopeaoweb-3a66c.firebaseio.com/posts';
  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(fetch(event.request)
      .then(function (res) {
        var clonedRes = res.clone();
        clearAllData('posts')
          .then(function () {
            return clonedRes.json();
          })
          .then(function (data) {
            for (var key in data) {
              writeData('posts', data[key])
            }
          });
          //console.log('[Service Worker] Respond with - url');
        return res;
        
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(
      caches.match(event.request)
    );
    //console.log('[Service Worker] Respond with - caches match');
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(function (response) {
          if (response) {
            return response;
          } else {
            return fetch(event.request)
              .then(function (res) {
                return caches.open(CACHE_DYNAMIC_NAME)
                  .then(function (cache) {
                    // trimCache(CACHE_DYNAMIC_NAME, 3);
                    cache.put(event.request.url, res.clone());
                    return res;
                    //console.log('[Service Worker] Respond with - caches url');
                  })
              })
              .catch(function (err) {
                return caches.open(CACHE_STATIC_NAME)
                  .then(function (cache) {
                    if (event.request.headers.get('accept').includes('text/html')) {
                      //aqui pode retornar o que quiser quando o
                      //request não estiver em cache. Pode retornar uma página ou imagem para um
                      //carregamento que falhou. Não somente a página offline.html. Precisa carregar no
                      //STATIC_FILES primeiro, depois retornará facilmente
                      return cache.match('/offline.html');
                      //console.log('[Service Worker] Respond with - caches open');
                    }
                  });
              });
          }
        })
    );
  }
});

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     caches.match(event.request)
//       .then(function(response) {
//         if (response) {
//           return response;
//         } else {
//           return fetch(event.request)
//             .then(function(res) {
//               return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//             })
//             .catch(function(err) {
//               return caches.open(CACHE_STATIC_NAME)
//                 .then(function(cache) {
//                   return cache.match('/offline.html');
//                 });
//             });
//         }
//       })
//   );
// });

// self.addEventListener('fetch', function(event) {
//   event.respondWith(
//     fetch(event.request)
//       .then(function(res) {
//         return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(function(cache) {
//                   cache.put(event.request.url, res.clone());
//                   return res;
//                 })
//       })
//       .catch(function(err) {
//         return caches.match(event.request);
//       })
//   );
// });

// Cache-only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     caches.match(event.request)
//   );
// });

// Network-only
// self.addEventListener('fetch', function (event) {
//   event.respondWith(
//     fetch(event.request)
//   );
// });

self.addEventListener('sync', function(event) {
  console.log('[Service Worker] Background syncing', event);
  if (event.tag === 'sync-new-posts') {
    console.log('[Service Worker] Syncing new Posts');
    event.waitUntil(
      readAllData('sync-posts')
        .then(function(data) {
          for (var dt of data) {
            var postData = new FormData();
            postData.append('id',dt.id);
            postData.append('title',dt.title);
            postData.append('location',dt.location);
            postData.append('file',dt.picture,dt.id + '.png');

            fetch('https://us-central1-radiopeaoweb-3a66c.cloudfunctions.net/storePostData', {            
              method: 'POST',
              body: postData              
            })
              .then(function(res) {
                console.log('Sent data', res);
                if (res.ok) {
                  res.json()
                    .then(function(resData) {
                      deleteItemFromData('sync-posts', resData.id);
                    });
                }
              })
              .catch(function(err) {
                console.log('Error while sending data', err);
              });
          }

        })
    );
  }
});


//NOTIFICAÇÃO CRIADA E ABERTA PELO SISTEMA OPERACIONAL
self.addEventListener('notificationclick',function(event){
  var notification = event.notification;
  var action = event.action;

  console.log(notification);

  if (action === 'confirm') {  //confirm é o nome da action criada no app.js, botão ok
    console.log('Confirm was chosen');
    notification.close();
  }else{
    console.log(action);
    event.waitUntil(
      clients.matchAll()//acesso ao browser
      .then(function(clis){
        var client = clis.find(function(c){ //c é o elemento procurado no array
          return c.visibilityState === 'visible';
        });//clis é um array

        if (client !== undefined){
          client.navigate (notification.data.url);//property data: { url: data.openUrl } - self.addEventListener('push',
          client.focus();          
        } else{
          clients.openWindow(notification.data.url);//property data: { url: data.openUrl } - self.addEventListener('push',
        }
        notification.close();
      })
    );       
  }
}); 

//NOTIFICAÇÃO CRIADA E ABERTA PELO SISTEMA OPERACIONAL - listem para quando a notificação for fechada
self.addEventListener('notificationclose',function(event){
  console.log('Notification was closed',event);
  
}); 

self.addEventListener('push',function(event){
  console.log('Push Notification received',event);
  
  var data = {title:'New!', content:'Something new happened!', openUrl: '/'};

  //extrai os dados
  if (event.data){
    data = JSON.parse(event.data.text());
  }

    // pode usar igual a displayConfirmNotification() no app.js
  var options = {
    body: data.content, //content vem do JSON - webpush.sendNotification(pushConfig,JSON.stringify({title:'New Post',content:'New Post added!'})) - index.js
    icon:'/src/images/icons/app-icon-96x96.png',
    badge:'/src/images/icons/app-icon-96x96.png',
    data: {
      url: data.openUrl
    }
  };
  event.waitUntil(//aqui a notification está conectada ao browser
    self.registration.showNotification(data.title, options)
  );
});