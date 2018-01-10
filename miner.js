/*
  MinerInstance
*/

// DEPENDENCIES
const Node            = require('./node.js');
const logem           = require('logem');

// TODO: REQUIRES  TO BE SET Handle cleanly!
if(!process.env.BLOCKCHAIN_MINER){ throw("BLOCKCHAIN_MINER not set") }

let minerNode = new Node(type="miner");
minerNode.listen();

// Custom mining logic
minerNode.onTransaction = function(d){
  logem.debug("New transaction received");
  minerNode.blockchain.mineTransaction(d.data, function(b){
    minerNode.network.$broadcast(minerNode.addressBook, "newblock", b.serialize());
  });
};
