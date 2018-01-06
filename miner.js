/*
  MinerInstance
*/

// DEPENDENCIES
const Message         = require('./util/message.js').Message;
const MessageHandler  = require('./util/message.js').MessageHandler;
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

const HEARTBEAT_DELAY = 300;

// Heartbeat
var sendHeartBeat = function(){
  console.log('Hearbeat to nmap : ' + NMAP_SADDRESS);
  let m = new Message(NODE_SADDRESS, NMAP_SADDRESS);
  m.$send("heartbeat");
};
setInterval(sendHeartBeat, HEARTBEAT_DELAY * 1000);

console.log("Miner listening");
minerMsgHdlr = new MessageHandler(NODE_SADDRESS);
minerMsgHdlr.listen();
