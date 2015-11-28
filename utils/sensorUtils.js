import assign from 'fast.js/object/assign'//faster object.assign


//temporary
export function remapData(nodeId, data){
  let mapping = {}
  if(nodeId===0){
    mapping = {
      "temperature":0
      ,"humidity":1
      ,"pressure":2
      ,"windSpd":3
      ,"windDir":4
      ,"rain":5
      ,"visL":6
      ,"UVL":7
      ,"irL":8
    }


  }else if(nodeId ===1){

     mapping = {
      "temperature":0
      ,"humidity":1
      ,"pressure":2
    }
  }

  let output = {}
  for(let key in data){
    let outKey = mapping[key]
    if(outKey !== undefined){
      output[outKey] = data[key]
    }else
    {
      output[key] = data[key]
    }
    
  }
  return output

}

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