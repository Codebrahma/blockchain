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

// DEPENDENCIES
const express    = require('express');        // call express
const bodyParser = require('body-parser');

const Node            = require('./node.js');
const Wallet          = require('./model/wallet.js');

// NOde
const NODE_PORT     = process.env.NODE_PORT||"3000";
// Wallet server
const NODE_HOST     = process.env.NODE_HOST||"localhost";
const NODE_HPORT    = process.env.NODE_HPORT||8080;
const NODE_HADDRESS = NODE_HOST + ":" + NODE_HPORT;

// Datastore path
const WDB_PATH      = process.env.WDB_PATH || "walletdb-"+NODE_PORT;
// Initialize wallet DB
Wallet.init(WDB_PATH);

// WALLET Node on the BlockChain network
// =============================================================================
let walletNode = new Node(type="wallet");
walletNode.listen();


(function(){
  // WALLET_API
  // ===========================================================================
  var APISuccess = function(res, m, d){
    return res.json({ code: 200, message: m, data: d });
  };
  var APIError = function(res, m, d){
    return res.json({ code: 500, message: m, data: d });
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
      APISuccess(res, "WALLET_CREATED", { walletID: d[ 0 ] })
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
        return walletNode.blockchain.$newUTXOTransaction(data, w.privateKey);
      })
      .then(function(tx){
        // Publish to blockchain mining network
        return walletNode.network.$broadcast(walletNode.addressBook, "transaction", tx.serialize());
      })
      .then(function(){
        APISuccess(res, "PROCESSING_TRANSACTION", {});
      })
      .catch(function(e){
        APIError(res, "TRANSACTION_ERROR", e);
      });
  });

  // Get account balance
  router.get('/balance', function(req, res){
    let data = {
      address: req.query.address
    };

    walletNode.blockchain.$getBalance(data.address)
      .then(function(b){
        APISuccess(res, "BALANCE", { address: data.address, balance: b });
      }, function(e){
        APIError(res, "BALANCE_ERROR", e);
      });
  });

  app.use('/api', router);
  // START THE WALLET API SERVER
  // ===========================================================================
  app.listen(NODE_HPORT, NODE_HOST);
  console.log('Wallet ui running on port ' + NODE_HADDRESS);
}());
