const EthStore = require('./index')
const ZeroClient = require('web3-provider-engine/zero')

const provider = web3.currentProvider
const blockTracker = new EthBlockTracker({ provider })

const store = new EthStore(blockTracker, provider)

store.put('myBalance', {
  method: 'eth_getBalance',
  params: ['0x18a3462427bcc9133bb46e88bcbe39cd7ef0e761'],
})

store.on('block', function(state){
  // { myBalance: '0xabcd' }
  console.log(state)
})