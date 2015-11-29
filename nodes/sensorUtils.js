import assign from 'fast.js/object/assign'//faster object.assign


//temporary
export function remapData(nodeId, data){
  let mapping = {}
  if(nodeId===0){
    mapping = {
      "temperature":'EklkizENg'
      ,"humidity":'VJggksfNEl'
      ,"pressure":'NJ-eyifVEe'
      ,"windSpd":'4Jzx1iMN4l'
      ,"windDir":'Nk7lJsGV4e'
      ,"rain":'EJVxJof4Ne'
      ,"visL":'EJHekjfNNe'
      ,"UVL":'V1IeyiGN4x'
      ,"irL":'41vgJoz4Ve'
    }


  }else if(nodeId ===1){

     mapping = {
      "temperature":'EyOxJsGVVg'
      ,"humidity":'VyFxJiz4Ee'
      ,"pressure":'EJ5lJjfNEl'
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