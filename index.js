

var Rx = require("rx")
var most = require("most")

var app = require('http').createServer(handler)
var io = require('socket.io')(app)
var fs = require('fs')
var path = require('path')

let just = Rx.Observable.just
import assign from 'fast.js/object/assign'//faster object.assign

import {get,cronJob} from './utils'

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

/*var CronJob = require('cron').CronJob
new CronJob('0 * * * * *', function() {
  console.log('You will see this message every minute')
}, null, true)*/
cronJob('0 * * * * *')
  .forEach(e=>console.log('You will see this message every minute'))


let Datastore = require('tingodb')().Db

let dbPath = './dbTest'
let db = new Datastore(dbPath, {})

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



function fetchNodeData(node){
  return Rx.Observable.interval(6000)//60000)
    .flatMap(function(){
      return get({
        url:node.uri
        ,responseType:"json"
        ,crossDomain:true
        ,credentials:false
      })
    })
    .retry(10)
    .pluck("response")
    .pluck("variables")
    .shareReplay(1)
}

function formatData(data){
  const timestamp = Math.floor(new Date() / 1000)
  return assign({},data,{timestamp})
}

function addNodeData(nodeData,data){
  return assign({},data,nodeData)
}

function logData(collection,data){
  //console.log("logging",data)
  collection.insert(data,function(err,result){
    console.log("saved data",err,result)//,data,err,result)
  })
}

const nodes = [
  {id:0,name:"Weather station",uri:"http://192.168.1.20:3020"}
  ,{id:1,name:"indoor station",uri:"http://192.168.1.21:3020"}
]


nodes
  .forEach(function(node){
    const nodeData   = {nodeId:node.id}
    const collection = db.collection(`node${node.id}SensorData`)

    fetchNodeData(node)
      .map(addNodeData.bind(null,nodeData))
      .map(formatData)
      .forEach(logData.bind(null,collection))
  })

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


