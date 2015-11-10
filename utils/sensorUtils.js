import assign from 'fast.js/object/assign'//faster object.assign


export function formatData(data){
  const timestamp = Math.floor(new Date() / 1000)
  return assign({},data,{timestamp})
}

export function addNodeData(nodeData, data){
  return assign({},data,nodeData)
}

export function logData(collection, data){
  //console.log("logging",data)
  collection.insert(data,function(err,result){
    console.log("saved data",err,result)//,data,err,result)
  })
}