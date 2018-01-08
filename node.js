/*
  BlockChain network node Instance
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
const DB_PATH       = process.env.DB_PATH || "nodedb-"+NODE_PORT;

function Node(type="miner"){
  let self = this;

  this.address = NODE_SADDRESS;
  this.type    = type;

  // BlockChain TODO: handle chain ready
  this.blockchain = new BlockChain(DB_PATH);
  this.blockchain.$init().then(function(){
    console.log("Blockchain initialized :" + self.blockchain.height);
  });

  // Node list maintainer
  this.addressBook = new NodeList(selfAddress=NODE_SADDRESS);

  // Communication channel to talk to nmap server and download nodelist
  this.network = new Messenger(NODE_SADDRESS, NMAP_SADDRESS);
  // this.network.$send("heartbeat")
  this.network.$send("minerlist").then(l => self.addressBook.updateList(l));

  // Periodic Heartbeat to let nmap know you're alive
  const HEARTBEAT_DELAY = 30 * 1000;
  setInterval(()=> self.network.$send("heartbeat"), HEARTBEAT_DELAY);

  // Periodic update of fresh miner list from nmap
  const MINER_FETCH_DELAY = 60 * 1000;
  setInterval(() => self.network.$send("minerlist").then(l => self.addressBook.updateList(l)),
      MINER_FETCH_DELAY);

  // Communication channel to talk to other miners
  this.messenger = new Messenger(NODE_SADDRESS);
};


Node.prototype.listen = function(){
  let self = this;

  console.log("Node now online :" + this.address);
  let node = new MessageHandler(this.address);
  node.listen();

  // Node events
  node.on("version", d => self.blockchain.height);

  // TODO: Handle blockchain FORK
  node.on("newblock", d => self.blockchain.appendStreamBlock(d.data));

  node.on("transaction", d => self.onTransaction(d));
};

Node.prototype.onTransaction = () => { };

module.exports = Node;
