/* global deferredPrompt, componentHandler,  caches */

var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player');
var canvasElement = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-btn');
var imagePicker = document.querySelector('#image-picker');
var imagePickerArea = document.querySelector('#pick-image');
var picture ;

function initializeMedia(){
  if(!('mediaDevices' in navigator) ){
    navigator.mediaDevices = {};
  }
  if(!('getUserMedia' in navigator.mediaDevices) ){
    navigator.mediaDevices.getUserMedia = function(constraints){
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if(!getUserMedia){
        return Promise.reject(new Error('getUserMedia is not impemented!'));
      }

      return new Promise (function(resolve, reject){
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }

  navigator.mediaDevices.getUserMedia({video: true }) // ,audio: true
    .then(function(stream){ // com acesso
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = 'block';
    })
    .catch(function(err){ //erro ou sem permissão de acesso a camera
      imagePickerArea.style.display = 'block';
    });
}

// capturar a imagem
captureButton.addEventListener ('click',function(event){
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';
  var context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));  
  videoPlayer.srcObject.getVideoTracks().forEach(function(track){
    track.stop();
  });  
  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change',function(event){
  picture = event.target.files[0];
});

function openCreatePostModal() {
  //createPostArea.style.display = 'block';
  //setTimeout(function(){
    createPostArea.style.transform = 'translateY(0)';
    initializeMedia();
  //},1)
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function(choiceResult) {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }
  //Código para desregistrar um serviceWorker - quando necessário
  /*if ('serviceWorker' in navigator) {
     navigator.serviceWorker.getRegistrations()
     .then(function(registrations){
        for (var i = 0; i < registrations.length; i++) {
           registrations[i].unregister();
        }
     })
  }*/
}

function closeCreatePostModal() {
  
  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';
  if (videoPlayer.srcObject){
    videoPlayer.srcObject.getVideoTracks().forEach(function(track){
      track.stop();
    });
  }
  setTimeout(function(){
    createPostArea.style.transform = 'translateY(100vh)';
  }, 2);
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

//não em uso - permite por em cache algo sobre demanda
/*function onSaveButtonClicked(event){
    console.log('clicked');
    if('caches'in window){
       caches.open('user-requested')
         .then(function(cache){
             cache.add('https://httpbin.org/get');
             cache.add('/src/images/sf-boat.jpg');
       });
    }

}*/


function clearCards(){
  while (sharedMomentsArea.hasChildNodes()){
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = 'url(' + data.image +')';
  cardTitle.style.backgroundSize = 'cover';
  //cardTitle.style.backgroundPosition = 'bottom'; // Or try 'center'
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = 'white';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  /*/var cardSaveButton = document.createElement('button');
  cardSupportingText.appendChild(cardSaveButton);
  cardSaveButton.textContent = 'Salvar';
  cardSaveButton.addEventListener('click',onSaveButtonClicked);*/
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data){
   clearCards();   
   for (var i = 0; i < data.length; i++) {    
      createCard(data[i]);
   }
}

var url = 'https://radiopeaoweb-3a66c.firebaseio.com/posts.json';// .json - é necessário para usar nas funções - é uma solicitação do firebase para se conectar a API CORRETA
var networkDataReceived = false;

fetch(url)
  .then(function(res) {
    return res.json();
  })
  .then(function(data) {
    networkDataReceived = true;
    
   /* //ordenando o array
    var postOrdenado = data;
    
    for (var i = 0; i < data.length; i++) { 
      for (var j=data.length; j<1; j--){
        if (parseInt(postOrdenado.id[i-1]) < parseInt(postOrdenado.id[i])){
          var temp = postOrdenado[i-1];
          postOrdenado[i-1] = postOrdenado[i]
          postOrdenado[i] = temp;
          console.log('ordenando posts',postOrdenado.id);
          }   
      }
    }*/

    console.log('From web',data);
    //convert data em um array
    var dataArray = [];    
    for (var key in data){
      dataArray.push(data[key]);           
    }   
    updateUI(dataArray);
  });



if('indexedDB'in window){
   readAllData('posts')
   .then(function(data){
      if (!networkDataReceived) {
         console.log('From cache',data);
         updateUI(data);
      }
   });
}


//função para resgatar do cache se não houver internet e fazer update no cache caso o que receba da internet seja diferente
/*if('caches'in window){
   caches.match(url)
   .then(function(response){
     if(response){
       return response.json();
     }
   })
   .then(function(data){
     console.log('From cache',data);
     if (!networkDataReceived){
       //
       var dataArray = [];
       for (var key in data){
         dataArray.push(data[key]);
      }
       updateUI(dataArray);
     }
  });*/


// esta função será executada se o browser não suportar SyncManager ou SW
  function sendData()  {
    var id =  new Date().toISOString();
    var postData = new FormData();
    postData.append('id', id);
    postData.append('title', titleInput.value);
    postData.append('location', locationInput.value);
    postData.append('file', picture, id + '.png');

     fetch('https://us-central1-radiopeaoweb-3a66c.cloudfunctions.net/storePostData',{ // fetch request necessita de dois argumentos, um a URL e outro o método POST OU GET
        method: 'POST',
        /*headers:{           
           'Content-Type':'application/json',
           'Accept':'application/json'
        },*/
        body: postData
        
        /*JSON.stringify({
           id: new Date().toISOString(),
           title: titleInput.value,
           location: locationInput.value,
           image: 'https://firebasestorage.googleapis.com/v0/b/radiopeaoweb-3a66c.appspot.com/o/sf-boat.jpg?alt=media&token=8628d659-caca-40b8-9de4-039cc2c214da'
        })*/
     })
     .then(function(res){
        console.log('Send data',res);
        updateUI();
     })
 }


  form.addEventListener('submit',function(event){
     event.preventDefault();
     if (titleInput.value.trim()===''||locationInput.value.trim()===''){
        alert('Por favor, preencha com dados válidos');
        return;
     }

     closeCreatePostModal();
     if ('serviceWorker' in navigator && 'SyncManager' in window){//verifica se o browser suporta a syncronização, se não suporta usa a função sendData
        navigator.serviceWorker.ready
        .then (function(sw){
           var post = { // variável com os dados que serão armazenados no indexedDB
             id: new Date().toISOString(), // usou o método Date() para criar um id ÚNICO
             title: titleInput.value,
             location: locationInput.value,
             picture: picture
          };
          writeData('sync-posts',post) //vem do utility.js que cria o objeto dbPromise 'sync-posts' para ser utilizado.
          .then(function(){
             return sw.sync.register('sync-new-posts');//nome do que será syncronizado no indexedDB/ registrado com o serviceWorker
          })
          .then(function(){ //mostra ao usuário o que está acontecendo direto na tela utilizando Material Design Components
             var snackbarContainer = document.querySelector('#confirmation-toast');
             var data = {message: 'Seu post está sendo sincronizado'};
             snackbarContainer.MaterialSnackbar.showSnackbar(data);
          })
         .catch(function(err){
            console.log(err);
         });

        });
     }else {
        sendData();
     }

 });
