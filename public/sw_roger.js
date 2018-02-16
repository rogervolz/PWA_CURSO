/* global caches, self, fetch */

importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

var CACHE_STATIC_NAME = 'static-v49';
var CACHE_DYNAMIC_NAME = 'dynamic-v12';

//var CACHE_MAX_ITEMS = 12 ;

var STATIC_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/js/app.js',
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



// função para limpar o cache e não sobrecarregar
/*function trimCache(cacheName, maxItems){
   caches.open(cacheName)
   .then(function(cache)   {
      return cache.keys()
      .then(function(keys){
         if (keys.length > maxItems){
            cache.delete(keys[0])
            .then(trimCache(cacheName,maxItems));
         }
      });
   })

}*/

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
     caches.open(CACHE_STATIC_NAME) //cache name pode ser qualquer um
     .then(function(cache){
         console.log('[Service worker] Precaching App Shell');

         cache.addAll(STATIC_FILES);
       })
     );
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activating Service Worker ....', event);
  event.waitUntil(
    caches.keys()
      .then(function(keyList) {
        return Promise.all(keyList.map(function(key) {
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


//indexedDB acessado via dbpromise
self.addEventListener('fetch', function(event) {

  var url = 'https://radiopeaoweb-3a66c.firebaseio.com/.json';
  if (event.request.url.indexOf(url)>-1) {
    event.respondWith(fetch(event.request)
      .then(function(res){ // intercepta qualquer fetch request feita pelo front end
         var clonedRes = res.clone();
         clearAllData('posts') //limpa todos os dados do indexedDb antes de adicionar novos dados. (previne que um nó apagado continue no cache)
            .then(function(){
               return clonedRes.json();
            })
            .then(function(data){
               for (var key in data){
                 writeData('posts',data[key])
              }
            });
         return res;
      })
    );
  }else if (isInArray(event.request.url, STATIC_FILES)){
      event.respondWith(
      caches.match(event.request)
    );
  } else {
    event.respondWith(
      caches.match(event.request)
      .then(function(response){
        if (response) {
          return response;

        }else {
          return fetch(event.request)
          .then(function(res){
            return caches.open(CACHE_DYNAMIC_NAME)
              .then (function(cache){
                 //trimCache(CACHE_DYNAMIC_NAME,CACHE_MAX_ITEMS);//LIMPAR O CACHE PARA TER POUCOS ARQUIVOS
                cache.put(event.request.url,res.clone());
                return res;
              })
          })
          .catch(function(err){
            return caches.open(CACHE_STATIC_NAME)
              .then(function(cache){
                if (event.request.headers.get('accept').includes('text/html')) {
                  //aqui pode retornar o que quiser quando o
                  //request não estiver em cache. Pode retornar uma página ou imagem para um
                  //carregamento que falhou. Não somente a página offline.html. Precisa carregar no
                  //STATIC_FILES primeiro, depois retornará facilmente
                  return cache.match('/offline.html');
                }

              });
          });
        }
      })
    );
  }
});

//cache dynamic
/*self.addEventListener('fetch', function(event) {
  event.respondWith(
     fetch(event.request)
     .then(function(res){
       return caches.open(CACHE_DYNAMIC_NAME)
        .then(function(cache){
          cache.put(event.request.url,res.clone());
          return res;
        })

     })
     .catch(function(err){
        return caches.match(event.request)
      })
    );
  });*/


//cache only
/*self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)

  );
});*/

/*self.addEventListener('fetch', function(event) {
  event.respondWith(
    fetch(event.request)

  );
});*/

self.addEventListener('sync',function(event){ // será executada quando o serviceWorker estiver reconectado ou se sempre esteve conectado. Já dá pra saber que tem internet quando isto executada
   console.log ('[serviceWorker] background syncing', event);
   if (event.tag === 'sync-new-posts') {// para saber qual o tipo de evento foi sincronizado
      console.log('[serviceWorker] Syncing new Posts');
      event.waitUntil(
         readAllData('sync-posts')
         .then(function(data){
            for (var dt of data){
               fetch('https://us-central1-radiopeaoweb-3a66c.cloudfunctions.net/storePostData',{ // fetch request necessita de dois argumentos, um a URL e outro o método POST OU GET
                 method: 'POST',
                 headers:{
                    'Content-Type':'application/json',
                    'Accept':'application/json'
                 },
                 body: JSON.stringify({
                    id: dt.id,
                    title: dt.title,
                    location: dt.location,
                    image:'https://firebasestorage.googleapis.com/v0/b/radiopeaoweb-3a66c.appspot.com/o/sf-boat.jpg?alt=media&token=8628d659-caca-40b8-9de4-039cc2c214da'
                 })
              })//fim fetch
              .then(function(res){
                 console.log('Sent data',res);
                 if (res.ok) {
                  res.json()
                    .then(function(resData) {
                      deleteItemFromData('sync-posts', resData.id);
                    });
                }
              })
              .catch (function(err){
                 console.log('Error while sending data',err);
              });

           }//fim for
         })
      );
   }

});
