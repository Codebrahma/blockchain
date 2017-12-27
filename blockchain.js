const Block    = require('./block.js');
var LinkedList = require('dbly-linked-list');

(function () {


  function BlockChain(){
    this._chain = new LinkedList();
    let _tempBlock = new Block("Genesis Block");
    _tempBlock.mine();
    this._chain.insert(_tempBlock);
  };

  BlockChain.prototype = {
    addBlock: function(data){
      const prevHash = this._chain.getTailNode()
                            .getData()
                            .getHash();
      var temp = new Block(data, prevHash);
      temp.mine();
      this._chain.insert(temp);
    },

    print: function(){
      this._chain.forEach(function(l){ l.getData().print(); });
    }
  };

  module.exports = BlockChain;
}());