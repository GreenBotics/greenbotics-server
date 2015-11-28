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
import {formatData,remapData} from './utils/sensorUtils'
import {combineLatestObj} from './utils/obsUtils'


const nodes = [
    { uid:"1b49763e-8aad-4c2b-8326-46b7548c232b"
      ,_id:0
      ,name:"Weather station"
      ,uri:"http://192.168.1.20:3020"
      ,sensors:[
         {id:0, type:"temperature"}
        ,{id:1, type:"humidity" }
        ,{id:2, type:"pressure" }
        ,{id:3, type:"windSpd" }
        ,{id:4, type:"windDir" }
        ,{id:5, type:"rain" }
        ,{id:6, type:"light" }
        ,{id:7, type:"UV" }
        ,{id:8, type:"IR" }
      ]
    }

  ,{
      uid:"e53b703b-84a2-40f1-8717-5fda64e588d0"
      ,id:1
      ,name:"indoor station"
      ,uri:"http://192.168.1.21:3020"
      ,sensors:[
        {id:0, type:"temperature"}
        ,{id:1, type:"humidity"}
        ,{id:2, type:"pressure" }
      ]
    }
  ]



function intent(drivers){
  const {socketIO, http, db} = drivers

  socketIO.get('initialData')
    .forEach(e=>console.log("initialData request"))

  const getInitialData$ = socketIO.get('initialData')
    .flatMap( e=>db.find("nodes",{},{toArray:true}) )

  const getFeedsData$   = socketIO.get('getFeedsData')
    .do(e=>console.log("getFeedsData",e))
    .map(function(searchCriteria){
      /* [ { node: 2, feed: 2 },
        { node: 2, feed: 1 },
        { node: 2, feed: 0 } ]*/

        db.find("nodes",{feedId:4,_id:2},{toArray:true}).forEach(e=>console.log("found nodes",e))
        db.find("nodes",{feedId:{$all:[4]}},{toArray:true}).forEach(e=>console.log("found nodes2",e))


        const crit = {$in:[2,3]}//[2,3]
        const _id = {_id:crit}

        db.find("nodes",_id,{toArray:true}).forEach(e=>console.log("found nodes3",e))
        //hack for now 
        /*searchCriteria.map(function(criteria){
          let collectionName = undefined
          if(criteria.node === 2){
            collectionName = "node0SensorData"
          }else if(criteria.node === 3){
            collectionName = "node1SensorData"
          }

          e=>db.find(collectionName,{},{toArray:true})

        })*/

    })
    .flatMap( e=>db.find("node0SensorData",{},{toArray:true}) ) 
    
  return {
    getInitialData$
    ,getFeedsData$
  }
}

function model(actions){
  const nodes$ = actions.getInitialData$
  const feeds$ = actions.getFeedsData$


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

  const feeds$ = actions.getFeedsData$
    //.do(e=>console.log("getFeedsData",e))
    .map(e=>JSON.stringify(e))
    .map(e=>({messageType:'getFeedsData',message:e}))

  return merge(
    initialData$
    ,feeds$
    )
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
  const requests$ = merge(node0Reqs$,node1Reqs$)
  return requests$
}

function db(drivers){
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

  //return Rx.Observable.just({collectionName:"nodes",data:nodes})
  return sensorFeedsData$
}

  //db
  /*db.find("node1SensorData",{}).forEach(e=>console.log("found",e))
  db.find("node1SensorData",{temperature: { $gt: 21.82 } },{toArray:true})
    .forEach(e=>console.log("found",e))*/

  

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