const NODE_PORT     = process.env.NODE_PORT||"3000";
const DB_PATH       = process.env.DB_PATH || "nodedb-"+NODE_PORT;
const BlockChain    = require('./model/blockchain.js');
const Block         = require('./model/block.js');

blockchain = new BlockChain(DB_PATH);

blockchain.$init().then(function(){
    if(blockchain.height > 0){
      console.log("Blockchain already initialized");
      return;
    };
    // create genesis block
    let _gBlock = Block.getGenesisBlock();
    // append block to the block chain
    return blockchain.$append(_gBlock).then(function(){
      console.log("Blockchian initialized");
    });
});
