/*
  Highlevel service which maintains the list of active miners
  Sends a heart-beat to each miner every 60s to check if they are active
*/
const WSocket      = require('./util/socket.js');
const http         = require('http');

const NMAP_HOST  = process.env.NMAP_HOST    ||"127.0.0.1";
const NMAP_SPORT = process.env.NMAP_SPORT   ||"9999";
const NMAP_HPORT = process.env.NMAP_SPORT   ||"8888";
const NMAP_SADDRESS = NMAP_HOST + ":" + NMAP_SPORT;
const NMAP_HADDRESS = NMAP_HOST + ":" + NMAP_HPORT;

const MAX_RESPONSE_DELAY = 200;

var liveNodes  = { };

var handleMsg = function(dt){
  if(!dt.command || !dt.address)
    return;
  switch(dt.command){
    case "register":
      liveNodes[dt.address] = dt;
      liveNodes[dt.address].requestTime = new Date();
      console.log("Registered node : " + dt.address);
      break;

    case "heartbeat":
      liveNodes[dt.address] = dt;
      liveNodes[dt.address].requestTime = new Date();
      console.log("Heartbeat node : " + dt.address);
      break;

    case "unregister":
      delete liveNodes[dt.address];
      console.log("Removed node : " + dt.address);
      break;

    default:
      throw("Invalid command");
      break;
  };
};

var checkActivity = function(){
  console.log("Periodic cleaning: Inactive connections being removed");

  let currentTime = new Date();
  let nodes = Object.keys(liveNodes);

  for(let nid in nodes){
    let address = nodes[nid];
    let node    = liveNodes[address];

    let minerClient = new WSocket(address);

    if(Math.abs(currentTime - node.requestTime) > MAX_RESPONSE_DELAY * 1000){
      delete liveNodes[address];
      console.log("Removed node : " + address);
    };
  };
};


(function(){

  // socket => register / deregister / heartbeat
  console.log("NMAP server started");
  console.log("Point miner to ws://" + NMAP_HOST + ":" + NMAP_SPORT);
  let nmap = new WSocket(NMAP_SADDRESS);
  nmap.startServer(handleMsg);

  // Cheack incoming Heartbeat
  setInterval(checkActivity, MAX_RESPONSE_DELAY/2.0 * 1000);

  // list live addresses
  console.log("To view active connections visit : http://" + NMAP_HOST + ":" +NMAP_HPORT);
  http.createServer(function (req, res) {
    let nodeList = JSON.stringify( Object.keys(liveNodes) );
    res.write(nodeList);
    res.end();
  }).listen(NMAP_HPORT);

}());
