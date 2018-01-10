// Wallet server
const NODE_PORT     = process.env.NODE_PORT||"3000";

const DB_PATH       = process.env.DB_PATH || "nodedb-"+NODE_PORT;
const BlockChain    = require('./model/blockchain.js');
const Block         = require('./model/block.js');
const Wallet        = require('./model/wallet.js');
const logem         = require('logem');

blockchain = new BlockChain(DB_PATH);

blockchain.$init().then(function(){
    if(blockchain.height > 0){
      logem.warn("Blockchain already initialized");
      return;
    };
    // create genesis block
    let _gBlock = Block.getGenesisBlock();
    _gBlock.mine();

    // append block to the block chain
    return blockchain.$append(_gBlock).then(function(){
      logem.debug("Blockchian initialized");
    });
});
