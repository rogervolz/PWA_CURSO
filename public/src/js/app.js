
var deferredPrompt;
var enableNotificationsButtons = document.querySelectorAll('.enable-notifications');

if (!window.Promise) {
  window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/sw.js')
    .then(function () {
      console.log('Service worker registered!');
    })
    .catch(function(err) {
      console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', function(event) {
  console.log('beforeinstallprompt fired');
  event.preventDefault();
  deferredPrompt = event;
  return false;
});

function displayConfirmNotification(){
  if('serviceWorker' in navigator){
    var options ={
      body:'Você se inscreveu com sucesso nas notificações do Autoobras',
      icon:'/src/images/icons/app-icon-96x96.png',
      image:'/src/images/main-image.jpg',
      dir:'ltr',
      lang:'pt', //BCP 47
      vibrate:[250,50,200],
      badge:'src/images/icons/app-icon-96x96.png',
      tag: 'confirm-notification',//igual um ID para notification. A notificação com a mesma TAG sobrepõe a anterior.
      renotify: true,  //mesmo que tenha a mesma tag, irá vibrar False, não vibrará
      actions:[
        {action:'confirm',title:'Ok',icon:'/src/images/icons/app-icon-48x48.png'},
        {action:'cancel',title:'Cancel',icon:'/src/images/icons/app-icon-48x48.png'}
      ]
    }
    navigator.serviceWorker.ready
      .then(function(swreg){
        swreg.showNotification('Inscrito com Sucesso - Autoobras' , options);
      });
  } 
}

//push messages acionadas pelo service worker mesmo com o browser fechado
function configurePushSub(){ 
  if (!('serviceWorker'in navigator)){
    return;
  }

  var reg;
  navigator.serviceWorker.ready
  .then(function(swreg){
    reg=swreg;
    return swreg.pushManager.getSubscription();
  })
  .then(function(sub){
    if(sub === null) {
      //create a new subscription
      var vapidPublicKey = 'BKiX6rrhVqaLr6WDUz6PsUoFmwpx0G_DMngH9ZPjV3fTb7xdRDC6oTPixrFl8g527Gs2pc3l-7sF13CdyaolAx0';
      var convertedVapidPublicKey = urlBase64ToUint8Array (vapidPublicKey); // funão está no utility.js

      return reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidPublicKey // isto é o que permite enviar PUSH MESSAGES
    });
    }else{
      // we have a subscription
    }
  })
  .then(function(newSub){
    return fetch('https://radiopeaoweb-3a66c.firebaseio.com/subscriptions.json',{ // cria um nó no database firebase com o endereço do servidor do Chrome que enviaraá as push messages
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept':'application/json'
      },
      body: JSON.stringify(newSub)
    })
  })
  .then(function(res){
    if (res.ok){
      displayConfirmNotification ();
    }
  })
  .catch(function(err){
    console.log(err);
  });
}

/*function displayConfirmNotification(){
 
  var options ={
    body:'Você se inscreveu com sucesso nas notificações do Autoobras'
  }
  new Notification ('Succesfully sobscribed!',options) //NotificatioN API é que comanda as notificações
}*/

function askForNotificationPermission(){
  Notification.requestPermission(function(result){
    console.log('User Choice',result);
    if (result !== 'granted'){
      console.log ('No notification permission granted!');
    }else{      
      configurePushSub();
      //displayConfirmNotification();

    }
  });
}



if('Notification' in window && 'serviceWorker'in navigator){
  for (var i = 0; i < enableNotificationsButtons.length ; i++){
    enableNotificationsButtons[i].style.display = 'inline-block';
    enableNotificationsButtons[i].addEventListener('click',askForNotificationPermission );
  }
}

/*var xhr = new XMLHttpRequest();
xhr.open('GET','http://httpbin.org/ip');
xhr.responseType = 'json';

xhr.onload = function(){
    console.log (xhr.response);
};

xhr.send();*/ //solicitação AJAX não funciona em service worker e também é mais complexa de implementar. USAR FETCH

/*fetch('http://httpbin.org/ip')//get request
      .then(function(response){
            console.log(response);
    return response.json();//.json converte as informações - response (resposta) em um arquivo trabalhável
})
      .then(function(data){// data é o json criado acima
            console.log(data);
})
      .catch(function(err){
            console.log(err);
});  

fetch('http://httpbin.org/post',{ //post metodo
  method: 'POST', // or 'PUT'
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  mode: 'cors', //mode: 'no-cors' manda o JSON mas não permite acesso para leitura pelo browser
  body: JSON.stringify( {message: 'Does this work?'})
})

      .then(function(response){
            console.log(response);
    return response.json();//.json converte as informações - response (resposta) em um arquivo trabalhável
})
      .then(function(data){// data é o json criado acima
            console.log(data);
})
      .catch(function(err){
            console.log(err);
});  

var promise=new Promise(function(resolve,reject){setTimeout (function(){
    //resolve("Isto é executado quando ACABA");
    reject({code:500, message: 'An error occurred!'
        
    });
    //console.log ("Isto é executado antes do timer acabar");
    },3000);
});

promise.then(function(text){
    return text;
},function(err){
   console.log(err.code, err.message)
}).then (function(newTest){
   console.log(newText);
});

promise.then(function(text){
    return text;
}).then(function(newText){
   console.log(newText);
}).catch(function (err){
    console.log(err.code, err.message);
});

console.log("Isto é executado DEPOIS do timer acabar");*/


