const EthStore = require('./index')
// const EthQuery = require('./query')
const ZeroClient = require('web3-provider-engine/zero')

var engine = ZeroClient({
  rpcUrl: 'https://testrpc.metamask.io/',
})

// var query = new EthQuery(engine)
var store = new EthStore(engine, engine)

// store.addAccount('0x18a3462427bcc9133bb46e88bcbe39cd7ef0e761')
// store.addTransaction('0x0eebfb085d67ef47a1acdd04e8af0a181e48eaf23843dd6125960080818ff2e0')

store.put('myBalance', {
  method: 'eth_getBalance',
  params: ['0x18a3462427bcc9133bb46e88bcbe39cd7ef0e761'],
})

store.on('block', function(state){
  console.log(state)
})