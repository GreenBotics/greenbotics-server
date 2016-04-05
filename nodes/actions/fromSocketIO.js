// Exposes actions coming from from socket IO
export function intent ({socketIO}) {
  const getInitialData$ = socketIO.get('initialData')
    .do(e => console.log('intent: initialData'))

  const registerNode$ = socketIO.get('registerNode')
    .do(e => console.log('intent: registerNode'))

  return {
    getInitialData$,
    registerNode$
  }
}
