var functions = require("firebase-functions");
var admin = require("firebase-admin");
var cors = require("cors")({ origin: true });
var webpush = require("web-push");
var formidable = require("formidable");
var fs = require("fs");
var UUID = require("uuid-v4");
var os = require("os");
var Busboy = require("busboy");
var path = require('path');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

var serviceAccount = require("./autoobras_firebase_key.json");
//google cloud config
var gcconfig = {   
  projectId: "radiopeaoweb-3a66c",
  keyFilename: "autoobras_firebase_key.json"
};

var gcs = require("@google-cloud/storage")(gcconfig);

//admin.initializeApp(functions.config().firebase);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://radiopeaoweb-3a66c.firebaseio.com/"
});   

 exports.storePostData = functions.https.onRequest(function(request, response) {
    cors(request, response, function() {
      var uuid = UUID();

    const busboy = new Busboy({ headers: request.headers });
    // These objects will store the values (file + fields) extracted from busboy
    let upload;
    const fields = {};

    // This callback will be invoked for each file uploaded
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      console.log(
        `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
      );
      const filepath = path.join(os.tmpdir(), filename);
      upload = { file: filepath, type: mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });

    // This will invoked on every field detected
    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
      fields[fieldname] = val;
    });

    // This callback will be invoked after all uploaded files are saved.
    busboy.on("finish", () => {
      var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
      bucket.upload(
        upload.file,
        {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: upload.type,
              firebaseStorageDownloadTokens: uuid
            }
          }
        },
        function(err, uploadedFile) {
          if (!err) {
            admin
              .database()
              .ref("posts")
              .push({
                title: fields.title,
                location: fields.location,
                rawLocation: {
                  lat: fields.rawLocationLat,
                  lng: fields.rawLocationLng
                },
                image:
                  "https://firebasestorage.googleapis.com/v0/b/" +
                  bucket.name +
                  "/o/" +
                  encodeURIComponent(uploadedFile.name) +
                  "?alt=media&token=" +
                  uuid
              })
        .then(function(){ //quando o firebase armazena um dado, começa a executar este código. Aqui é onde se coloca a request para a PUSH notification
          webpush.setVapidDetails( // WEB-PUSH - instalado via npm e node.js - conjunto de funções para executar push on server side gera a keypublic e keyprivate
            'mailto:rogervolz@gmail.com',
            'BKiX6rrhVqaLr6WDUz6PsUoFmwpx0G_DMngH9ZPjV3fTb7xdRDC6oTPixrFl8g527Gs2pc3l-7sF13CdyaolAx0',
            'PyNy6Pz7uDvF9iUUNbwUMsr34jIxhbEKEjy_sM9yyh0'
          );     
            return admin
            .database()
            .ref('subscriptions')
            .once('value');     
          })
          .then(function(subscriptions) {
            subscriptions.forEach(function(sub) {
              var pushConfig = {
                endpoint: sub.val().endpoint,
                keys: {
                  auth: sub.val().keys.auth,
                  p256dh: sub.val().keys.p256dh
                }
              };

              webpush
                .sendNotification(
                  pushConfig,
                  JSON.stringify({
                    title: "New Post",
                    content: "New Post added!",
                    openUrl: "/help"
                  })
                )
                .catch(function(err) {
                  console.log(err);
                });
            });
            response
              .status(201)
              .json({ message: "Data stored", id: fields.id });
          })
          .catch(function(err) {
            response.status(500).json({ error: err });
          });
      } else {
        console.log(err);
      }
    }
  );
});

// The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
// a callback when it's finished.
busboy.end(request.rawBody);
// formData.parse(request, function(err, fields, files) {
//   fs.rename(files.file.path, "/tmp/" + files.file.name);
//   var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
// });
});
});
    


/* exports.storePostData = functions.https.onRequest(function(request, response) {
  cors(request, response, function() {

    

   /* var uuid = UUID();
    var formData = new formidable.IncomingForm(); // formidable é o package responsável por acessar o firebase/storage
    
    formData.parse(request, function(err, fields, files){ //FIELDS
      fs.rename (files.file.path, '/tmp/' + files.file.name); // vem do nome postData.append('file' utilizado no sw.js - self.addEventListener('sync',
      var bucket = gcs.bucket('radiopeaoweb-3a66c.appspot.com');
      
      //para acessar o cloud storage - firebase storage
      bucket.upload('/tmp/' + files.file.name,{
        uploadType: 'media',
        metadata:{
          metadata:{
            contentType: files.file.type,
            firebaseStorageDownloadTokens: uuid //npm install --save uuid-v4
          }
        }
      }, function(err, file){
        if (!err){
          admin.database().ref('posts').push({   //id, title, location vem do sw.js - postData.append('file' utilizado no sw.js - self.addEventListener('sync',       
            id: fields.id,
            title: fields.title,        
            location: fields.location,
            image: 'https://firebasestorage.googleapis.com/v0/b/'+ bucket.name + '/0/' + encodeURIComponent(file.name)+'?alt=media&token=' + uuid  //método de armazenamento do firebase storage      
          })
          .then(function(){ //quando o firebase armazena um dado, começa a executar este código. Aqui é onde se coloca a request para a PUSH notification
            webpush.setVapidDetails( // WEB-PUSH - instalado via npm e node.js - conjunto de funções para executar push on server side
              'mailto:rogervolz@gmail.com',
              'BKiX6rrhVqaLr6WDUz6PsUoFmwpx0G_DMngH9ZPjV3fTb7xdRDC6oTPixrFl8g527Gs2pc3l-7sF13CdyaolAx0',
              'PyNy6Pz7uDvF9iUUNbwUMsr34jIxhbEKEjy_sM9yyh0') ;     
              return admin.database().ref('subscriptions').once('value');     
              })
              .then (function(subscriptions){
                subscriptions.forEach(function(sub){
                  var pushConfig ={
                    endpoint: sub.val().endpoint,
                    keys: {
                      auth: sub.val().keys.auth,
                      p256dh: sub.val().keys.p256dh
                    }                
                  };
                  webpush.sendNotification(pushConfig,JSON.stringify({
                    title:'New Post',
                    content:'New Post added!',
                    openUrl:'/help'
                  }))
                  .catch(function(err){
                    console.log(err);
                  })
                });
                response.status(201).json({message:'Data stored',id: fields.id});          
          })
          .catch(function(err){
             response.status(500).json({error: err});
          });
        }else{
          console.log(err);
        }
      });      
    });      
 });
});*/