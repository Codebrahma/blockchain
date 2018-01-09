/*
  BlockChain network node Instance
*/

// DEPENDENCIES
const Q               = require('Q');
const _               = require('underscore');
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

  // Node list maintainer
  this.addressBook = new NodeList(selfAddress=NODE_SADDRESS);

  // Communication channel to talk to nmap server and download nodelist
  this.network = new Messenger(NODE_SADDRESS, NMAP_SADDRESS);

  // Communication channel to talk to other miners
  this.messenger = new Messenger(NODE_SADDRESS);

  // BlockChain TODO: handle chain ready
  this.blockchain = new BlockChain(DB_PATH);

  // Periodic Heartbeat to let nmap know you're alive
  const HEARTBEAT_DELAY = 30 * 1000;
  setInterval(()=> self.network.$send("heartbeat"), HEARTBEAT_DELAY);

  // Periodic update of fresh miner list from nmap
  const MINER_FETCH_DELAY = 60 * 1000;
  setInterval(() => self.network.$send("minerlist").then(l => self.addressBook.updateList(l)),
      MINER_FETCH_DELAY);

  // Node $init
  self.network.$send("minerlist")
  .then(l => Q.resolve(self.addressBook.updateList(l)) )
  .then(d  => self.network.$send("heartbeat")          )
  .then(d  => self.blockchain.$init()                  )
  .then(d  => self.network.$broadcast(self.addressBook, "version"))
  .then(function(v){
    v = _.filter(v, d => d && d.height > self.blockchain.height);
    if(v.length == 0) return [ ];
    let mNode = _.max(v, (d) => d.height);
    return self.messenger.$to(mNode.address, "blockchain", {
      upto: self.blockchain.height
    });
  })
  .then(blks => self.blockchain.$appendWithChain(blks)  )
  .then(function(){
    console.log("Network node initialized with genesis blockchain : " + self.blockchain.height);
  })
  .catch(function(e){
    console.log("Node init error : " + e);
  });
};


Node.prototype.listen = function(){
  let self = this;

  console.log("Node now online :" + this.address);
  let node = new MessageHandler(this.address);
  node.listen();

  // Node events
  node.on("version", function(d){
    return { height: self.blockchain.height, address: self.address };
  });

  // TODO: Handle blockchain FORK
  node.on("newblock",    d => self.blockchain.appendStreamBlock(d.data));

  node.on("transaction", d => self.onTransaction(d));

  node.on("blockchain",  d => {
    console.log("Blockchain request : " + d.data.upto);
    return self.blockchain.$getBlocksUpto(d.data.upto);
  });
};

Node.prototype.onTransaction = () => { };

module.exports = Node;
