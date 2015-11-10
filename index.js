import Rx from 'rx'

import makeHttpServer     from './http-server'
import makeSocketIoServer from './sio-server'
import Cycle from '@cycle/core'


let httpServer = makeHttpServer()
//let sioServer  = makeSocketIoServer(httpServer)

import makeSocketIODriver from './drivers/socketIODriver'
import makeTingoDbDriver  from './drivers/tingoDBStorage'
import makeHttpDriver     from './drivers/httpDriver'

import {get,cronJob} from './utils/utils'
import {formatData} from './utils/sensorUtils'



function socketIOReplies(inputs$){


  
}



function main(drivers) {
  const {socketIO, db, http} = drivers
  
  //const actions = intent(drivers)
  //const state$  = model(undefined, actions, drivers)

  const sensorJobTimer$ = cronJob('*/50 * * * * *')
    .stream

  //db
  /*db.find("node1SensorData",{}).forEach(e=>console.log("found",e))
  db.find("node1SensorData",{temperature: { $gt: 21.82 } },{toArray:true})
    .forEach(e=>console.log("found",e))*/

  //http requests
  
  let node0Data$ = http
    .filter(res$ => res$.request.name === 'node0')
    .mergeAll()
    .pluck("response")
    .pluck("variables")
    .map(formatData)
  
  let node1Data$ = http
    .filter(res$ => res$.request.name === 'node1')
    .mergeAll()
    .pluck("response")
    .pluck("variables")
    .map(formatData)

  node0Data$.forEach(e=>console.log("node0Data recieved",e))
  node1Data$.forEach(e=>console.log("node1Data recieved",e))


  //outbound requests
  let node0Reqs$ = sensorJobTimer$
    .map(e=> ({
          url: "http://192.168.1.20:3020"
          , method: 'get'
          , responseType:"json"
          , name: 'node0'
          , anyOtherDataYouWish: 'foo'
        })
    )

  let node1Reqs$ = sensorJobTimer$
    .map(e=> ({
          url: "http://192.168.1.21:3020"
          , method: 'get'
          , responseType:"json"
          , name: 'node1'
          , anyOtherDataYouWish: 'foo'
        })
    )

  const requests$ = Rx.Observable.merge(node0Reqs$,node1Reqs$)
    .retry(3)
  
  //return anything you want to output to drivers

  const baseClientData$ = socketIO.get('initialData')
    .forEach(e=>console.log("initialData",e))


  const incomingMessages$ = socketIO.get('someEvent')
    .map(e=>JSON.parse(e))
  

  //incomingMessages$
  const node0DbOut$ = node0Data$
    .map(function(e){
      return {collectionName:"node0SensorData", data:e}
    })

  const node1DbOut$ = node1Data$
    .map(function(e){
      return {collectionName:"node1SensorData", data:e}
    })

  const dbOutput$ = Rx.Observable.merge(node0DbOut$,node1DbOut$)
    //.map( e=>({collectionName:"foo", data:e}) )


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
    ,http:requests$
  }
}

//////////setup drivers

let drivers = {
  socketIO  : makeSocketIODriver(httpServer)
  , db      : makeTingoDbDriver("dbTest")
  , http    : makeHttpDriver()
}

Cycle.run(main, drivers)