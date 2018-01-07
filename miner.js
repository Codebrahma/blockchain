/*
  MinerInstance
*/

// DEPENDENCIES
const Messenger       = require('./util/message.js').Messenger;
const MessageHandler  = require('./util/message.js').MessageHandler;
const NodeList        = require('./util/nlist.js');
const BlockChain      = require('./model/blockchain.js');

const NODE_HOST     = process.env.NODE_HOST||"localhost";
const NODE_PORT     = process.env.NODE_PORT||"3000";
const NODE_SADDRESS = NODE_HOST + ":" + NODE_PORT;
const NMAP_HOST     = process.env.NMAP_HOST||"localhost";
const NMAP_SPORT    = process.env.NMAP_SPORT||"9999";
const NMAP_HPORT    = process.env.NMAP_SPORT||"8888";
const NMAP_SADDRESS = NMAP_HOST + ":" + NMAP_SPORT;
const NMAP_HADDRESS = NMAP_HOST + ":" + NMAP_HPORT;
const DB_PATH       = process.env.DB_PATH || "minerdb-"+NODE_PORT;

// TODO: REQUIRES  TO BE SET Handle cleanly!
if(!process.env.BLOCKCHAIN_MINER){ throw("BLOCKCHAIN_MINER not set") }
if(!process.env.BLOCK_DIFFICULTY){ throw("BLOCK_DIFFICULTY not set") }

let minerAction = function(){

  // Node list maintainer
  let nl = new NodeList(selfAddress=NODE_SADDRESS);

  // Communication channel to talk to nmap server
  let nmapMesseger = new Messenger(NODE_SADDRESS, NMAP_SADDRESS);

  // Communication channel to talk to other miners
  let myMesseger = new Messenger(NODE_SADDRESS);

  nmapMesseger.$send("minerlist").then(l => nl.updateList(l));
  // Periodic Heartbeat to let nmap know you're alive
  const HEARTBEAT_DELAY = 30 * 1000;
  setInterval(()=> nmapMesseger.$send("heartbeat"), HEARTBEAT_DELAY);

  // Periodic update of fresh miner list from nmap
  const MINER_FETCH_DELAY = 60 * 1000;
  setInterval(() => nmapMesseger.$send("minerlist").then(l => nl.updateList(l)),
      MINER_FETCH_DELAY);

  console.log("MINER_LISTENING");
  miner = new MessageHandler(NODE_SADDRESS);
  miner.listen();

  // Listen for broadcast transactions
  miner.on("newblock", function(d){
    // verify and update the local blockchain
    console.log("NEW_BLOCK_RECIEVED");
    blockchain.$appendStreamBlock(d.data).then(function(){
      console.log("APPENDED_RECIEVED_BLOCK");
    }, function(){
      console.log("DISCARDED_RECIEVED_BLOCK");
    });
  });

  // Listen for broadcast transactions
  miner.on("transaction", function(d){
    // FIFO miner
    console.log("MINING_NEW_TRANSACTION");
    blockchain.$addBlock(d.data)
      .then(function(b){
        console.log("BLOCKCHAIN_UPDATED");
        myMesseger.$broadcast(nl, "newblock", b.serialize());
      })
      .then(function(){
        console.log("BROADCASTING_TO_NETWORK");
      }).catch(function(e){
        console.log("OPERATION_FAILED");
        console.log(e);
      });
  });
};

// BlockChain
let blockchain = new BlockChain(DB_PATH);
blockchain.$init().then(minerAction);
