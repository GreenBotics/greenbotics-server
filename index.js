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
  http
    .filter(res$ => res$.request.name === 'fakename')
    .mergeAll()
    .forEach(e=>console.log("request response",e))

  http
    .filter(res$ => res$.request.name === 'fakename2')
    .mergeAll()
    .forEach(e=>console.log("request response2",e))


  let node1Reqs$ = sensorJobTimer$
    .map(e=> ({
          url: "http://192.168.1.20:3020",
          method: 'get',
          name: 'fakename',
          anyOtherDataYouWish: 'foo'
        })
    )

  let node2Reqs$ = sensorJobTimer$
    .map(e=> ({
          url: "http://192.168.1.21:3020",
          method: 'get',
          name: 'fakename2',
          anyOtherDataYouWish: 'foo'
        })
    )

  let request$ = Rx.Observable.merge(node1Reqs$,node2Reqs$)
  
  //return anything you want to output to drivers
  const incomingMessages$ = socketIO.get('someEvent')
    .map(e=>JSON.parse(e))
  

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
    ,http:request$
  }
}

//////////setup drivers

let drivers = {
  socketIO  : makeSocketIODriver(httpServer)
  , db      : makeTingoDbDriver("dbTest")
  , http    : makeHttpDriver()
}

Cycle.run(main, drivers)