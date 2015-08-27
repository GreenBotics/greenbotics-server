var gpio = require('rpi-gpio')
var fs = require('fs')

var Rx = require('rx')
var RxNode = require('rx-node')

//read input 
gpio.setup(7, gpio.DIR_IN, readInput)
function readInput() {
    gpio.read(7, function(err, value) {
        console.log('The value is ' + value)
    });
}

//write 
gpio.setup(7, gpio.DIR_OUT, write)

function write() {
    gpio.write(7, true, function(err) {
        if (err) throw err;
        console.log('Written to pin');
    });
}

//listen to changes
gpio.on('change', function(channel, value) {
    console.log('Channel ' + channel + ' value is now ' + value);
});
gpio.setup(7, gpio.DIR_IN, gpio.EDGE_BOTH)

//with rxjs
var exists = RxNode.fromCallback(fs.exists)

RxNode.fromCallback(fs.exists)
RxNode.fromCallback(gpio.setup)