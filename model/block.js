const { Map }  = require('immutable');
const crypto   = require('crypto');

(function(){

  let MAX_NONCE = 9223372036854776000; // MaxInt64 = 2^63 - 1

  function Hashify(obj){
    const headers = [
      obj.get('prevBlockHash'),
      obj.get('data'),
      obj.get('timeStamp'),
      obj.get('nonce'),
      obj.get('difficulty'),
    ].join();

    return crypto.createHmac('sha256', headers).digest('hex')
  };

  function Block(data, prevBlockHash="", difficulty=4, nonce=0, timeStamp=(new Date()), hash=""){
    this._block = Map({
      "prevBlockHash": String(prevBlockHash),
      "data"         : String(data),
      "timeStamp"    : String(timeStamp),
      "nonce"        : nonce,
      "difficulty"   : difficulty,
      "hash"         : hash,
    });
  };
 

  // Instance methods
  Block.prototype = {

    getHash: function(){
      return this._block.get("hash");
    },

    hashify: function(){
      return Hashify(this._block);
    },

    getPrevHash: function(){
      return this._block.get("prevBlockHash");
    },

    mine: function(){
      for(let _nonce = 0 ; _nonce < MAX_NONCE && !this.validate(); _nonce++){
        this._block = this._block.set("nonce", _nonce);
      };
      this._block = this._block.set("hash", this.hashify());
      return this;
    },

    validate: function(){
      let _hash   = this.hashify();
      let d       = this._block.get("difficulty");;
      return _hash.substring(0, d) === '0'.repeat(d);
    },

    serialize: function(){
      return this._block.toObject();
    },

    print: function(verbose){

      if(verbose){
        console.log("Data          : " + this._block.get("data"));
        console.log("Time Stamp    : " + this._block.get("timeStamp"));
        console.log("PrevBlockHash : " + this._block.get("prevBlockHash"));
        console.log("Nonce         : " + this._block.get("nonce"));
        console.log("Hash          : " + this._block.get("hash"));
        console.log("PoW?          : " + this.validate());
        console.log("---------------------------------------------------------------------------------");
      } else {
        process.stdout.write(this._block.get("data"));
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