const { Map }  = require('immutable');
const crypto   = require('crypto');

const Block = (function(){

  var _block = null;

  function Hashify(obj){
    const headers = [
      obj.prevBlockHash,
      obj.data,
      obj.timeStamp,
    ].join();

    return crypto.createHmac('sha256', headers).digest('hex')
  };

  function Block(data, prevBlockHash=""){
    _block = Map({
      "timeStamp"    : String( new Date() ),
      "prevBlockHash": String(prevBlockHash),
      "data"         : String(data),
      "hash"         : Hashify(this),
    });
    return this;
  };

  Block.prototype.print = function(){
    console.log("Data          : " + _block.get("data"));
    console.log("Time Stamp    : " + _block.get("timeStamp"));
    console.log("PrevBlockHash : " + _block.get("prevBlockHash"));
    console.log("Hash          : " + _block.get("hash"));
    console.log("---------------------------------------------------------------------------------");
  }

  Block.prototype.getHash = function(){
    return _block.get("hash");
  }

  return Block;

}());


module.exports = Block;