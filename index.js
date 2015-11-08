/*var CronJob = require('cron').CronJob
new CronJob('* * * * * *', function() {
  console.log('You will see this message every second')
}, null, true, 'America/Los_Angeles')*/

var Rx = require("rx")
var most = require("most")

var app = require('http').createServer(handler)
var io = require('socket.io')(app)
var fs = require('fs')
var path = require('path')


import assign from 'fast.js/object/assign'//faster object.assign

import {get} from './utils'

const fromEvent = most.fromEvent

//minimal web server
app.listen(3001);

function handler (request, response) {
  var filePath = './' + request.url
  //console.log("filePath0",filePath)
  if (filePath == './/'){
    filePath = '../../index.html'
  }

  var extname = path.extname(filePath);
  var contentType = 'text/html';
  switch (extname) {
      case '.js':
          contentType = 'text/javascript';
          break;
      case '.css':
          contentType = 'text/css';
          break;
      case '.json':
          contentType = 'application/json';
          break;
      case '.png':
          contentType = 'image/png';
          break;      
      case '.jpg':
          contentType = 'image/jpg';
          break;
      case '.wav':
          contentType = 'audio/wav';
          break;
  }

  fs.readFile(filePath, function(error, content) {
    //console.log("filePath",filePath)
      if (error) {
          if(error.code == 'ENOENT'){
              fs.readFile('./404.html', function(error, content) {
                  response.writeHead(200, { 'Content-Type': contentType });
                  response.end(content, 'utf-8');
              });
          }
          else {
              response.writeHead(500);
              response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
              response.end(); 
          }
      }
      else {
          response.writeHead(200, { 'Content-Type': contentType });
          response.end(content, 'utf-8');
      }
  });


  /*fs.readFile( path.resolve(__dirname ,'../../index.html'),
  function (err, data) {
    if (err) {
      console.log("err",err)
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });*/
}


//////////////
function Subject( initial = null ) {
  let _add
  let _end
  let _error

  const stream = most.create( ( add, end, error ) => {
    _add = add
    _end = end
    _error = error
    return _error
  });

  stream.push = v => setImmediate( () => {
    return typeof _add === `function` ? _add( v ) : void 0;
  });

  stream.end = () => setImmediate( () => {
    return typeof _end === `function` ? _end() : void 0;
  });

  stream.error = e => setImmediate( () => {
    return typeof _error === `function` ? _error( e ) : void 0;
  });

  stream.plug = value$ => {
    let subject = Subject();
    value$.forEach( subject.push );
    subject.forEach( stream.push );
    return subject.end;
  };

  if ( initial !== null ) {
    stream.push( initial )
  }

  return stream
}


function fromNodeCallBack(fn){

}



let Datastore = require('tingodb')().Db

let dbPath = './dbTest'
let db = new Datastore(dbPath, {})

// Fetch a collection to insert document into
let collection = db.collection("node1SensorData")

// Insert a single document
/*collection.insert([{hello:'world_safe1'}
  , {hello:'world_safe2'}], {w:1}, function(err, result) {

  // Fetch the document
  collection.findOne({hello:'world_safe2'}, function(err, item) {
    console.log("found item",item.hello)
  })
})*/

/*let insert = Rx.Observable.fromNodeCallback(collection.insert)
let inserted$ = insert([{foo:"bar"}])
  .subscribe(e=>console.log("inserted doc"))*/

const nodes$ = just([
  {id:0,name:"Weather station",uri:"http://192.168.1.20:3020"}
  ,{id:1,name:"indoor station",uri:"http://192.168.1.21:3020"}
])


let data$ = Rx.Observable.interval(6000)//60000)
  .flatMap(function(){
    return get({
      url:"http://192.168.1.20:3020"
      ,responseType:"json"
      ,crossDomain:true
      ,credentials:false
    })
  })
  .retry(10)
  .pluck("response")
  .pluck("variables")
  .shareReplay(1)



function formatData(data){
  const timestamp = Math.floor(new Date() / 1000)
  return assign({},data,{timestamp})
}

function logData(data){
  collection.insert(data,function(err,result){
    console.log("saved data")//,data,err,result)
  })
}

data$
  //.do(e=>console.log("recieved",e))
  .map(formatData)
  .forEach(logData)

/*get({url:"http://192.168.1.20:3020",responseType:"json"})
  .forEach(e=>console.log("recieved",e))*/

//socket.io part 
let connection$ = fromEvent(  'connection',io.sockets )
connection$.forEach(socket=>console.log("connection to socket"))

let someEvent$ = connection$.flatMap(socket=>fromEvent('someEvent',socket))
someEvent$.forEach(e=>console.log("someEvent event",e))

let socketIn$ = connection$ 
//connection$.subscribe(e=>socket$.onNext(e))

//let socketOut$ = new Rx.Subject()
connection$.forEach(socket=>socket.emit("bla"))


