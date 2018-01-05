#!/usr/bin/env node

/**
 * Module dependencies.
 */

const BlockChain = require('./model/blockchain.js');
const Wallet     = require('./model/wallet.js');
const program    = require('commander');
const net        = require('net');

const node_id     = process.env.NODE_ID;
const nodeAddress = "localhost:" + node_id;

function exception(msg){
  return function(e){
    console.log(msg);
    console.error(e);
    console.trace();
  };
};
function success(msg){
  return function(){ console.log(msg); };
};

function initializeCLI(){
  console.log("INITIALIZING CLI");

  program
    .version('0.0.1')

  program
    .command('print [options]')
    .description('print the blockchain')
    .option('-v, --verbose [va]', 'Verbose printing true?')
    .action(function(req, options){
      blockchain.$print(options.verbose)
        .then(success("SUCCESS Chain Print"),exception("FAILED Chain Print"));
    });

  program
    .command('add')
    .description('add a block to blockchain')
    .option('-f, --from [from]', 'From which account?')
    .option('-t, --to [to]', 'to which account?')
    .option('-a, --amount [amount]', 'what is the amount?')
    .action(function(req, options){
      var data = {
        from   : req.from,
        to     : req.to,
        amount : req.amount,
      };

      Wallet.$fetch(data.from).then(function(w){
        blockchain.$newUTXOTransaction(data, w.privateKey).then((tx)=>{
          sendTo(knownNodes[0], {command: "newTx", payload: tx});
        });
      })
      //.then(success("SUCCESS Add Block"), exception("FAILED Add Block"));
    });

  program
    .command('balance [options]')
    .description('balance of the address')
    .option('-a, --address [address]', 'balance of?')
    .action((req, options) => {
      blockchain.$getBalance(options.address)
        .then(function(b){
          console.log("BALANCE of " + options.address + " is " + b);
        }, exception("FAILED balance"));
    });

  program
    .command('createWallet')
    .description('make a new wallet')
    .action((req, options) => {
      new Wallet().$init().then(function(d){
        console.log("This is your public key store it safely");
        console.log(d[0]);
      }, exception("FAILED Create Wallet"));
    });

  program
    .command('getPrivKey [options]')
    .description('make a new wallet')
    .option('-k, --key [key]', 'public key')
    .action((req, options) => {
      Wallet.$fetch(options.key).then(function(w){
        console.log("Your private key is");
        console.log(w.privateKey);
      });
    });

  program
    .command('initChain [options]')
    .description('initialize the chain')
    .option('-MA, --minerAddress [MA]', 'miner address')
    .action((req, options)=>{
      var MA = options.minerAddress;
      process.env.BLOCKCHAIN_MINER = MA;
      if(MA){
        blockchain.$init().then(success("Blockchain genesis block initialized"));
      }
    });
  
  program
    .command('startNode [options]')
    .description('start the node')
    .option('-MA, --minerAddress [MA]', 'miner address')
    .action((req, options)=>{
      console.log(nodeAddress);

      var knownNodes  = [];
      knownNodes[0]   = "localhost:3000";
      var MA          = options.minerAddress;

      var server = net.createServer(function(socket) {
        socket.on('data', function(data){
          var data = data.toString();
          console.log('Got Data');
          console.log(data);
          handleMsg(JSON.parse(data));
        });
      });
      
      server.listen(node_id, '127.0.0.1');
      if (nodeAddress != knownNodes[0]) {
        sendVersion(knownNodes[0]);
      }
    });

  program.parse(process.argv);
};

const blockchain = new BlockChain();
initializeCLI();


function sendTo(to, data){
  to = to.split(':')
  var client = new net.Socket();
  client.connect(to[1], to[0], function () {
    client.write(JSON.stringify(data));
  });
}


//SEND version from one node to the other and make then download the chain
function sendVersion(to){
  to = to.split(':')
  var client = new net.Socket();
  client.connect(to[1], to[0], function() {
    console.log('Connected');

    blockchain.$getHeight().then((height)=>{
      var result = {command: "version", payload: {height: height, from: nodeAddress}}
      client.write(JSON.stringify(result));
    });

    client.on('data', function (data) {
      console.log(data.toString());
    });
  });  
}

function handleMsg(msg){
  switch(msg.command){
    case "version":    
      handleVersion(msg.payload);
    case "getBlocks":
      handlegetBlocks(msg.payload);
    case "newTx":
      handlenewTx(msg.payload);
  }
}

function handleVersion(payload){
  blockchain.$getHeight().then((myHeight)=>{
    console.log(myHeight);
    if(myHeight < payload.height){
      getBlocks(payload.from);
    } else if(myHeight > payload.height) {
      sendVersion(payload.from);
    }
  });
}

function getBlocks(from){
  from = from.split(':')
  var client = new net.Socket();
  client.connect(to[1], to[0], function() {
    console.log('Connected');

    blockchain.$getHeight().then((height)=>{
      var result = {command: "getBlocks", payload: {height: height, from: nodeAddress}}
      client.write(JSON.stringify(result));
    });
  });  
}

function handlegetBlocks(payload){
  var client = new net.Socket();
  var to = payload.from.split(':');
  console.log(to);
  blockchain.$getBlocksUpto(payload.height).then((blocks)=>{
    client.connect(to[1], to[0], function() {
      var result = {command: "Blocks", payload: {blocks: blocks, from: nodeAddress}}
      client.write(JSON.stringify(result));
      console.log("fix");
    });  
  }); ;
}

function handlenewTx(payload){
  blockchain.$addBlock(payload);
}