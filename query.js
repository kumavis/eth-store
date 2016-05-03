const extend = require('xtend')
const async = require('async')
const ethUtil = require('ethereumjs-util')

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

EthQuery.prototype.getBlockByHashWithUncles = function(blockHash, cb){
  const self = this
  self.getBlockByHash(blockHash, function(err, block){
    if (err) return cb(err)
    if (!block) return cb(null, null)
    var count = block.uncles.length
    async.times(count, function(index, cb){
      self.getUncleByBlockHashAndIndex(blockHash, ethUtil.intToHex(index), cb)
    }, function(err, uncles){
      if (err) return cb(err)
      block.uncles = uncles
      cb(null, block)
    })
  })
}

EthQuery.prototype.getBlockByNumberWithUncles = function(blockNumber, cb){
  const self = this
  self.getBlockByNumber(blockNumber, function(err, block){
    if (err) return cb(err)
    if (!block) return cb(null, null)
    var count = block.uncles.length
    async.times(count, function(index, cb){
      self.getUncleByBlockHashAndIndex(block.hash, ethUtil.intToHex(index), cb)
    }, function(err, uncles){
      if (err) return cb(err)
      block.uncles = uncles
      cb(null, block)
    })
  })
}


// rpc level

EthQuery.prototype.getBlockByNumber = function(blockNumber, cb){
  const self = this
  self.sendAsync({
    method: 'eth_getBlockByNumber',
    params: [blockNumber, true],
  }, cb)
}

EthQuery.prototype.getBlockByHash = function(blockHash, cb){
  const self = this
  self.sendAsync({
    method: 'eth_getBlockByHash',
    params: [blockHash, true],
  }, cb)
}

EthQuery.prototype.getUncleCountByBlockHash = function(blockHash, cb){
  const self = this
  self.sendAsync({
    method: 'eth_getUncleCountByBlockHash',
    params: [blockHash],
  }, cb)
}

EthQuery.prototype.getUncleByBlockHashAndIndex = function(blockHash, index, cb){
  const self = this
  self.sendAsync({
    method: 'eth_getUncleByBlockHashAndIndex',
    params: [blockHash, index],
  }, cb)
}

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
    // console.log(opts, response)
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