#!/usr/bin/env node

/**
 * DEPRECATED : Broken into NMAP / MINER / WALLET
 * WILL SOON GO AWAY!!!
 */

const BlockChain = require('./model/blockchain.js');
const Wallet     = require('./model/wallet.js');
const program    = require('commander');
const net        = require('net');
const _          = require('underscore');


const node_id       = process.env.NODE_ID;
const NODE_HOST     = process.env.NODE_HOST || "localhost";
const NODE_SADDRESS = NODE_HOST + ":" + node_id;
const DB_PATH       = process.env.DB_PATH + '/' + node_id;

//FOR NMAP ONLY!!
const NMAP_HOST     = process.env.NMAP_HOST||"localhost";
const NMAP_SPORT    = process.env.NMAP_SPORT||"9999";
const NMAP_HPORT    = process.env.NMAP_HPORT||"8888";
const NMAP_SADDRESS = NMAP_HOST + ":" + NMAP_SPORT;
const NMAP_HADDRESS = NMAP_HOST + ":" + NMAP_HPORT;


const Messenger       = require('./util/message.js').Messenger;
const NodeList        = require('./util/nlist.js');

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
      const blockchain = new BlockChain(DB_PATH);
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

      Wallet.init(DB_PATH);
      Wallet.fetch(data.from).then((w)=>{
        const blockchain = new BlockChain(DB_PATH);
        return blockchain.$newUTXOTransaction(data, w.privateKey)
      }).then((tx)=>{
        let network     = new Messenger(NODE_SADDRESS, NMAP_SADDRESS)
        
        network.$send("minerlist")
          .then(l => {
           if(_.isEmpty(l)) {
             console.log("No miners available");
             return ;
            }
           let randomNode =  _.keys(l)[ 0 ];
           let messenger  = new Messenger(NODE_SADDRESS, randomNode);
           console.log(randomNode);
           messenger.$send("transaction", tx.serialize()).then(success("Transaction sent"));
          });
      });
    });

  program
    .command('balance [options]')
    .description('balance of the address')
    .option('-a, --address [address]', 'balance of?')
    .action((req, options) => {
      const blockchain = new BlockChain(DB_PATH);
      blockchain.$getBalance(options.address)
        .then(function(b){
          console.log("BALANCE of " + options.address + " is " + b);
        }, exception("FAILED balance"));
    });

  program
    .command('createWallet')
    .description('make a new wallet')
    .action((req, options) => {
      Wallet.init(DB_PATH);
      new Wallet().$save().then(function(d){
        console.log("WALLET_CREATED  " +  d[ 0 ] );
      })
      .catch(function(e){
        console.log("WALLET_CREATION_ERROR");
      });
    });

  program
    .command('getPrivKey [options]')
    .description('make a new wallet')
    .option('-k, --key [key]', 'public key')
    .action((req, options) => {
      Wallet.init(DB_PATH);
      Wallet.fetch(options.key).then(function(w){
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
      const blockchain = new BlockChain(DB_PATH);
      if(MA){
        blockchain.$createGenesis().then(success("Blockchain genesis block initialized"))
        .catch((e)=>console.log(e));
      }
    });


  program.parse(process.argv);
};

initializeCLI();