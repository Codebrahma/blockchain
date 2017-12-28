const crypto   = require('crypto');

(function(){

  function hashify(headers){
    return crypto.createHmac('sha256', headers).digest('hex')
  };

  // initializer
  function Block(data, prevBlockHash=''){
    this.timeStamp     = data.timeStamp || String (new Date());
    this.prevBlockHash = data.prevBlockHash || String(prevBlockHash);
    this.data          = data.data || String(data);
    this.nonce         = data.nonce || 0;
    this.hash          = data.hash || null;
  };

  Block.prototype = {
    print: function(){
      console.log("Data          : " + this.data);
      console.log("Time Stamp    : " + this.timeStamp);
      console.log("PrevBlockHash : " + this.prevBlockHash);
      console.log("Nonce         : " + this.nonce);
      console.log("Hash          : " + this.hash);
      console.log("PoW?          : " + this.validate());
      console.log("--------------------------------------------");
    },

    getHash: function(){
      return this.hash;
    },

    getPrevHash: function(){
      return this.prevBlockHash;
    },

    mine: function(){
      for(let _x = 0 ; _x< 9007199254740991 ; _x++ ){
        this.nonce = _x;
        let _hash = hashify('' + this.timeStamp + 
                    this.prevBlockHash + this.data + this.nonce);
        this.hash = _hash;
        if(this.validate()) break;
      }      
    },

    validate: function(){
      return this.hash.substring(0, 4) === '0000';
    }
  }
   
  module.exports = Block;

}());