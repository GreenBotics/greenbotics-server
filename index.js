import Rx from 'rx'

import makeHttpServer     from './http-server'
import makeSocketIoServer from './sio-server'
import Cycle from '@cycle/core'


let httpServer = makeHttpServer()
//let sioServer  = makeSocketIoServer(httpServer)

import makeSocketIODriver from './drivers/socketIODriver'

import {get,cronJob,makeTingoDbDriver} from './utils/utils'


function main(drivers) {
  const {socketIO} = drivers
  
  //const actions = intent(drivers)
  //const state$  = model(undefined, actions, drivers)

  const sensorJobTimer$ = cronJob('*/30 * * * * *')
    .stream
  
  //return anything you want to output to drivers
  const incomingMessages$ = socketIO.get('someEvent')
    incomingMessages$
      .forEach(e=>console.log("incomingMessages",e))

  //outputs 
  const stream$ = incomingMessages$
    .map(e=>'ok sure')

  const outgoingMessages$ = stream$.map( 
    function(eventData){
      return {
        messageType: 'someEvent',
        message: JSON.stringify(eventData)
      }
    })

  return {
    socketIO: outgoingMessages$
  }
}

//////////setup drivers

let drivers = {
  socketIO: makeSocketIODriver(httpServer)
}

Cycle.run(main, drivers)