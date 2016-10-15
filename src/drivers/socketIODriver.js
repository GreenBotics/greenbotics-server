import sio from 'socket.io'
import Rx from 'rx'
const fromEvent = Rx.Observable.fromEvent

//this is a "server driver"
export default function makeSocketIODriver (app){
  let io = sio(app)

  function SocketIODriver(outgoing$){
    let connections$ = fromEvent(  io.sockets, 'connection' )
    connections$.forEach(socket=>console.log("connection made to socket by",socket.id))

    /*Object.keys(sockets).forEach(function (id) {
 +      var socket = sockets[id]*/

    function publish({socket, messageType, message}) {
      //console.log("publish to",socket.id,messageType,message)
      socket.emit(messageType, message)
      socket.on('error', function(error) {
        console.log("error in socket",error)
      })
    }

    function get(eventName){
      return connections$
        .flatMap(socket=>fromEvent(socket, eventName))
    }

    outgoing$
      .withLatestFrom(connections$,function(outgoing,socket){
        const {messageType,message} = outgoing
        return {socket, messageType, message}
      })
      .forEach(publish)

    return {
      get
    }
  }

  return SocketIODriver
}
