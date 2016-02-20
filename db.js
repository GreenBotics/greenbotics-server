import Rx from 'rx'
const  {merge, of} = Rx.Observable
import {combineLatestObj} from './utils/obsUtils'
import {omit} from 'ramda'
import assign from 'fast.js/object/assign'//faster object.assign


export function db({sources, actions}){
  //db
  const {http, db, mqtt} = sources
  
  //const sensorFeedsData$ = new Rx.Subject()

  const sensorFeedsData$ = actions.updateFeedsData$
    .map(d=>JSON.parse( d.toString() ))
    .map(function(data){
      const nodeId = parseInt(data.nodeId)
      const sensorData     = assign({}, omit(['nodeId'], data), {timestamp:Date.now()} ) //remapData(nodeId, formatData(reqRes.response.variables))

      const collectionName = `node_${nodeId}_sensorData` 
      return {method:'insert', collectionName, data:sensorData}
    })
    .tap(e=>console.log("updateFeedsData",e))
    //.forEach(e=>e)


  /*db
    .filter(res$ => res$.query.method === 'find' && res$.query.id===45 )
    .flatMap(data => {
      const response$ = data.catch(e=>{
        console.log("caught error in fetching data",e)
        return Rx.Observable.empty()
      })
      const query    = of(data.query)
      const response = response$
      return  combineLatestObj({response,query})//.materialize()//FIXME: still do not get this one
    })
    //.mergeAll()
    .forEach(e=>console.log("db GET",e))

  
  

  const collectionName = 'test'+"SensorData"

  setInterval(function(){

    const data           = {name:'foo',bar:'baz'}//remapData(nodeId, formatData(reqRes.response.variables))
    const data2           = {name:'bar',count:45}//remapData(nodeId, formatData(reqRes.response.variables))

    sensorFeedsData$.onNext(  {method:'insert', collectionName, data} )
    sensorFeedsData$.onNext(  {method:'insert', collectionName, data:data2} )

  },10000)

  setInterval(function(){
      const projection = {}
      sensorFeedsData$.onNext(  {method:'find', id:'joofaz', collectionName, query:{}, projection, options:{toArray:true} } )
      sensorFeedsData$.onNext(  {method:'find', id:45, collectionName, query:{name:'foo'}, projection, options:{toArray:true} } )
  }, 15000)


  setInterval(function(){
    sensorFeedsData$.onNext(  {method:'delete', collectionName, query:{} } )
  }, 30000)*/



  /*const sensorFeedsData$ = http
    .filter(res$ => res$.request.type === 'feedData')
    .flatMap(data => {
      const response$ = data.catch(e=>{
        console.log("caught error in fetching sensor data",e)
        return Rx.Observable.empty()
      })
      const request  = of(data.request)
      const response = response$.pluck("response")
      return combineLatestObj({response,request})//.materialize()//FIXME: still do not get this one
    })
    .filter(reqRes => (reqRes.response.variables !== undefined) )
    .map(function(reqRes){
      const nodeId = parseInt(reqRes.request.name.replace("node",""))
      const data           = remapData(nodeId, formatData(reqRes.response.variables))
      const collectionName = reqRes.request.name+"SensorData"

      return {method:'insert', collectionName, data}
    })*/

  //actions
  /* //test stuff
  return Rx.Observable.just({collectionName:"nodes",data:nodes}).do(e=>console.log("please save nodes",e))
  db.find("node1SensorData",{}).forEach(e=>console.log("found",e))
  db.find("node1SensorData",{temperature: { $gt: 21.82 } },{toArray:true})
    .forEach(e=>console.log("found",e))*/
  return sensorFeedsData$//.tap(e=>console.log("sensorFeedsData",e))
}