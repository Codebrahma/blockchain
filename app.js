#!/usr/bin/env node

const async      = require('async');
const program = require('commander');
const BlockChain = require('./model/blockchain.js');

let blockchain; 
async.series([
  function(callback){
    blockchain = new BlockChain(callback);
  },
  function(callback){
    initializeCLI(callback);
  }
],function(err){
  console.log(err);
});


    
function initializeCLI(callback){
  program
    .version('0.0.1')
    .command('print')
    .description('print the blockchain')
    .action(function(req,optional){
      blockchain.print(callback);
    });

    program
      .command('add <data>')
      .description('add a blockchain')
      .action((data) => {
        blockchain.addBlock(data, callback);
      });

    program.parse(process.argv)
}