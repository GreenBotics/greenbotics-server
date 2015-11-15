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


function intent(drivers){
  const {socketIO, http} = drivers

  socketIO.get('initialData')
    .forEach(e=>console.log("initialData request",e))

  const getInitialData$ = socketIO.get('initialData')
    .flatMap( e=>db.find("nodes",{},{toArray:true}) )

  
  return {
    getInitialData$
  }
}

function model(actions){
  const nodes$ = actions.getInitialData$
  const feeds$ = undefined

  const data$ = combineLatestObj({nodes$})

  return nodes$  
}



function socketIO(state$){
  const outgoingMessages$ = state$.map( 
    function(eventData){
      return {
        messageType: 'initialData',
        message: JSON.stringify(eventData)
      }
  })

  return outgoingMessages$
}

function requests(drivers, sensorJobTimer$){
  //outbound requests
  const node0Reqs$ = sensorJobTimer$
    .do(e=>console.log("fetch node0 sensor data"))
    .map(e=> ({
          url: "http://192.168.1.20:3020"
          , method: 'get'
          , responseType:"json"
          , name: 'node0'
          , type: 'feedData'
        })
    )

  const node1Reqs$ = sensorJobTimer$
    .do(e=>console.log("fetch node1 sensor data"))
    .map(e=> ({
          url: "http://192.168.1.21:3020"
          , method: 'get'
          , responseType:"json"
          , name: 'node1'
          , type: 'feedData'
        })
    )

  function fetchSensorFeeds(nodes){
    return nodes
      .map(function(node){

      })
  }

  //const requests$ = sensorJobTimer$.flatMap
  const requests$ = Rx.Observable.merge(node0Reqs$,node1Reqs$)
  return requests$
}

function db(drivers){
  const {http} = drivers

  const sensorFeedsData$ = http
    .filter(res$ => res$.request.type === 'feedData')
    .retry(3)
    .catch(function(e){
      console.log("ouch , problem fetching data for node1",e)
      return Rx.Observable.empty()
    })
    .flatMap(function(e){
      const request  = Rx.Observable.just(e.request)
      const response = e.pluck("response")
      return combineLatestObj({response,request})
    })
    .map(function(e){
      const data           = e.response.variables
      const collectionName = e.request.name+"SensorData"
      return {collectionName, data}
    })
    /*.mergeAll()
    .catch(function(e){
      //console.log("ouch , problem fetching data for node0",e)
      return Rx.Observable.empty()
    })
    .pluck("response")
    .pluck("variables")
    .map(formatData)*/
    //.do(e=>console.log("sensorFeedsData",e))

  return sensorFeedsData$
}

  //db
  /*db.find("node1SensorData",{}).forEach(e=>console.log("found",e))
  db.find("node1SensorData",{temperature: { $gt: 21.82 } },{toArray:true})
    .forEach(e=>console.log("found",e))*/
/*const nodes = [
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
  ]*/


function main(drivers) {  
  const actions = intent(drivers)
  const state$  = model(actions, drivers)

  const sensorJobTimer$ = cronJob('*/10 * * * * *')
    .stream
  
  const requests$ = requests(drivers, sensorJobTimer$)
  const db$       = db(drivers)
  const sIO$      = socketIO(state$)

 
  return {
    socketIO: sIO$
    ,db: db$
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