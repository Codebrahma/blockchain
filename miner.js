/*
  MinerInstance
*/

// DEPENDENCIES
const Messenger       = require('./util/message.js').Messenger;
const MessageHandler  = require('./util/message.js').MessageHandler;
const NodeList        = require('./util/nlist.js');
// const BlockChain = require('./model/blockchain.js');
// const Wallet     = require('./model/wallet.js');

const NODE_HOST    = process.env.NODE_HOST||"localhost";
const NODE_PORT    = process.env.NODE_PORT||"3000";
const NODE_SADDRESS= NODE_HOST + ":" + NODE_PORT;
const NMAP_HOST  = process.env.NMAP_HOST    ||"localhost";
const NMAP_SPORT = process.env.NMAP_SPORT   ||"9999";
const NMAP_HPORT = process.env.NMAP_SPORT   ||"8888";
const NMAP_SADDRESS = NMAP_HOST + ":" + NMAP_SPORT;
const NMAP_HADDRESS = NMAP_HOST + ":" + NMAP_HPORT;

(function(){

  // Node list maintainer
  let nl = new NodeList(selfAddress=NODE_SADDRESS);

  // Communication channel to talk to nmap server
  let nmapMesseger = new Messenger(NODE_SADDRESS, NMAP_SADDRESS);

  // Communication channel to talk to other miners
  let myMesseger = new Messenger(NODE_SADDRESS);


  // Periodic Heartbeat to let nmap know you're alive
  const HEARTBEAT_DELAY = 25 * 1000;
  setInterval(()=> nmapMesseger.$send("heartbeat"), HEARTBEAT_DELAY);

  // Periodic update of fresh miner list from nmap
  const MINER_FETCH_DELAY = 60 * 1000;
  setInterval(() => nmapMesseger.$send("minerlist").then(l => nl.updateList(l)),
      MINER_FETCH_DELAY);

  console.log("Miner listening");
  miner = new MessageHandler(NODE_SADDRESS);
  miner.listen();

  // Listen for broadcast transactions
  miner.on("newblock", function(d){
    console.log("NEW BLOCK ADDED TO BLOCK CHAIN");
    // choose to update local block chain
  });

  // Listen for broadcast transactions
  miner.on("transaction", function(d){
    console.log("TRANSACTION PUBLISHED IN THE NETWORK");
    // choose to mine block
  });

  // To broadcast message to other miners in node_list
  // myMesseger.$broadcast(nl, "transaction", { block data })
}());
