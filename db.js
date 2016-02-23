import Rx from 'rx'
const  {merge, of} = Rx.Observable
import {combineLatestObj} from './utils/obsUtils'
import {omit} from 'ramda'
import assign from 'fast.js/object/assign'//faster object.assign


export function db({sources, actions}){
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

  const getInitialData$ = actions.getInitialData$
    .tap(e=>console.log("reacting to actions.getInitialData"))
    .map(d=> ({method:'find', id:'initialData', collectionName:"nodes", query:{nodes:{}}, options:{toArray:true} }))

    //sensorFeedsData$,
  return merge( getInitialData$ )
}
