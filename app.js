#!/usr/bin/env node
 
/**
 * Module dependencies.
 */
 
const BlockChain = require('./model/blockchain.js');
const program    = require('commander');

function initializeCLI(){
  program
    .version('0.0.1')

  program
    .command('print [options]')
    .description('print the blockchain')
    .option('-v, --verbose [va]', 'Verbose printing true?')
    .action(function(req, options){
      blockchain.$print(options.verbose);
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
      blockchain.$addBlock( JSON.stringify(data) );
    });

  program.parse(process.argv);
};

const blockchain = new BlockChain();
blockchain.$init().then(initializeCLI);