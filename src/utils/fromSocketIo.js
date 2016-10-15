export function socketIO(address, openObserver) {
  let socket = io(address)
  // Handle the data
  let observable = Rx.Observable.create (function (obs) {
      if (openObserver) {
          socket.on('connect', function () {
              openObserver.onNext()
              openObserver.onCompleted()
          })
      }

      // Handle messages
      socket.io.on('packet', function (packet) {
          if (packet.data) obs.onNext({
              name: packet.data[0],
              data: packet.data[1]
          })
      })
      socket.on('error', function (err) { obs.onError(err) })
      socket.on('reconnect_error', function (err) { obs.onError(err) })
      socket.on('reconnect_failed', function () { obs.onError(new Error('reconnection failed')) })
      socket.io.on('close', function () { obs.onCompleted() })

      // Return way to unsubscribe
      return function() {
          socket.close()
      }
  })

  let observer = Rx.Observer.create(function (event) {
      if (socket.connected) {
          socket.emit(event.name, event.data)
      }
  })

  return Rx.Subject.create(observer, observable)
}
