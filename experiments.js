import Rx from 'rx'
import most from 'most'

const just = Rx.Observable.just
import assign from 'fast.js/object/assign'//faster object.assign
import {get,cronJob,makeTingoDbDriver} from './utils'


//////////////

/*var CronJob = require('cron').CronJob
new CronJob('0 * * * * *', function() {
  console.log('You will see this message every minute')
}, null, true)*/
const sensorJobTimer$ = cronJob('*/30 * * * * *')
  .stream


let Datastore = require('tingodb')().Db

let dbPath = './dbTest'
let db = new Datastore(dbPath, {})


function fetchNodeData(node){
  return get({
      url:node.uri
      ,responseType:"json"
      ,crossDomain:true
      ,credentials:false
    })  
    .do(e=>console.log("got data",e))
    .retry(10)
    .pluck("response")
    .pluck("variables")
    .shareReplay(1)
}

function formatData(data){
  const timestamp = Math.floor(new Date() / 1000)
  return assign({},data,{timestamp})
}

function addNodeData(nodeData,data){
  return assign({},data,nodeData)
}

function logData(collection,data){
  //console.log("logging",data)
  collection.insert(data,function(err,result){
    console.log("saved data",err,result)//,data,err,result)
  })
}

const nodes = [
  {id:0,name:"Weather station",uri:"http://192.168.1.20:3020"}
  ,{id:1,name:"indoor station",uri:"http://192.168.1.21:3020"}
]

/*let otherNodes = [
  {id:"xxx",name:"Weather station",uri:"http://192.168.1.20:3020"}
  ,{id:"xxx",name:"indoor station",uri:"http://192.168.1.21:3020"}
]
db.collection('nodes').insert( otherNodes,function(err, result) {

})*/


sensorJobTimer$
  //.do(e=>console.log('You will see this message every minute'))
  .forEach(function(){
    nodes
      .forEach(function(node){
        const nodeData   = {nodeId:node.id}
        const collection = db.collection(`node${node.id}SensorData`)

        fetchNodeData(node)
          .map(addNodeData.bind(null,nodeData))
          .map(formatData)
          .forEach(logData.bind(null,collection))
      })
  })

/*get({url:"http://192.168.1.20:3020",responseType:"json"})
  .forEach(e=>console.log("recieved",e))*/
/////////////////
let tingodbDriver = makeTingoDbDriver("dbTest")

let output$ = sensorJobTimer$.map( e=>({collectionName:"foo", data:[{cata:"42"}]}) )
let tingodb = tingodbDriver(output$)
//tingodb.find("node1SensorData",{}).forEach(e=>console.log("found",e))
tingodb.find("node1SensorData",{temperature: { $gt: 21.82 } },{toArray:true})
  .forEach(e=>console.log("found",e))


