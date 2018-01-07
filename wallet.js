/*
  A secure database to store users keys
  HTTP Apis for user interaction
  Broadcasts transactions to the blockchain network
*/
const express    = require('express');        // call express
const bodyParser = require('body-parser');

const Messenger  = require('./util/message.js').Messenger;
const NodeList   = require('./util/nlist.js');
const Wallet     = require('./model/wallet.js');

const NMAP_HOST     = process.env.NMAP_HOST||"localhost";
const NMAP_SPORT    = process.env.NMAP_SPORT||"9999";
const NMAP_HPORT    = process.env.NMAP_SPORT||"8888";
const NMAP_SADDRESS = NMAP_HOST + ":" + NMAP_SPORT;
const NMAP_HADDRESS = NMAP_HOST + ":" + NMAP_HPORT;
const WALLET_HOST   = process.env.WALLET_HOST||"localhost";
const WALLET_PORT   = process.env.WALLET_PORT||8080;

// Node list maintainer
let nl = new NodeList(selfAddress=NODE_SADDRESS);

// Communication channel to talk to nmap server
let nmapMesseger = new Messenger(NODE_SADDRESS, NMAP_SADDRESS);

// Communication channel to talk to other miners
let myMesseger = new Messenger(NODE_SADDRESS);

// Periodic update of fresh miner list from nmap
const MINER_FETCH_DELAY = 60 * 1000;
setInterval(() => nmapMesseger.$send("minerlist").then(l => nl.updateList(l)),
    MINER_FETCH_DELAY);

console.log("Wallet node listening");
walletNode = new MessageHandler(NODE_SADDRESS);
walletNode.listen();

// Listen for block updates
walletNode.on("newblock", function(d){
  // if the new block is already present : do nothing
  // if the new block is not valid : do nothing
  
});

//
// nmapMesseger.$send("minerlist")
//   .then(function(l){
//     nl.updateList(l);
//
//     // Publish transaction to the network
//     return nmapMesseger.$broadcast(nl, "transaction", data)
//   })
//
//   .then(function(){
//     console.log("Yay! Transaction has been published to the blockchain network");
//   });

(function(){
  // WALLET_API
  // ===========================================================================
  var APISuccess(res, d){
    return res.json({ code: 200, data: d });
  };
  var APIError(res, m, d){
    return res.json({ code: 500, error: m, data: d });
  };

  const app = express();
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  // ROUTES FOR OUR WALLET {API}
  // ===========================================================================
  var router = express.Router();
  // create a wallet for crypto currency transactions
  router.post('/createWallet', function(req, res){
    new Wallet().$init().then(function(d){
      APISuccess(res, { walletID: d[ 0 ] })
    }, function(e){
      APIError(res, "WALLET_CREATION_ERROR", e);
    });
  });

  // create a wallet for crypto currency transactions
  router.post('/send', function(req, res){
    let data = {
      from   : req.body.from,
      to     : req.body.to,
      amount : req.body.amount,
    };

  });
  app.use('/api', router);
  // START THE WALLET API SERVER
  // ===========================================================================
  app.listen(WALLET_PORT, WALLET_HOST);
  console.log('Wallet ui running on port ' + port);
}());
