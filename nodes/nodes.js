import shortid from 'shortid'

/* let sensors = 12
for(let i=0;i<sensors;i++){
  console.log({id:shortid.generate()})
}*/

export function registerNode (params) {
  const defaults = {}
}

export function registerSensor (params) {
  const defaults = {
    type: undefined,
    id: shortid.generate() // we use unique ids instead of integers so we don't have to deal with bloody
  // "namespacing" , be able to move sensors etc
  }
}

export const nodes = [
  { uid: '1b49763e-8aad-4c2b-8326-46b7548c232b',
  _id: 0,
  name: 'Weather station',
  uri: 'http://192.168.1.20:3020',
  online: false,
  sensors: [
    { id: 'EklkizENg', type: 'temperature' },
    { id: 'VJggksfNEl', type: 'humidity' },
    { id: 'NJ-eyifVEe', type: 'pressure' },
    { id: '4Jzx1iMN4l', type: 'windSpd' },
    { id: 'Nk7lJsGV4e', type: 'windDir' },
    { id: 'EJVxJof4Ne', type: 'rain' },
    { id: 'EJHekjfNNe', type: 'light' },
    { id: 'V1IeyiGN4x', type: 'UV' },
    { id: '41vgJoz4Ve', type: 'IR' }]
  },

  {
    uid: 'e53b703b-84a2-40f1-8717-5fda64e588d0',
    id: 1,
    name: 'indoor station',
    uri: 'http://192.168.1.21:3020',
    online: false,
    sensors: [
      { id: 'EyOxJsGVVg', type: 'temperature' },
      { id: 'VyFxJiz4Ee', type: 'humidity' },
      { id: 'EJ5lJjfNEl', type: 'pressure' }
    ]
  }
]
