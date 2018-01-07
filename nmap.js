/*
  Highlevel service which maintains the list of active miners
  Unregisters miners within 60s of no heartbeat
*/
const MessageHandler  = require('./util/message.js').MessageHandler;
const NodeList        = require('./util/nlist.js');
const http            = require('http');

const NMAP_HOST  = process.env.NMAP_HOST    ||"localhost";
const NMAP_SPORT = process.env.NMAP_SPORT   ||"9999";
const NMAP_HPORT = process.env.NMAP_SPORT   ||"8888";
const NMAP_SADDRESS = NMAP_HOST + ":" + NMAP_SPORT;
const NMAP_HADDRESS = NMAP_HOST + ":" + NMAP_HPORT;


(function(){
  let nl = new NodeList(selfAddress=NMAP_SADDRESS, INACTIVITY=180 * 1000);
  // socket => register / unregister / heartbeat
  console.log("NMAP listening");
  let nmapMsgHdlr = new MessageHandler(NMAP_SADDRESS);
  nmapMsgHdlr.on("register"  , (d)=> nl.register(d)  );
  nmapMsgHdlr.on("heartbeat" , (d)=> nl.register(d)  );
  nmapMsgHdlr.on("unregister", (d)=> nl.unregister(d));
  nmapMsgHdlr.on("minerlist" , (d)=> nl.list         );
  // nl.list
  nmapMsgHdlr.listen();

  // list live addresses
  console.log("To view active connections visit : http://" + NMAP_HOST + ":" +NMAP_HPORT);
  http.createServer(function (req, res) {
    let nodeList = JSON.stringify( Object.keys(nl.list) );
    res.write(nodeList);
    res.end();
  }).listen(NMAP_HPORT);

}());
