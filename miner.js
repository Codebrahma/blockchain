/*
  MinerInstance
*/

// DEPENDENCIES
const Node            = require('./node.js');

// TODO: REQUIRES  TO BE SET Handle cleanly!
if(!process.env.BLOCKCHAIN_MINER){ throw("BLOCKCHAIN_MINER not set") }

let minerNode = new Node(type="miner");
minerNode.listen();

// Custom mining logic
minerNode.onTransaction = function(d){
  minerNode.blockchain.mineTransaction(d.data, function(b){
    console.log( b.serialize() );
    minerNode.network.$broadcast(minerNode.addressBook, "newblock", b.serialize());
  });
};
