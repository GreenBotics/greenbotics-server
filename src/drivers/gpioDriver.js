import gpio from 'rpi-gpio'
import Rx from 'rx'
const fromEvent = Rx.Observable.fromEvent


export default function makeGpioDriver(){

  return function gpioDriver(output$){
    let inputs$ = new Rx.Subject()


    function write(pin,value){

    }

    function setMode(pin, mode){
      gpio.setup(7, gpio.DIR_IN, readInput)
      //write 
      gpio.setup(7, gpio.DIR_OUT, write)
    }

    //listen to changes
    //gpio.setup(7, gpio.DIR_IN, gpio.EDGE_BOTH)

    gpio.on('change', function(channel, value) {
      console.log('Channel ' + channel + ' value is now ' + value)
      inputs$.onNext({channel,value})
    })

    /*output$
      .forEach(write)*/

    return {
      setMode
      ,inputs$
    }

  }

}



//read input 
function readInput() {
    gpio.read(7, function(err, value) {
        console.log('The value is ' + value)
    })
}


function write() {
    gpio.write(7, true, function(err) {
        if (err) throw err
        console.log('Written to pin')
    })
}
