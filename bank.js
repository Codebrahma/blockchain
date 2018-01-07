/*
  This is a user facing service, analgous to the bank
  => Bank maintains the public ledger { blockchain }
  => Bank keeps the ledger up to date
  => Users can create an account{wallet} with the Bank
  => Bank assgins users an account number {wallet_id}
  => Bank keeps sensitive information safe {priv key}
  => Users approach the bank if he wants to send money {initiate a transaction}
  => Bank informs user on successful transaction
  => Bank informs user on his balance
*/
const express    = require('express');        // call express
const bodyParser = require('body-parser');

const Messenger       = require('./util/message.js').Messenger;
const MessageHandler  = require('./util/message.js').MessageHandler;
const NodeList   = require('./util/nlist.js');
const Wallet     = require('./model/wallet.js');
const BlockChain = require('./model/blockchain.js');

// NMap server
const NMAP_HOST     = process.env.NMAP_HOST||"localhost";
const NMAP_SPORT    = process.env.NMAP_SPORT||"9999";
const NMAP_SADDRESS = NMAP_HOST + ":" + NMAP_SPORT;

// Wallet server
const WALLET_HOST    = process.env.WALLET_HOST||"localhost";
const WALLET_HPORT   = process.env.WALLET_HPORT||8080;
const WALLET_SPORT   = process.env.WALLET_SPORT||8081;
const WALLET_SADDRESS= WALLET_HOST + ":" + WALLET_SPORT;
const WALLET_HADDRESS= WALLET_HOST + ":" + WALLET_HPORT;

// Datastore path
const WDB_PATH      = process.env.WDB_PATH || "walletdb-"+WALLET_SPORT;
const CDB_PATH      = process.env.CDB_PATH || "chaindb-"+WALLET_SPORT;

// BlockChain
let blockchain = new BlockChain(CDB_PATH);
blockchain.$init(); // TODO Handle chain ready!

// Initialize wallet DB
Wallet.init(WDB_PATH);

// Node list maintainer
let nl = new NodeList(selfAddress=WALLET_SADDRESS);

// Communication channel to talk to nmap server
let nmapMesseger = new Messenger(WALLET_SADDRESS, NMAP_SADDRESS);

// Communication channel to talk to other miners
let myMesseger = new Messenger(WALLET_SADDRESS);

nmapMesseger.$send("minerlist").then(l => nl.updateList(l))
// Periodic update of fresh miner list from nmap
const MINER_FETCH_DELAY = 60 * 1000;
setInterval(() => nmapMesseger.$send("minerlist").then(l => nl.updateList(l)),
    MINER_FETCH_DELAY);

(function(){
  // WALLET Node on the BlockChain network
  // ===========================================================================
  console.log("Wallet node listening");
  walletNode = new MessageHandler(WALLET_SADDRESS);
  walletNode.listen();
  // Listen for block-updates and update local blockchain
  walletNode.on("newblock", function(d){
    // if the new block is already present : do nothing
    // if the new block is not valid       : do nothing
  });
}());

(function(){
  // WALLET_API
  // ===========================================================================
  var APISuccess = function(res, d){
    return res.json({ code: 200, data: d });
  };
  var APIError = function(res, m, d){
    return res.json({ code: 500, error: m, data: d });
  };

  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  // ROUTES FOR OUR WALLET {API}
  // ===========================================================================
  var router = express.Router();
  // create a wallet for crypto currency transactions
  // This creates a public/private key pair
  // The public key is the wallet_id,
  // the private key is stored securely and is use to authenticate transactions
  router.post('/createWallet', function(req, res){
    Wallet.new().$init().then(function(d){
      APISuccess(res, { walletID: d[ 0 ] })
    })
    .catch(function(e){
      APIError(res, "WALLET_CREATION_ERROR", e);
    });
  });

  // send coins from one wallet id to another
  router.post('/send', function(req, res){
    let data = {
      from   : req.body.from,
      to     : req.body.to,
      amount : req.body.amount,
    };

    new Wallet(data.from).$fetch()
      .then(function(w){
        return blockchain.$newUTXOTransaction(data, w.privateKey);
      })
      .then(function(tx){
        // Publish to blockchain mining network
        return nmapMesseger.$broadcast(nl, "transaction", tx.serialize());
      })
      .then(function(){
        APISuccess(res, "PROCESSING_TRANSACTION");
      })
      .catch(function(e){
        APIError(res, "TRANSACTION_ERROR", e);
      });
  });
  app.use('/api', router);
  // START THE WALLET API SERVER
  // ===========================================================================
  app.listen(WALLET_HPORT, WALLET_HOST);
  console.log('Wallet ui running on port ' + WALLET_HADDRESS);
}());
