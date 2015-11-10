import Rx from 'rx'
/////////////
let Datastore = require('tingodb')().Db

export default function makeTingoDbDriver(dbPath){
  let db = new Datastore(dbPath, {})

  return function tingoDbDriver(output$)
  {
    let _cachedCollections = {}

    //output$ = new Rx.Subject() //output TO DB 

    function insert({collectionName, data}){
      let collection = _cachedCollections[collectionName]
      if(!collection){
        collection = db.collection(collectionName)
        _cachedCollections[collectionName] = collection
      }
      collection.insert(data , function(err, result) {
        console.log("insert",data, err,result)
      })
    }

    function update({collectionName, query, data, options}){

    }

    function findOne(collectionName, selectors){
      let obs = new Rx.Subject()
      let collection = _cachedCollections[collectionName]
      if(!collection){
        collection = db.collection(collectionName)
        //obs.onError(`collection ${collectionName} not found`)
      }

      collection.findOne(selectors, function(err, item) {
        //console.log("finding stuff",err,item)
        if(item){
          obs.onNext(item)
        }
        else if(err){
          obs.onError(err)
        }
      })
      
      return obs
    }

    function find(collectionName, selectors, options){
      let obs = new Rx.Subject()
      let collection = _cachedCollections[collectionName]
      if(!collection){
        collection = db.collection(collectionName)
        //obs.onError(`collection ${collectionName} not found`)
      }
      collection.find(selectors, function(err, item) {
        //console.log("finding stuff",err,item, options)
        if(item){
          if(options.toArray){
            item.toArray(function(err,res){
              //console.log("err",err,res)
              obs.onNext(res)
            })
          }else{
            obs.onNext(item)
          }
          
        }
        else if(err){
          obs.onError(err)
        }
      })
      
      return obs
    }

    output$
      .forEach(insert)

    return {
      findOne
      ,find
    }
  }
}
