const BlockChain = require('./model/blockchain.js');

const blockchain = new BlockChain();
blockchain.addBlock("Send 1 BTC to Nithin")
blockchain.addBlock("Send 2 BTC to Nithin")
blockchain.print();