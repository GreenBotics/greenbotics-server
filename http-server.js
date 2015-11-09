//let fs   = require('fs')
//let path = require('path')

import http from 'http'
import fs from 'fs'
import path from 'path'
//minimal web server


export default function makeHttpServer (port=3001){
  let app  = http.createServer(handler)
  app.listen(port)

  return app 
}

function handler (request, response) {
  let filePath = './' + request.url
  //console.log("filePath0",filePath)
  if (filePath == './/'){
    filePath = '../../index.html'
  }

  let extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
      case '.js':
          contentType = 'text/javascript'
          break
      case '.css':
          contentType = 'text/css'
          break
      case '.json':
          contentType = 'application/json'
          break
      case '.png':
          contentType = 'image/png'
          break     
      case '.jpg':
          contentType = 'image/jpg'
          break
      case '.wav':
          contentType = 'audio/wav'
          break
  }

  fs.readFile(filePath, function(error, content) {
    //console.log("filePath",filePath)
      if (error) {
          if(error.code == 'ENOENT'){
              fs.readFile('./404.html', function(error, content) {
                  response.writeHead(200, { 'Content-Type': contentType })
                  response.end(content, 'utf-8')
              });
          }
          else {
              response.writeHead(500)
              response.end('Sorry, check with the site admin for error: '+error.code+' ..\n')
              response.end()
          }
      }
      else {
          response.writeHead(200, { 'Content-Type': contentType })
          response.end(content, 'utf-8')
      }
  })


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