const { Map }  = require('immutable');
const crypto   = require('crypto');

(function(){

  function Hashify(obj){
    const headers = [
      obj.get('prevBlockHash'),
      obj.get('data'),
      obj.get('timeStamp'),
      obj.get('nonce'),
    ].join();

    return crypto.createHmac('sha256', headers).digest('hex')
  };

  function Block(data, prevBlockHash=""){
    this._block = Map({
      "timeStamp"    : String( new Date() ),
      "prevBlockHash": String(prevBlockHash),
      "data"         : String(data),
      "nonce"        : 0,
    });
  };

  Block.prototype = {
    print: function(){
      console.log("Data          : " + this._block.get("data"));
      console.log("Time Stamp    : " + this._block.get("timeStamp"));
      console.log("PrevBlockHash : " + this._block.get("prevBlockHash"));
      console.log("Nonce         : " + this._block.get("nonce"));
      console.log("Hash          : " + this._block.get("hash"));
      console.log("PoW?          : " + this.validate());
      console.log("---------------------------------------------------------------------------------");
    },

    getHash: function(){
      return this._block.get("hash");
    },

    mine: function(){
      for(let _x = 0 ; _x< 9007199254740991 ; _x++ ){
        this._block = this._block.set('nonce', _x);
        let _hash = Hashify(this._block);
        this._block = this._block.set('hash', _hash );
        if(_hash.substring(0, 4) === '0000') break;
      }      
    },

    validate: function(){
      return this._block.get('hash').substring(0, 4) === '0000';
    }
  }
   
  module.exports = Block;

}());