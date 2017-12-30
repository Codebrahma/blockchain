const _       = require('underscore');
const Crypto  = require('../util/crypto.js');
const Transaction = require('./transaction.js').Transaction;

const Elliptic     = require('./wallet.js').Elliptic;

(function(){

  let MAX_NONCE = 9223372036854776000; // MaxInt64 = 2^63 - 1

  function Block(transactions=[], prevBlockHash="", difficulty=4, nonce=0, timeStamp=(new Date()), hash=""){
    this._block = { };
    this._block.transactions = transactions;
    this._block.prevBlockHash= prevBlockHash;
    this._block.difficulty   = difficulty;
    this._block.nonce        = nonce;
    this._block.timeStamp    = String(timeStamp);
    this._block.hash         = hash;
  };
 
  // Instance methods
  Block.prototype = {

    getHash: function(){
      return this._block.hash;
    },

    hashify: function(){
      const headers = [
        'prevBlockHash',
        'transactions',
        'timeStamp',
        'nonce',
        'difficulty',
      ];

      let _block    = this._block;
      let headerStr = _.chain(headers).sort()
                       .map(function(v){ return _block[v] })
                       .value().join();

      return Crypto.hashify(headerStr);
    },

    getTransactions: function(){
      return this._block.transactions;
    },

    getPrevHash: function(){
      return this._block.prevBlockHash;
    },

    appendTx: function(tx){
      this._block.transactions.push(tx);
    },

    verify: function(){
      let what_to_return = true;
      _.each(this.getTransactions(), (tx)=>{
        var output_to = tx.outputs[0].publicKey;
        var output_value = tx.outputs[0].value;
        _.each(tx.inputs, (input)=>{
          let hash = input.TxID + input.fromOutput  + input.publicKey +  output_to +  output_value;
          //if(!Elliptic.verify(input.publicKey, hash, input.signature)){
            //what_to_return = false;
          //}
        });
      });
      return what_to_return;
    },

    mine_and_verify: function(){
      //CHANGE
      if(!this.verify()){ 
        //FIXME , this doesnt seem to fail the promise? gives a success console msg
        throw "signature mismatch"; 
        return
      }
      for(let _nonce = 0 ; _nonce < MAX_NONCE && !this.validate(); _nonce++){
        this._block.nonce = _nonce;
      };
      this._block.hash = this.hashify();
      return this;
    },

    validate: function(){
      let _hash   = this.hashify();
      let d       = this._block.difficulty;
      return _hash.substring(0, d) === '0'.repeat(d);
    },

    serialize: function(){
      return this._block;
    },

    print: function(verbose){
      if(verbose){
        console.log("Hash          : " + this._block.hash);
        console.log("Transactions  : " + JSON.stringify(this._block.transactions));
        console.log("PrevBlockHash : " + this._block.prevBlockHash);
        console.log("Nonce         : " + this._block.nonce);
        console.log("Difficulty    : " + this._block.difficulty);
        console.log("Time Stamp    : " + this._block.timeStamp);
        console.log("PoW?          : " + this.validate());
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
      txs,
      _b["prevBlockHash"],
      _b["difficulty"],
      _b["nonce"],
      _b["timeStamp"],
      _b["hash"]);
  };

  module.exports = Block;

}());