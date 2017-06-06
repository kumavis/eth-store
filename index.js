/*

some design questions

- should we commit state immediately?
- should we emit events per key?

*/

const EventEmitter = require('events').EventEmitter
const inherits = require('util').inherits
const mapValues = require('async/mapValues')
const clone = require('clone')
const EthQuery = require('./query')

module.exports = EthereumStore


inherits(EthereumStore, EventEmitter)
function EthereumStore(blockTracker, provider) {
  EventEmitter.call(this)
  this._subscriptions = {}
  this._currentState = {}
  this._provider = provider
  this.query = (new EthQuery(provider))
  // TODO: never run more than one _updateForBlock at a time
  blockTracker.on('block', this._updateForBlock.bind(this))
}

//
// public
//

EthereumStore.prototype.getState = function(){
  return clone(this._currentState)
}

EthereumStore.prototype.get = function(key){
  return this._currentState[key]
}

EthereumStore.prototype.put = function(key, payload){
  this._subscriptions[key] = payload
  this._currentState[key] = undefined
  this._didUpdate()
  this._fetchUpdate(key, payload)
}

EthereumStore.prototype.del = function(key){
  delete this._subscriptions[key]
  delete this._currentState[key]
  this._didUpdate()
}

EthereumStore.prototype.clear = function(){
  this._subscriptions = {}
  this._currentState = {}
  this._didUpdate()
}

EthereumStore.prototype.subscribe = function(handler){
  this.on('update', handler)
}


//
// private
//

EthereumStore.prototype._didUpdate = function() {
  const state = this.getState()
  this.emit('update', state)
}

EthereumStore.prototype._didUpdateBlock = function() {
  const state = this.getState()
  this.emit('block', state)
}

EthereumStore.prototype._updateForBlock = function(block) {
  const blockNumber = '0x'+block.number.toString('hex')
  mapValues(this._subscriptions, (payload, key, cb) => this._fetchUpdate(key, payload, cb), (err, newState) => {
    if (err) return console.error(err)
    this._currentState = newState
    this._didUpdateBlock()
  })
}

// TODO: should lock to specified block
EthereumStore.prototype._fetchUpdate = function(key, payload, cb){
  cb = cb || noop
  this.query.sendAsync(payload, (err, result) => {
    if (err) return cb(err)
    this._currentState[key] = result
    this._didUpdate()
    cb(null, result)
  })
}

// util

function valuesFor(obj){
  return Object.keys(obj).map(function(key){ return obj[key] })
}

function noop(){}