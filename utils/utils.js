let XMLHttpRequest = require("xhr2").XMLHttpRequest
import Rx from 'rx'



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

  const _job = new CronJob(cronTime, handleNext, handleComplete, true)

  function stop(){
    _job.stop()
  }
  function start(){
    _job.start()
  }
  return {
    start
    ,stop
    ,stream: obs
  }
}





//TODO: taken from three.js ,do correct attribution
export function generateUUID() {

  // http://www.broofa.com/Tools/Math.uuid.htm

  let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split( '' );
  let uuid = new Array( 36 );
  let rnd = 0, r;

  return function () {

    for ( let i = 0; i < 36; i ++ ) {

      if ( i == 8 || i == 13 || i == 18 || i == 23 ) {

        uuid[ i ] = '-';

      } else if ( i == 14 ) {

        uuid[ i ] = '4';

      } else {

        if ( rnd <= 0x02 ) rnd = 0x2000000 + ( Math.random() * 0x1000000 ) | 0;
        r = rnd & 0xf;
        rnd = rnd >> 4;
        uuid[ i ] = chars[ ( i == 19 ) ? ( r & 0x3 ) | 0x8 : r ];

      }
    }
    return uuid.join( '' )
  }()
}

