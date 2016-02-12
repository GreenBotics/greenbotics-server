import Rx from 'rx'
const {merge,of} = Rx.Observable
import path from 'path'

import makeHttpServer     from './http-server'
import makeSocketIoServer from './sio-server'
import Cycle from '@cycle/core'

let httpServer = makeHttpServer()
//let sioServer  = makeSocketIoServer(httpServer)

import makeSocketIODriver from './drivers/socketIODriver'
import makeTingoDbDriver  from 'cycle-tingodb'
import makeHttpDriver     from 'cycle-simple-http-driver'
import makeMqttDriver     from 'cycle-mqtt-driver'
import cronDriver         from './drivers/cronDriver'

import {get} from './utils/utils'
import {combineLatestObj, actionsFromSources} from './utils/obsUtils'

import {formatData,remapData} from './nodes/sensorUtils'
import {getFeedsData} from './nodes/feeds'
import {nodes} from './nodes/nodes'

import {db} from './db'
 

function model(actions, sources){
  const nodes$ = actions.getInitialData$
  const feeds$ = actions.getFeedsData$
    .flatMap(getFeedsData.bind(null,sources))


  return combineLatestObj({nodes$,feeds$})
}

function socketIORequests(state$, actions){
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

function httpRequests(sources){

  const sensorJobTimer$ = sources.cron.get('*/10 * * * * *')
    .tap(e=>console.log("sensorJobTimer",e))

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
  const requests$ = Rx.Observable.never()//merge(node0Reqs$,node1Reqs$)
  return requests$
}



function main(sources) { 
  const actions = actionsFromSources(sources, path.resolve(__dirname,'./actions')+'/' )
  const state$  = model(actions, sources)

  //console.log("actions",actions)
  
  const http$     = httpRequests(sources)
  const sIO$      = socketIORequests(state$, actions)
  const db$       = db(sources)
  const mqtt$     = Rx.Observable.never()


  return {
    socketIO: sIO$
    ,http   : http$
    ,mqtt   : mqtt$
    ,db     : db$
  }
}

//////////setup drivers

let drivers = {
  socketIO  : makeSocketIODriver(httpServer)
  , db      : makeTingoDbDriver("dbTest")
  , http    : makeHttpDriver()
  , mqtt    : makeMqttDriver( {host:'localhost', port:1981} )
  , cron    : cronDriver
}

Cycle.run(main, drivers)