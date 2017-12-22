const Block = require('./block.js');
const _     = require("underscore");

const BlockChain = (function(){
  var _chain = [ 
    new Block("Genesis Block") 
  ];
  
  function BlockChain(){
    return this;
  };

  BlockChain.prototype.addBlock = function(data){
    const prevHash = _chain[ _chain.length - 1 ].getHash();
    _chain.push(new Block(data, prevHash));
  };

  BlockChain.prototype.print = function(){
    _.each(_chain, function(c){ c.print() });
  }

  return BlockChain;
}());

module.exports = BlockChain;