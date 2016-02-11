import Rx from 'rx'
const {merge} = Rx.Observable
import {flatten} from 'Ramda'

/*From https://github.com/staltz/combineLatestObj*/
export function combineLatestObj(obj) {
  var sources = [];
  var keys = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      keys.push(key.replace(/\$$/, ''));
      sources.push(obj[key]);
    }
  }
  return Rx.Observable.combineLatest(sources, function () {
    var argsLength = arguments.length;
    var combination = {};
    for (var i = argsLength - 1; i >= 0; i--) {
      combination[keys[i]] = arguments[i];
    }
    return combination;
  })
}



/*merges an array of action objects into a single object :ie
 [{doBar$, doFoo$}, {doBaz$, doBar$}] => {doBar$, doFoo$, doBaz$} 
*/
export function mergeActionsByName(actionSources, validActions=[]){

  return actionSources.reduce(function(result, actions){
    //console.log("acions",Object.keys(actions),validActions)
    Object.keys(actions)
      .filter(key=> validActions.length === 0 || validActions.indexOf(key.replace('$',''))>-1)
      .map(function(key){
        const action = actions[key]
        if(key in result){
          result[key] = merge(result[key], action)
        }else{
          result[key] = action
        }       
      })

    return result
  },{})
 
}



/*utility function to dynamically load and use the "data extractors" (ie functions that
 extract useful data from raw data)
*/
export function actionsFromSources(sources, basePath){

  const data = Object.keys(sources).map(function(sourceName){
    try{
      const modulePath     = basePath+sourceName
      const actionsImport  = require(modulePath)
      //const sourceData     = sources[sourceName]//the raw source of data (ususually a driver)

      return actionsImport.intent(sources)
    }catch(error){}
  })
  .filter(data=>data!==undefined)

  return mergeActionsByName( data )
  //return merge( flatten( data ) )
}


/*utility function to dynamically load and use the "data extractors" (ie functions that
 extract useful data from raw data)
*/
export function extractDataFromRawSources(sources, basePath){

  const data = Object.keys(sources).map(function(sourceName){
    try{
      const extractorImport = require('../../core/sources/'+sourceName)
      
      const sourceData     = sources[sourceName]//the raw source of data (ususually a driver)
      const extractorNames = Object.keys(extractorImport)



      //TODO , find a better way to do this
      const paramsHelper = {
        get:function get(category, params){
          const data = {
            'extensions':{ foo: []}
          }
          return data[category][params]
        }
      }
      
      //deal with all the different data "field" functions that are provided by the imports
      const refinedData =  extractorNames.map(function(name){
        const fn = extractorImport[name]
        if(fn){
          const refinedData = fn(sourceData, paramsHelper)
            .flatMap(fromArray)
            .filter(exists)
            return refinedData
        }
      })

      return refinedData
     
    }catch(error){}
  })
  .filter(data=>data!==undefined)

  return merge( flatten( data ) )
}