#!/usr/bin/env node
 
/**
 * Module dependencies.
 */
 
const BlockChain = require('./model/blockchain.js');
const Wallet     = require('./model/wallet.js').Wallet;
const program    = require('commander');

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
      blockchain.$addBlock( data ).then(success("SUCCESS Add Block"), exception("FAILED Add Block"));
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
      let w = new Wallet();
      //TODO should store in seperate bucket
      blockchain._chain.$put('key_'+w.pubKey, w.privateKey).then(()=>{
        console.log("This is your public key store it safely");
        console.log(w.pubKey);
      });
    });

  program
    .command('getPrivKey [options]')
    .description('make a new wallet')
    .option('-k, --key [key]', 'public key')
    .action((req, options) => {
      console.log(options.key);
      //TODO should store in seperate bucket
      blockchain._chain.$get('key_'+options.key).then((x)=>{
        console.log(x);
      });
    });

  program.parse(process.argv);
};

const blockchain = new BlockChain();
blockchain.$init().then(initializeCLI, exception("FAILED TO Initialize CLI"));