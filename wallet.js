#!/usr/bin/env node
const Messenger  = require('./util/message.js').Messenger;
const NodeList   = require('./util/nlist.js');
const Wallet     = require('./model/wallet.js');
const program    = require('commander');

const NMAP_HOST  = process.env.NMAP_HOST    ||"localhost";
const NMAP_SPORT = process.env.NMAP_SPORT   ||"9999";
const NMAP_HPORT = process.env.NMAP_SPORT   ||"8888";
const NMAP_SADDRESS = NMAP_HOST + ":" + NMAP_SPORT;
const NMAP_HADDRESS = NMAP_HOST + ":" + NMAP_HPORT;

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
    .command('create')
    .description('make a new wallet')
    .action((req, options) => {
      new Wallet().$init().then(function(d){
        console.log("This is your public key store it safely");
        console.log(d[0]);
      }, exception("FAILED Create Wallet"));
    });

  program
    .command('getPrivKey [options]')
    .description('check private key')
    .option('-k, --key [key]', 'public key')
    .action((req, options) => {
      Wallet.$fetch(options.key).then(function(w){
        console.log("Your private key is");
        console.log(w.privateKey);
      });
    });

  program
    .command('send')
    .description('send coins between accounts')
    .option('-f, --from [from]', 'From which account?')
    .option('-t, --to [to]', 'to which account?')
    .option('-a, --amount [amount]', 'what is the amount?')
    .action(function(req, options){
      var data = {
        from   : req.from,
        to     : req.to,
        amount : req.amount,
      };

      let nl = new NodeList();
      let nmapMesseger = new Messenger(NMAP_SADDRESS);

      // TODO: FIX Broadcast/Send not returning, potential memory leak!
      // Retrieve list of active miners in the network
      nmapMesseger.$send("minerlist")
        .then(function(l){
          nl.updateList(l);

          // Publish transaction to the network
          return nmapMesseger.$broadcast(nl, "transaction", data)
        })

        .then(function(){
          console.log("Yay! Transaction has been published to the blockchain network");
        });
    });

  program.parse(process.argv);
};

initializeCLI();
