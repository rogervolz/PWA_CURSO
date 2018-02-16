

var dbPromise = idb.open('posts-store', 1, function(db){
   if(!db.objectStoreNames.contains('posts')){
      db.createObjectStore('posts',{keyPath: 'id'}); //criado o objeto 'posts' para caching
   }
   if(!db.objectStoreNames.contains('sync-posts')){
      db.createObjectStore('sync-posts',{keyPath: 'id'}); //criado o objeto 'posts' para caching
   }
});

function writeData(st,data){
   return dbPromise //armazena os dados na memória para serem resgatados
   .then(function(db){
      var tx = db.transaction(st,'readwrite');
      var store = tx.objectStore(st);
      store.put(data);
      return tx.complete;//garante a integradade do database
   });
}

function readAllData(st){
   return dbPromise
   .then(function(db){
      var tx = db.transaction(st,'readonly');
      var store = tx.objectStore(st);
      return store.getAll();
   });
}

function clearAllData (st){
   return dbPromise
   .then (function(db){
      var tx = db.transaction(st,'readwrite');
      var store = tx.objectStore(st);
      store.clear();
      return tx.complete;//garante a integradade do database
   })
}

function deleteItemFromData(st, id){
   return dbPromise
   .then(function(db){
      var tx = db.transaction(st,'readwrite');
      var store = tx.objectStore(st);
      store.delete(id);
      return tx.complete; //garante a integradade do database
   })
   .then(function(){
      console.log('Item deleted!');
   });
}

//USAR ABAIXO onde quiser deletar uma entrada do banco de dados
/*.then(function(){
   deleteDataFromData('posts',key);
});*/

function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
  
    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], {type: mimeString});
    return blob;
  }