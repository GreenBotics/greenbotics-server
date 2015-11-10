import {uuid} from '../utils'

//new nodes would need to register at this server

function nodeRegistration(inputs$){

  return inputs$
    .filter(e=>e.type==="registration")
    .map(function(registrationData){
      return {}
    })
}