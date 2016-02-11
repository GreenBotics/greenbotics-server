

export function intent({mqtt}){

  const registerNode$ = mqtt.get('registerNode')
    .do(e=>console.log("intent: registerNode"))

  const registerFeed$ = mqtt.get('registerFeed')
    .do(e=>console.log("intent: registerFeed"))

  const updateFeedsData$  = mqtt.get("sensorData")
    .do(e=>console.log("intent: updateFeedsData",e))

  const updateNodeStatus$ = mqtt.get("nodeOnline")
    .do(e=>console.log("intent:updateNodeStatus",e))
    
  return {
      registerNode$
    , registerFeed$
    , updateFeedsData$
    , updateNodeStatus$
  }
}