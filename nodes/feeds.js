import {flatten,mergeAll} from 'ramda'
import Rx from 'rx'

export function getFeedsData(drivers, searchCriteria, limit=10){
  const {db} = drivers
  console.log("I am now getting feeds data",searchCriteria)
  //db.find("nodes",{feedId:4,_id:2},{toArray:true}).forEach(e=>console.log("found nodes",e))
  //db.find("nodes",{feedId:{$all:[4]}},{toArray:true}).forEach(e=>console.log("found nodes2",e))

  const crit = {$in:[2,3]}//[2,3]
  const _id = {_id:crit}
  //db.find("nodes",_id,{toArray:true}).forEach(e=>console.log("found nodes3",e))
  //db.find("nodes",{$all:[0]},{toArray:true}).forEach(e=>console.log("found nodes0",e))
  //db.find("node0SensorData",{},{0:1, _id:0,"timestamp":1},{toArray:true}).forEach(e=>console.log("found nodes1",e))


  //alternative
  let feedFields = searchCriteria.reduce(function(acc,criteria){

    if(!acc[criteria.node]){
      acc[criteria.node] = {_id:0, "timestamp":1}
    }
    acc[criteria.node][criteria.feed] = 1
    return acc
  },{})

  console.log("feedFields", feedFields)

  const collectionNames = {
    2:"node0SensorData"
    ,3:"node1SensorData"
  }

  const nodes = Object.keys(feedFields)

  const results$ = nodes.map((node)=>{
    let collectionName = collectionNames[node]
    
    const projection = feedFields[node]
    console.log("projection",projection,node,collectionName)

    const result$ = db.find(collectionName, {}, projection, {toArray:true})
      .map( data=>data.slice(0,30) )
      .map( data=> {
        let out= {}
        out[node] = data
        return out
      })
    return result$.take(1)
  })

  //hack for now   
  /*const results$ = searchCriteria.map(function(criteria){
    //console.log("mapping searchCriteria",criteria)
    let collectionName = undefined
    if(criteria.node === 2){
      collectionName = "node0SensorData"
    }else if(criteria.node === 3){
      collectionName = "node1SensorData"
    }

    let feedFields = {  _id:0, "timestamp":1 }
    feedFields[criteria.feed] = 1

    console.log("feedFields",feedFields)

    const result$ = db.find(collectionName, {}, feedFields, {toArray:true})
      .map( data=>data.slice(0,30) )
    return result$.take(1)
  })*/

  const out$ = Rx.Observable.forkJoin(results$)//.map(data=>flatten(data))
    .map( resuls => mergeAll(results) ) 
  return out$
}