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
import {combineLatestObj} from './utils/obsUtils'


function baseData({socketIO, db}){
  socketIO.get('initialData')
    .forEach(e=>console.log("initialData request",e))

  const nodes$ = socketIO.get('initialData')
    .flatMap( e=>db.find("nodes",{},{toArray:true}) )

    //.startWith([])

  nodes$
    .forEach(e=>console.log("nodes",e))

  const data$ = combineLatestObj({nodes$})

  //data$
  //  .filter(e=>e!==undefined)
    //.forEach(e=>console.log("baseData",e.nodes[0]))
  return nodes$
}


function main(drivers) {
  const {socketIO, db, http} = drivers
  
  //const actions = intent(drivers)
  //const state$  = model(undefined, actions, drivers)

  const sensorJobTimer$ = cronJob('*/50 * 3 * * *')
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

  /*const baseClientData$ = socketIO.get('initialData')
    .forEach(e=>console.log("initialData",e))*/


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


  const nodes = [
    { uid:"1b49763e-8aad-4c2b-8326-46b7548c232b"
      ,name:"Weather station"
      ,uri:"http://192.168.1.20:3020"
      ,sensorFeeds:[
         {feedId:0, type:"temperature"}
        ,{feedId:1, type:"humidity" }
        ,{feedId:2, type:"pressure" }
        ,{feedId:3, type:"windSpd" }
        ,{feedId:4, type:"windDir" }
        ,{feedId:5, type:"rain" }
        ,{feedId:6, type:"light" }
        ,{feedId:7, type:"UV" }
        ,{feedId:8, type:"IR" }
      ]
    }

  ,{
      uid:"e53b703b-84a2-40f1-8717-5fda64e588d0"
      ,name:"indoor station"
      ,uri:"http://192.168.1.21:3020"
      ,sensorFeeds:[
        {feedId:0, type:"temperature"}
        ,{feedId:1, type:"humidity"}
        ,{feedId:2, type:"pressure" }
      ]
    }
  ]

  const dbOutput$ = Rx.Observable.merge(node0DbOut$,node1DbOut$)
    /*Rx.Observable.just(nodes)
    .map(function(e){
      return {collectionName:"nodes",data:e}
    })*/
 
  //outputs 


  /*const outgoingMessages$ = Rx.Observable
    .interval(500)
    .map(function(e){
      return {messageType:"foo",message:"bar"}
    })*/

  const outgoingMessages$ = baseData(drivers).map( 
    function(eventData){
      return {
        messageType: 'initialData',
        message: JSON.stringify(eventData)
      }
    })
    .merge(Rx.Observable.just({messageType:"foo",message:'bar'}))


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