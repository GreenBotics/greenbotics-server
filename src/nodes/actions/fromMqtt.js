// Exposes actions coming from from socket IO
export function intent ({socketIO}) {
  const getInitialData$ = socketIO.get('initialData')
    .do(e => console.log('intent: initialData'))

  const getFeedsData$ = socketIO.get('getFeedsData')
    .filter(criteria => criteria.length > 0)
    .do(e => console.log('intent: getFeedsData', e))

  const registerNode$ = socketIO.get('registerNode')
    .do(e => console.log('intent: registerNode'))

  return {
    getInitialData$,
    getFeedsData$,
    registerNode$
  }
}
