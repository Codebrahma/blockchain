const DB         = require('./db.js');
const Block      = require('./block.js');

(function(){

  function BlockChain(){
    this._chain = new DB();
  };

  BlockChain.prototype = {

    $init: function(){
      var initChain = function(empty){
        // Do nothing if chain exists ( ie, not empty )
        if(!empty) return;
        // Create genesis block
        let _gBlock = new Block("Genesis Block");
        // append block to the block chain
        return this.$append(_gBlock);
      }.bind(this);

      return this._chain.$isEmpty().then(initChain);
    },

    $addBlock: function(data){
      var addBlockWithLink = function(prevBlock){
        // get hash of previous block
        let prev  = prevBlock.getHash();
        // create a new block pointed to prev hash
        var temp = new Block(data, prev);
        // append block to the block chain
        return this.$append(temp);
      }.bind(this);

      return this._chain.$fetchLast().then(addBlockWithLink);
    },

    $append: function(block){
      // append block to the block chain after consensus
      return this._chain.$append(block.mine());
    },

    $print: function(verbose){
      // iterate through the chain and print each block
      return this._chain.$forEach(function(l){ l.print(verbose); });
    },
  };

  module.exports = BlockChain;
}());
