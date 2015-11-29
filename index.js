import Rx from 'rx'
const merge = Rx.Observable.merge

import makeHttpServer     from './http-server'
import makeSocketIoServer from './sio-server'
import Cycle from '@cycle/core'

let httpServer = makeHttpServer()
//let sioServer  = makeSocketIoServer(httpServer)

import makeSocketIODriver from './drivers/socketIODriver'
import makeTingoDbDriver  from './drivers/tingoDBStorage'
import makeHttpDriver     from './drivers/httpDriver'

import {get,cronJob} from './utils/utils'
import {combineLatestObj} from './utils/obsUtils'

import {formatData,remapData} from './nodes/sensorUtils'
import {getFeedsData} from './nodes/feeds'
import {nodes} from './nodes/nodes'


function intent(drivers){
  const {socketIO, http, db} = drivers

  const getInitialData$ = socketIO.get('initialData')
    .do(e=>console.log("intent: initialData"))
    .flatMap( e=>db.find("nodes",{},{toArray:true}) )

  const getFeedsData$   = socketIO.get('getFeedsData')
    .filter(criteria=>criteria.length>0)
    .do(e=>console.log("intent: getFeedsData",e))

  const registerNode$ = socketIO.get('registerNode')
    .do(e=>console.log("intent: registerNode")

  const registerFeed$ = socketIO.get('registerFeed')
    .do(e=>console.log("intent: registerFeed")
    
  return {
    getInitialData$
    ,getFeedsData$
    ,registerNode$
    ,registerFeed$
  }
}

function model(actions, drivers){
  const nodes$ = actions.getInitialData$
  const feeds$ = actions.getFeedsData$
    .flatMap(getFeedsData.bind(null,drivers))
    .do(e=>console.log("feedData OUT",e))

  return combineLatestObj({nodes$,feeds$})
}


function socketIO(state$, actions){
  const initialData$ = actions.getInitialData$
    .map( 
      function(eventData){
        return {
          messageType: 'initialData',
          message: JSON.stringify(eventData)
        }
    })

  const feeds$ = state$
    .pluck("feeds")
    .distinctUntilChanged()
    .map(e=>JSON.stringify(e))
    .map(e=>({messageType:'getFeedsData',message:e}))
    /*actions.getFeedsData$*/

  return merge(
    initialData$
    ,feeds$
    )
}

function requests(drivers, sensorJobTimer$){
  //outbound requests
  const node0Reqs$ = sensorJobTimer$
    //.do(e=>console.log("fetch node0 sensor data"))
    .map(e=> ({
          url: "http://192.168.1.20:3020"
          , method: 'get'
          , responseType:"json"
          , name: 'node0'
          , type: 'feedData'
        })
    )

  const node1Reqs$ = sensorJobTimer$
    //.do(e=>console.log("fetch node1 sensor data"))
    .map(e=> ({
          url: "http://192.168.1.21:3020"
          , method: 'get'
          , responseType:"json"
          , name: 'node1'
          , type: 'feedData'
        })
    )

  //const requests$ = sensorJobTimer$.flatMap
  const requests$ = merge(node0Reqs$,node1Reqs$)
  return requests$
}

function db(drivers){
  //db
  /*db.find("node1SensorData",{}).forEach(e=>console.log("found",e))
  db.find("node1SensorData",{temperature: { $gt: 21.82 } },{toArray:true})
    .forEach(e=>console.log("found",e))*/
  const {http} = drivers

  const sensorFeedsData$ = http
    .filter(res$ => res$.request.type === 'feedData')
    //.retry(3)
    .catch(function(e){
      console.log("ouch , problem fetching data for node1, really",e)
      return Rx.Observable.empty()
    })
    .flatMap(function(e){
      const request  = Rx.Observable.just(e.request)
      const response = e.pluck("response")
      return combineLatestObj({response,request})
    })
    .map(function(e){
      const nodeId = parseInt(e.request.name.replace("node",""))
      const data           = remapData(nodeId, formatData(e.response.variables))
      const collectionName = e.request.name+"SensorData"
      return {collectionName, data}
    })
  //actions
  //  .registerNode()
  //return Rx.Observable.just({collectionName:"nodes",data:nodes}).do(e=>console.log("please save nodes",e))
  return sensorFeedsData$
}

  

function main(drivers) {  
  const actions = intent(drivers)
  const state$  = model(actions, drivers)

  const sensorJobTimer$ = cronJob('*/10 * * * * *')
    .stream
  
  const requests$ = requests(drivers, sensorJobTimer$)
  const db$       = db(drivers)
  const sIO$      = socketIO(state$,actions)

 
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