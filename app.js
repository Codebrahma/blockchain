const BlockChain = require('./model/blockchain.js');

const blockchain = new BlockChain();


blockchain.$init()

  .then(function(){
    console.log("Block initialized")
    return blockchain.$addBlock("Send 1 BTC to Nithin");
  })

  .then(function(){
    console.log("Sent money")
    return blockchain.$print()
  })

  .then(function(){
    console.log("Transactions Successfully processed");
  }, function(e){
    console.log(e);
  });