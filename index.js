/*

some design questions

- should we commit state immediately?
- should we emit events per key?

*/

const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const async = require('async')
const clone = require('clone')
const EthQuery = require('./query')

module.exports = EthereumStore


inherits(EthereumStore, EventEmitter)
function EthereumStore(blockTracker, provider) {
  const self = this
  EventEmitter.call(self)
  self._subscriptions = {}
  self._currentState = {}
  self._provider = provider
  self.query = (new EthQuery(provider))
  // TODO: never run more than one _updateForBlock at a time
  blockTracker.on('block', self._updateForBlock.bind(self))
}

//
// public
//

EthereumStore.prototype.getState = function(){
  const self = this
  return clone(self._currentState)
}

EthereumStore.prototype.get = function(key){
  const self = this
  return self._currentState[key]
}

EthereumStore.prototype.put = function(key, payload){
  const self = this
  self._subscriptions[key] = payload
  self._currentState[key] = undefined
  self._didUpdate()
  self._makeRequest(key, payload)
}

EthereumStore.prototype.del = function(key){
  const self = this
  delete self._subscriptions[key]
  delete self._currentState[key]
  self._didUpdate()
}


//
// private
//

EthereumStore.prototype._didUpdate = function() {
  const self = this
  var state = self.getState()
  self.emit('update', state)
}

EthereumStore.prototype._didUpdateBlock = function() {
  const self = this
  var state = self.getState()
  self.emit('block', state)
}

EthereumStore.prototype._updateForBlock = function(block) {
  const self = this
  var blockNumber = '0x'+block.number.toString('hex')
  self.currentBlockNumber = blockNumber
  async.map(Object.keys(self._subscriptions), function(key, cb){
    // console.log('async.map', arguments)
    var payload = self._subscriptions[key]
    if (!payload) return cb()
    self._makeRequest(key, payload, cb)
  }, function(err, newState){
    if (err) return console.error(err)
    // self._currentState = newState
    self._didUpdateBlock()
  })
}

// TODO: should lock to specified block
EthereumStore.prototype._makeRequest = function(key, payload, cb){
  // console.log('_makeRequest', arguments)
  const self = this
  cb = cb || noop
  self.query.sendAsync(payload, function(err, result){
    if (err) return cb(err)
    self._currentState[key] = result
    cb(null, result)
  })
}

// util

function valuesFor(obj){
  return Object.keys(obj).map(function(key){ return obj[key] })
}

function noop(){}