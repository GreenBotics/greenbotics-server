import sio from 'socket.io'
import Rx from 'rx'
const fromEvent = Rx.Observable.fromEvent


export default function makeSocketIODriver (app){
  let io = sio(app)

  function SocketIODriver(){
    let connection$ = fromEvent(  io.sockets, 'connection' )
    connection$.forEach(socket=>console.log("connection made to socket"))

    /*let someEvent$ = connection$
      .flatMap(socket=>fromEvent('someEvent',socket))

    someEvent$
      .forEach(e=>console.log("someEvent event",e))*/

    //let socketIn$ = connection$ 
    //connection$.subscribe(e=>socket$.onNext(e))
    //let socketOut$ = new Rx.Subject()
    connection$.forEach(socket=>socket.emit("bla"))

    function get(eventName){
      return connection$
        .flatMap(socket=>fromEvent(socket, eventName))
    }

    return {
      get
    }
  }

  return SocketIODriver
}