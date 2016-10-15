// var io = require('socket.io')(app)
import sio from 'socket.io'
import most from 'most'
const fromEvent = most.fromEvent

export default function makeSocketIoServer (app) {
  let io = sio(app)
  // ///////////////
  // socket.io part
  let connection$ = fromEvent('connection', io.sockets)
  connection$.forEach(socket => console.log('connection to socket'))

  let someEvent$ = connection$.flatMap(socket => fromEvent('someEvent', socket))
  someEvent$.forEach(e => console.log('someEvent event', e))

  // let socketIn$ = connection$
  // connection$.subscribe(e=>socket$.onNext(e))
  // let socketOut$ = new Rx.Subject()
  connection$.forEach(socket => socket.emit('bla'))
}
