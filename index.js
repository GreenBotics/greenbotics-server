import Rx from 'rx'

import makeHttpServer     from './http-server'
import makeSocketIoServer from './sio-server'
import Cycle from '@cycle/core'


let httpServer = makeHttpServer()
//let sioServer  = makeSocketIoServer(httpServer)

import makeSocketIODriver from './drivers/socketIODriver'
import makeTingoDbDriver  from './drivers/tingoDBStorage'

import {get,cronJob} from './utils/utils'


function main(drivers) {
  const {socketIO,db} = drivers
  
  //const actions = intent(drivers)
  //const state$  = model(undefined, actions, drivers)

  const sensorJobTimer$ = cronJob('*/30 * * * * *')
    .stream


  
  //return anything you want to output to drivers
  const incomingMessages$ = socketIO.get('someEvent')
    .map(e=>JSON.parse(e))
  
  incomingMessages$
    .forEach(e=>console.log("incomingMessages",e))
  

  const dbOutput$ = incomingMessages$
    .map( e=>({collectionName:"foo", data:e}) )


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
    ,db: dbOutput$
  }
}

//////////setup drivers

let drivers = {
  socketIO: makeSocketIODriver(httpServer)
  , db      : makeTingoDbDriver("dbTest")
}

Cycle.run(main, drivers)