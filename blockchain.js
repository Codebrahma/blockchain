const Block    = require('./block.js');
var LinkedList = require('dbly-linked-list');

const BlockChain = (function(){

  var _chain = new LinkedList();
  _chain.insert(new Block("Genesis Block"));

  function BlockChain(){
    return this;
  };

  BlockChain.prototype.addBlock = function(data){
    const prevHash = _chain.getTailNode()
                           .getData()
                           .getHash();

    _chain.insert(new Block(data, prevHash));
  };

  BlockChain.prototype.print = function(){
    _chain.forEach(function(l){ l.getData().print(); });
  };

  return BlockChain;
}());

module.exports = BlockChain;