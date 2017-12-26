const Block    = require('./block.js');
var LinkedList = require('dbly-linked-list');

(function () {

  function BlockChain(){
    this._chain = new LinkedList();
    this._chain.insert(new Block("Genesis Block"));
  };

  BlockChain.prototype = {
    addBlock: function(data){
      const prevHash = this._chain.getTailNode()
                            .getData()
                            .getHash();
      var temp = new Block(data, prevHash);
      this._chain.insert(temp);
    },

    print: function(){
      this._chain.forEach(function(l){ l.getData().print(); });
    }
  };

  module.exports = BlockChain;
}());