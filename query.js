const extend = require('xtend')
const async = require('async')

module.exports = EthQuery


function EthQuery(provider){
  const self = this
  self.currentProvider = provider
}

// higher level

EthQuery.prototype.getAccount = function(address, block, cb){
  const self = this
  block = block || 'latest'
  async.parallel({
    balance: self.getBalance.bind(self, address, block),
    nonce: self.getNonce.bind(self, address, block),
    code: self.getCode.bind(self, address, block),
  }, cb)
}

// rpc level

EthQuery.prototype.getTransaction = function(txHash, cb){
  const self = this
  self.sendAsync({
    method: 'eth_getTransactionByHash',
    params: [txHash],
  }, cb)
}

EthQuery.prototype.getBalance = function(address, block, cb){
  const self = this
  block = block || 'latest'
  self.sendAsync({
    method: 'eth_getBalance',
    params: [address, block],
  }, cb)
}

EthQuery.prototype.getNonce = function(address, block, cb){
  const self = this
  block = block || 'latest'
  self.sendAsync({
    method: 'eth_getTransactionCount',
    params: [address, block],
  }, cb)
}

EthQuery.prototype.getCode = function(address, block, cb){
  const self = this
  block = block || 'latest'
  self.sendAsync({
    method: 'eth_getCode',
    params: [address, block],
  }, cb)
}

// network level

EthQuery.prototype.sendAsync = function(opts, cb){
  const self = this
  // console.log('sendAsync:', opts)
  self.currentProvider.sendAsync(createPayload(opts), function(err, response){
    err = err || response.error
    if (err) return cb(err)
    cb(null, response.result)
  })
}


// util

function createPayload(data){
  return extend({
    // defaults
    id: createRandomId(),
    jsonrpc: '2.0',
    params: [],
    // user-specified
  }, data)
}

function createRandomId(){
  const extraDigits = 3
  // 13 time digits
  var datePart = new Date().getTime()*Math.pow(10, extraDigits)
  // 3 random digits
  var extraPart = Math.floor(Math.random()*Math.pow(10, extraDigits))
  // 16 digits
  return datePart+extraPart
}