


/*var CronJob = require('cron').CronJob
new CronJob('* * * * * *', function() {
  console.log('You will see this message every second')
}, null, true, 'America/Los_Angeles')*/



var app = require('http').createServer(handler)
var io = require('socket.io')(app)
var fs = require('fs')
var path = require('path')



app.listen(3001);

function handler (request, response) {
  var filePath = './' + request.url
  //console.log("filePath0",filePath)
  if (filePath == './/'){
    console.log("FART")
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


var Rx = require("rx")


let connection$ = Rx.Observable.fromEvent( io.sockets, 'connection' )
connection$.subscribe(socket=>console.log("connection to socket"))

let someEvent$ = connection$.flatMap(socket=>Rx.Observable.fromEvent(socket, 'someEvent'))
someEvent$.subscribe(e=>console.log("someEvent event",e))

let socketIn$ = connection$ 
//connection$.subscribe(e=>socket$.onNext(e))

socketOut$ = new Rx.Subject()

connection$.subscribe(socket=>socket.emit("bla"))


//standard socket.io
/*io.on('connection', function (socket) {
  console.log("connection")
  socket.emit('news', { hello: 'world' });
  socket.on('someEvent', function (data) {
    console.log(data);
  });
});*/