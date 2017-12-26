const { Map }  = require('immutable');
const crypto   = require('crypto');

(function(){

  function Hashify(obj){
    const headers = [
      obj.get('prevBlockHash'),
      obj.get('data'),
      obj.get('timeStamp'),
    ].join();

    return crypto.createHmac('sha256', headers).digest('hex')
  };

  function Block(data, prevBlockHash=""){
    this._block = Map({
      "timeStamp"    : String( new Date() ),
      "prevBlockHash": String(prevBlockHash),
      "data"         : String(data),
    });
    this._block = this._block.set('hash', Hashify(this._block));
  };

  Block.prototype = {
    print: function(){
      console.log("Data          : " + this._block.get("data"));
      console.log("Time Stamp    : " + this._block.get("timeStamp"));
      console.log("PrevBlockHash : " + this._block.get("prevBlockHash"));
      console.log("Hash          : " + this._block.get("hash"));
      console.log("---------------------------------------------------------------------------------");
    },

    getHash: function(){
      return this._block.get("hash");
    }
  }
   
  module.exports = Block;

}());