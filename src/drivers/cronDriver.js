import {cronJob} from '../utils/utils'

export default function cronDriver(){
  

  function get(crontab){
    //TODO: cache
    const timer$ = cronJob(crontab)
      .stream
    return timer$
  }
  return {get}
}