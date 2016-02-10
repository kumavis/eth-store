const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const async = require('async')
const clone = require('clone')
const EthQuery = require('./query')

module.exports = EthereumStore


inherits(EthereumStore, EventEmitter)
function EthereumStore(engine) {
  const self = this
  EventEmitter.call(self)
  self._currentState = {
    accounts: {},
    transactions: {},
  }
  self._query = new EthQuery(engine)

  engine.on('block', self._updateForBlock.bind(self))
}

//
// public
//

EthereumStore.prototype.getState = function(){
  const self = this
  return clone(self._currentState)
}

EthereumStore.prototype.addAccount = function(address){
  const self = this
  self._currentState.accounts[address] = {}
  if (!self.currentBlockNumber) return
  self._updateAccountForBlock(self.currentBlockNumber, address, noop)
}

EthereumStore.prototype.removeAccount = function(address){
  const self = this
  delete self._currentState.accounts[address]
}

EthereumStore.prototype.addTransaction = function(txHash){
  const self = this
  self._currentState.transactions[txHash] = {}
  if (!self.currentBlockNumber) return
  self._updateTransaction(self.currentBlockNumber, txHash, noop)
}

EthereumStore.prototype.removeTransaction = function(address){
  const self = this
  delete self._currentState.transactions[address]
}


//
// private
//

EthereumStore.prototype._updateForBlock = function(block) {
  const self = this
  var blockNumber = '0x'+block.number.toString('hex')
  self.currentBlockNumber = blockNumber
  async.parallel([
    self._updateAccountsForBlock.bind(self, blockNumber),
    self._updateTransactions.bind(self, blockNumber),
  ], function(err){
    if (err) return console.error(err)
    self.emit('block', self.getState())
  })
}

EthereumStore.prototype._updateAccountsForBlock = function(block, cb) {
  const self = this
  var accountsState = self._currentState.accounts
  var addresses = Object.keys(accountsState)
  async.each(addresses, self._updateAccountForBlock.bind(self, block), cb)
}

EthereumStore.prototype._updateAccountForBlock = function(block, address, cb) {
  const self = this
  var accountsState = self._currentState.accounts
  self._query.getAccount(address, block, function(err, result){
    if (err) return cb(err)
    result.address = address
    accountsState[address] = result
    cb(null, result)
  })
}

EthereumStore.prototype._updateTransactions = function(block, cb) {
  const self = this
  var transactionsState = self._currentState.transactions
  var txHashes = Object.keys(transactionsState)
  async.each(txHashes, self._updateTransaction.bind(self, block), cb)
}

EthereumStore.prototype._updateTransaction = function(block, txHash, cb) {
  const self = this
  // would use the block here to determine how many confirmations the tx has
  var transactionsState = self._currentState.transactions
  self._query.getTransaction(txHash, function(err, result){
    if (err) return cb(err)
    transactionsState[txHash] = result
    cb(null, result)
  })
}

function valuesFor(obj){
  return Object.keys(obj).map(function(key){ return obj[key] })
}

function noop(){}