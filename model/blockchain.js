const Block    = require('./block.js');
const scatteredStore = require('scattered-store');

(function () {


  function BlockChain(callback){
    
    // setup the db session
    this.store = scatteredStore.create('db/blocks', (err) => {
      if (err) {
        console.log('Error in initializing blocks');
      } else {
        console.log('Blocks initialized');
      }
    });

    // get the final block
    this.store.get('tip').then((prevHash) => {
      if(prevHash) {
        this.tip = prevHash;
        callback(null);
      } else {

        // this is a new chain, hence add a genesis block
        let _tempBlock = new Block({data: "Genesis Block"});
        _tempBlock.mine();
        this.tip = _tempBlock.getHash();

        //store the genesis block and the tip
        this.store.set(this.tip,_tempBlock).then(()=>{
          this.store.set('tip',this.tip).then( (err)=> {
            callback(null);
          });
        });
      }
    });

  };

  BlockChain.prototype = {
    addBlock: function(data, callback){
      this.store.get('tip').then((prevHash) => {
        var temp = new Block(data, prevHash);
        temp.mine();
      
        // insert the block and the update the tip
        this.store.set(temp.getHash(), temp).then(()=> {
          this.store.set('tip',temp.getHash()).then(()=>{
            this.tip = temp.getHash();
            callback(null);
          });
        });
      
      });
    },

    print: function(callback){
      this.store.get('tip').then((tip) => {
        this.printChain(tip, callback);
      });
    },

    printChain: function(hash, callback){
      this.store.get(hash).then((blockData) => {
        let block = new Block(blockData);
        block.print();
        let parent = block.getPrevHash();
        if(parent) {
          this.printChain(parent);
        } else {
          callback(null);
        }
      });
    },
  };

  module.exports = BlockChain;
}());