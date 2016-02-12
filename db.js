import Rx from 'rx'
const {merge, of} = Rx.Observable
import {combineLatestObj} from './utils/obsUtils'


export function db(sources){
  //db
  const {http} = sources

  const sensorFeedsData$ = http
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

      return {collectionName, data}
    })

  //actions
  /* //test stuff
  return Rx.Observable.just({collectionName:"nodes",data:nodes}).do(e=>console.log("please save nodes",e))
  db.find("node1SensorData",{}).forEach(e=>console.log("found",e))
  db.find("node1SensorData",{temperature: { $gt: 21.82 } },{toArray:true})
    .forEach(e=>console.log("found",e))*/
  return sensorFeedsData$
}