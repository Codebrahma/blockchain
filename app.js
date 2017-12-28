const BlockChain = require('./model/blockchain.js');
const async      = require('async');

let blockchain;
async.series([
  function(callback){
    blockchain = new BlockChain(callback);
  },
  function(callback){
    //blockchain.addBlock("Send 1 BTC to Satoshi", callback);
    callback(null);
  },
  function(callback){
    //blockchain.addBlock("Purchase coffee for 0.007", callback)
    callback(null);
  },
  function(callback){
    blockchain.print(callback)},
],function(err){
  console.log(err);
});