import Rx from 'rx'
import most from 'most'

const just = Rx.Observable.just

function fetchNodeData (node) {
  return get({
    url: node.uri,
    responseType: 'json',
    crossDomain: true,
    credentials: false
  })
    .do(e => console.log('got data', e))
    .retry(10)
    .pluck('response')
    .pluck('variables')
    .shareReplay(1)
}

const nodes = [
  {
    id: 0,
    name: 'Weather station',
    uri: 'http://192.168.1.20:3020'
  },
  {
    id: 1,
    name: 'indoor station',
    uri: 'http://192.168.1.21:3020'
  }
]

sensorJobTimer$
  // .do(e=>console.log('You will see this message every minute'))
  .forEach(function () {
    nodes
      .forEach(function (node) {
        const nodeData = {nodeId: node.id}
        const collection = db.collection(`node${node.id}SensorData`)

        fetchNodeData(node)
          .map(addNodeData.bind(null, nodeData))
          .map(formatData)
          .forEach(logData.bind(null, collection))
      })
  })
