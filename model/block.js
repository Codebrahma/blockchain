const _       = require('underscore');
const Crypto  = require('./util/crypto.js');
const Util    = require('./util/bc_util.js');

(function(){

  let MAX_NONCE = 9223372036854776000; // MaxInt64 = 2^63 - 1

  function Block(data, prevBlockHash="", difficulty=4, nonce=0, timeStamp=(new Date()), hash=""){
    this._block = { };
    this._block["data"]         = Util.cleanData(data);
    this._block["prevBlockHash"]= prevBlockHash;
    this._block["difficulty"]   = difficulty;
    this._block["nonce"]        = nonce;
    this._block["timeStamp"]    = String(timeStamp);
    this._block["hash"]         = hash;
  };
 
  // Instance methods
  Block.prototype = {

    getHash: function(){
      return this._block["hash"];
    },

    hashify: function(){
      const headers = [
        'prevBlockHash',
        'data',
        'timeStamp',
        'nonce',
        'difficulty',
      ];

      let headerStr = _.chain(headers).sort()
                       .map(function(v){ return this._block[v] })
                       .value().join();

      return Crypto.hashify(headerStr);
    },

    getPrevHash: function(){
      return this._block["prevBlockHash"];
    },

    mine: function(){
      for(let _nonce = 0 ; _nonce < MAX_NONCE && !this.validate(); _nonce++){
        this._block["nonce"] = _nonce;
      };
      this._block["hash"] = this.hashify();
      return this;
    },

    validate: function(){
      let _hash   = this.hashify();
      let d       = this._block["difficulty"];
      return _hash.substring(0, d) === '0'.repeat(d);
    },

    serialize: function(){
      return this._block;
    },

    print: function(verbose){

      if(verbose){
        console.log("Hash          : " + this._block["hash"]);
        console.log("Data          : " + this._block["data"]);
        console.log("PrevBlockHash : " + this._block["prevBlockHash"]);
        console.log("Nonce         : " + this._block["nonce"]);
        console.log("Difficulty    : " + this._block["difficulty"]);
        console.log("Time Stamp    : " + this._block["timeStamp"]);
        console.log("PoW?          : " + this.validate());
        console.log("---------------------------------------------------------------------------------");
      } else {
        process.stdout.write(this._block["data"]);
        this.getPrevHash() ? process.stdout.write(" => ") : process.stdout.write(" ||\n");
      };

    },

  };

  // Class methods
  Block.deserialize = function(_b){
    return new Block(
      _b["data"],
      _b["prevBlockHash"],
      _b["difficulty"],
      _b["nonce"],
      _b["timeStamp"],
      _b["hash"]);
  };

  module.exports = Block;

}());