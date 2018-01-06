/*
  Highlevel service which maintains the list of active miners
  Unregisters miners within 60s of no heartbeat
*/
const MessageHandler  = require('./util/message.js').MessageHandler;
const http            = require('http');

const NMAP_HOST  = process.env.NMAP_HOST    ||"localhost";
const NMAP_SPORT = process.env.NMAP_SPORT   ||"9999";
const NMAP_HPORT = process.env.NMAP_SPORT   ||"8888";
const NMAP_SADDRESS = NMAP_HOST + ":" + NMAP_SPORT;
const NMAP_HADDRESS = NMAP_HOST + ":" + NMAP_HPORT;

const MAX_RESPONSE_DELAY = 600;

function NodeList(){
  this.list = { };
};

NodeList.prototype = {
  register: function(dt){
    this.list[dt.from] = dt;
    this.list[dt.from].requestTime = new Date();
    console.log("Registered node : " + dt.from);
  },
  unregister: function(dt){
    delete this.list[dt.from];
    console.log("Removed node : " + dt.from);
  },
  unregisterInActive: function(){
    console.log("Inactive connections being removed");
    let currentTime = new Date();
    let nodes = Object.keys(this.list);
    for(let nid in nodes){
      let address = nodes[nid];
      let node    = this.list[address];
      if(Math.abs(currentTime - node.requestTime) > MAX_RESPONSE_DELAY * 1000){
        delete this.list[address];
        console.log("Removed node : " + address);
      };
    };
  },
};


(function(){
  let nl = new NodeList();
  // socket => register / unregister / heartbeat
  console.log("NMAP listening");
  let nmapMsgHdlr = new MessageHandler(NMAP_SADDRESS);
  nmapMsgHdlr.on("register"  , (d)=> nl.register(d)  );
  nmapMsgHdlr.on("heartbeat" , (d)=> nl.register(d)  );
  nmapMsgHdlr.on("unregister", (d)=> nl.unregister(d));
  nmapMsgHdlr.listen();

  // Periodically remove inactive connections
  setInterval(() => nl.unregisterInActive(), MAX_RESPONSE_DELAY/2.0 * 1000);

  // list live addresses
  console.log("To view active connections visit : http://" + NMAP_HOST + ":" +NMAP_HPORT);
  http.createServer(function (req, res) {
    let nodeList = JSON.stringify( Object.keys(nl.list) );
    res.write(nodeList);
    res.end();
  }).listen(NMAP_HPORT);

}());
