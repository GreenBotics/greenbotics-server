let XMLHttpRequest = require("xhr2").XMLHttpRequest
import Rx from 'rx'




export function get(options={responseType:"text"}){
  let obs = new Rx.Subject()

  let xmlhttp = new XMLHttpRequest()

  function handleProgress(e){
    if (e.lengthComputable) {
      obs.onNext({progress: (e.loaded / e.total)}) 
    }
  }
  function handleComplete(e){
    let response = xmlhttp.response
    response = options.responseType === 'json' ? JSON.parse(response) : response
    obs.onNext({response})
    obs.onCompleted()
  }

  xmlhttp.addEventListener("progress", handleProgress)
  xmlhttp.addEventListener("load",  handleComplete)
  xmlhttp.addEventListener("error", e=>obs.onError(e))
  xmlhttp.addEventListener("abort", e=>obs.onError(e))


  xmlhttp.open("GET",options.url, true)
  /*xmlhttp.onreadystatechange=function(){
       if (xmlhttp.readyState==4 && xmlhttp.status==200){
       
        obs.onNext(response)
       }
  }*/
  xmlhttp.send()
  return obs
}


//wrapper around CronJob
//TODO : how to deal with start/stop
const CronJob = require('cron').CronJob

export function cronJob(cronTime){
  let obs = new Rx.Subject()

  function handleNext(e){
    obs.onNext()
  }
  function handleComplete(e){   
    obs.onCompleted()
  }

  new CronJob(cronTime, handleNext, handleComplete, true)

  return obs
}