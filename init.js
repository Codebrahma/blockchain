// Wallet server
const NODE_HOST     = process.env.NODE_HOST||"localhost";
const NODE_HPORT    = process.env.NODE_HPORT||8080;
const NODE_HADDRESS = NODE_HOST + ":" + NODE_HPORT;

const DB_PATH       = process.env.DB_PATH || "nodedb-"+NODE_HPORT;
const BlockChain    = require('./model/blockchain.js');
const Block         = require('./model/block.js');
const Wallet        = require('./model/wallet.js');

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

{
  // Datastore path
  const WDB_PATH      = process.env.WDB_PATH || "walletdb-"+NODE_HPORT;
  // Initialize wallet DB
  Wallet.init(WDB_PATH);
  // Initialize walletID
  new Wallet("0404b567f7216b4acb73d7f37bbaff70fd7e46ec772216d26cee262c212c86059587a373b0b8cb4fa7641e7f88274557a1b915f8f6fbf0cf5b4c84545baa16e629",
              "87d672b4f7172654c6ebe2bd997ab18097ffc8db230bddd80995fd9fca9540b2").$init();
};
