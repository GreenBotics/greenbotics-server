import sio from 'socket.io'
import Rx from 'rx'
const fromEvent = Rx.Observable.fromEvent

//this is a "server driver"
export default function makeSocketIODriver (app){
  let io = sio(app)

  function SocketIODriver(outgoing$){
    let connections$ = fromEvent(  io.sockets, 'connection' )
    connections$.forEach(socket=>console.log("connection made to socket by",socket.id))

    /*let someEvent$ = connection$
      .flatMap(socket=>fromEvent('someEvent',socket))

    someEvent$
      .forEach(e=>console.log("someEvent event",e))*/

    //let socketIn$ = connection$ 
    //connection$.subscribe(e=>socket$.onNext(e))
    //let socketOut$ = new Rx.Subject()
    //connection$.forEach(socket=>console.log("sockets",socket))

    function publish({socket, messageType, message}) {
      //console.log("publish to",socket.id,messageType,message)
      socket.emit(messageType, message);
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

    /*var _emit = socket.emit
    _onevent = socket.onevent


    //attempt to override to enable filtering
    socket.emit = function () { //Override outgoing
        //Do your logic here
        console.log('***', 'emit', arguments)
        _emit.apply(socket, arguments)
    };

    socket.onevent = function (packet) { //Override incoming
        var args = packet.data || []
        //Do your logic here
        console.log('***', 'onevent', packet)
        _onevent.call(socket, packet)
    }*/

    return {
      get
    }
  }

  return SocketIODriver
}