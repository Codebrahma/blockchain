const _       = require('underscore');

const Crypto    = require('../util/crypto.js');
const Elliptic  = require('../util/elliptic.js');

const Transaction = require('./transaction.js').Transaction;

(function(){

  const MAX_NONCE        = 9223372036854776000; // MaxInt64 = 2^63 - 1
  const BLOCK_DIFFICULTY = process.env.BLOCK_DIFFICULTY;

  function Block(height=0, transactions=[], prevBlockHash="", difficulty=BLOCK_DIFFICULTY||4, nonce=0, timeStamp=(new Date()), hash=""){
    this._block = { };
    this._block.transactions = transactions;
    this._block.prevBlockHash= prevBlockHash;
    this._block.difficulty   = difficulty;
    this._block.nonce        = nonce;
    this._block.timeStamp    = String(timeStamp);
    this._block.hash         = hash;
    this._block.height       = height;
  };

  // Instance methods
  Block.prototype = {

    getHash: function(){
      return this._block.hash;
    },

    hashify: function(){
      const headers = [
        'height',
        'prevBlockHash',
        'timeStamp',
        'nonce',
        'difficulty',
      ];

      let _block    = this._block;
      let headerStr = _.chain(headers).sort()
                       .map(function(v){ return _block[v] })
                       .value().join();
      headerStr     = headerStr + JSON.stringify( this.serializeTransactions() );

      return Crypto.hashify(headerStr);
    },

    getTransactions: function(){
      return this._block.transactions;
    },

    getPrevHash: function(){
      return this._block.prevBlockHash;
    },
    getHeight: function(){
      return this._block.height;
    },

    appendTx: function(tx){
      this._block.transactions.push(tx);
    },

    isValid: function(){
      return (
        this._block.hash == this.hashify() && // Integrity check
        this.validate()                    && // Valid proof of work
        this.verify()                      && // Valid signature?
        this._block.difficulty == BLOCK_DIFFICULTY
      );
    },

    isValidNext: function(prev){
      return (
        this.getHeight()   === prev.getHeight() + 1 && // Height is valid
        this.getPrevHash() === prev.getHash()       && // Hash chain is valid
        this._block.difficulty >= prev._block.difficulty
      );
    },

    verify: function(){
      let what_to_return = true;
      let rewardCount    = 0;
      _.each(this.getTransactions(), (tx)=>{
        if(tx.isVaildReward() && rewardCount == 0){
          rewardCount = rewardCount + 1; return;
        };
        let results = tx.getInputSignPair();
        _.each(tx.inputs, (input, idx)=>{
          if(!Elliptic.verify(input.publicKey, results[idx], input.signature)){
            what_to_return = false;
          }
        });
      });
      return what_to_return;
    },

    verify_and_mine: function(){
      if(!this.verify()) throw("signature mismatch");
      this.mine();
      return this;
    },

    mine: function(){
      for(let _nonce = 0 ; _nonce < MAX_NONCE && !this.validate(); _nonce++){
        this._block.nonce = _nonce;
      };
      this._block.hash = this.hashify();
    },

    validate: function(){
      let _hash   = this.hashify();
      let d       = this._block.difficulty;
      return _hash.substring(0, d) === '0'.repeat(d);
    },

    serialize: function(){
      return this._block;
    },

    serializeTransactions: function(){
      return _.map(this._block.transactions, t => t.serialize());
    },

    print: function(verbose){
      if(verbose){
        console.log("Hash          : " + this._block.hash);
        console.log("Transactions  : " + JSON.stringify(this._block.transactions));
        console.log("PrevBlockHash : " + this._block.prevBlockHash);
        console.log("Nonce         : " + this._block.nonce);
        console.log("Difficulty    : " + this._block.difficulty);
        console.log("Time Stamp    : " + this._block.timeStamp);
        console.log("Height        : " + this._block.height);
        console.log("Valid?        : " + this.isValid());
        console.log("---------------------------------------------------------------------------------");
      } else {
        process.stdout.write(JSON.stringify(this._block.transactions));
        this.getPrevHash() ? process.stdout.write(" =>\n") : process.stdout.write(" ||\n");
      };
    },
  };

  // Class methods
  Block.deserialize = function(_b){
    var txs = []

    _.each(_b.transactions, (tx)=> {
      let x = Transaction.deserialize(tx);
      txs.push(x);
    });
    return new Block(
      _b['height'],
      txs,
      _b["prevBlockHash"],
      _b["difficulty"],
      _b["nonce"],
      _b["timeStamp"],
      _b["hash"]);
  };

  Block.getGenesisBlock =  function(){
    let cbTx = Transaction.newCoinbaseTx(to="0484efac84fc3652697fd7f7482fdf7250c73f39a05e8328f3ab4d4872e941f4f6cb31c88520672241b2877c522250fa960236d249879231250ee9250fa4a26945");
    let _gBlock = new Block(height=1,transactions=[cbTx],prevBlockHash="", difficulty=5, nonce=0, timeStamp=(new Date(0)));
    _gBlock.verify_and_mine();
    return _gBlock;
  };

  module.exports = Block;

}());
