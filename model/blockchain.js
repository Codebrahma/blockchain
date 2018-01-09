const _       = require('underscore');
const Q       = require('Q');

const DB      = require('./db.js').ChainDB;
const Block   = require('./block.js');
const Wallet  = require('./wallet.js');

const TxInput      = require('./transaction.js').TxInput;
const TxOutput     = require('./transaction.js').TxOutput;
const Transaction  = require('./transaction.js').Transaction;

(function(){
  function BlockChain(DB_PATH){
    this._chain  = new DB(DB_PATH);
    this._wallet = Wallet;
    this.height  = 0;
  };

  BlockChain.prototype = {
    /*
      Method initializes the block chain
      does nothing if chain exists ( ie, not empty )
      if not creates genesis block,
        verifies and mines the block and
        appends it to the chain
    */
    $init: function(){
      var self = this;

      return this._chain.$isEmpty()
        .then(g => self.$getHeight())
        .then(h => self.height = h);
    },

    $createGenesis: function(){
      let self = this;
      return self.$init().then(function(){
        if(self.height > 0){
          console.log("Blockchain already initialized");
          return;
        };
        // create genesis block
        console.log("1");
        let _gBlock = Block.getGenesisBlock();
        console.log("2");
        _gBlock.mine();
        console.log("3");

        // append block to the block chain
        return self.$append(_gBlock).then(function(){
          console.log("Blockchian initialized");
        });
      });
    },

    /*
      Method adds transactions as a new block to the block chain
      INPUT: published transaction object
    */
    $addBlock: function(txs){
      var self = this;
        // Fetch block chain TIP

      var addBlock = function(d){
        // Mining reward + Requested transaction
        txs = _.map(txs, t => new Transaction(t.txId, t.inputs, t.outputs));
        txs = [Transaction.newCoinbaseTx()].concat(txs);
        let prevBlock = d;

        // create a new block and mine
        var temp = new Block(prevBlock.getHeight()+1, txs, prevBlock.getHash());
        temp.verify_and_mine();

        // append block to the block chain
        return self.$append(temp);
      };

      return this._chain.$fetchLast().then(addBlock);
    },

    appendStreamBlock: function(d){
      console.log("NEW_BLOCK_RECIEVED");
      this.$append(Block.deserialize(d))
        .then(function(){
          console.log("APPENDED_RECIEVED_BLOCK");
        }).catch(function(e){
          console.log("DISCARDED_RECIEVED_BLOCK");
        });
    },

    mineTransaction: function(d, cb){
      console.log("MINING_NEW_TRANSACTION");
      this.$addBlock([ d ])
        .then(function(b){
          console.log("BLOCKCHAIN_UPDATED");
          return cb(b);
        })
        .finally(function(){
          console.log("BROADCASTING_TO_NETWORK");
        })
        .catch(function(e){
          console.log("OPERATION_FAILED");
          console.log(e);
        });
    },

    $append: function(block){
      let self = this;
      return this._chain.$verifyAndAppend(block, function(block, prev){
        let valid = (
          block.isValid()                 && // Valid block
          (!prev || block.isValidNext(prev)) // Valid next
        )
        if(valid){
          self.height = self.height + 1;
          return block;
        };
        return Q.reject();
      });
    },

    /*
      Method iterates through the chain and print each block
    */
    $print: function(verbose){
      return this._chain.$forEach(function(l){ l.print(verbose); });
    },

    /*
      Method retrieves owner balance, summing up output values
        from unspent transactions
      INPUT: owner's public key
    */
    $getBalance: function(owner) {
      return this.$findUTX(owner).then(unspentTX => {
        return _.reduce(unspentTX, (b,tx) => b + tx.getOwnerBalance(owner), 0.0);
      });
    },

    /*
      Method retrieves the height of the current instance of the blockchain
    */
    $getHeight: function(){
      return this._chain.$reduce((b, x)=> x+1 , x=0)
    },

    /*
      Method retrieves the blocks above height
      INPUT: height
    */
    $getBlocksUpto: function(upto){
      return this._chain.$filter(function(block){
        return block.getHeight() > upto;
      });
    },

    /*
      Method appends a set of blocks onto the chain
      INPUT: blks
    */
    $appendWithChain: function(blks){
      let blocks = _.chain(blks)
                    .map(b => Block.deserialize(b["_block"]))
                    .sortBy(b => b.getHeight());

      let appendedBlocks = blocks.map(b=> this.$append(b)).value();

      return Q.all(appendedBlocks)
    },

    // PRIVATE METHODS
    $newUTXOTransaction: function(data, pvtKey){
      let from   = data.from;
      let to     = data.to;
      let amount = data.amount;

      var inputs  = [];
      var outputs = [];

      var sepndableOps = this.$findSpendableOutputs(from, amount);

      return sepndableOps.then(function(total_validOutput){
        if(total_validOutput.total < amount) throw('Not enough funds');

        _.each(total_validOutput.validOutput, function(output){
          var input = new TxInput(output.TxID, output.idx, null , from);
          inputs.push(input)
        });


        outputs.push(new TxOutput(amount, to));
        if(total_validOutput.total > amount){
          outputs.push(new TxOutput(total_validOutput.total - amount, from));
        }

        var t =  new Transaction(null, inputs, outputs);
        t.setId();
        t.sign(pvtKey);
        return t;

      });
    },

    $findSpendableOutputs: function(from, amount){
      var unspentOutputs = [];
      var total = 0;
      var utx = this.$findUTX(from);

      return utx.then(function(unspentTXs){
        _.each(unspentTXs, function(tx){
          var tx_id = tx.txId;
          _.each(tx.outputs, (output, id)=>{
            if(output.CanBeUnlockedWith(from) && total < amount) {
              total = total + parseFloat(output.value);
              unspentOutputs.push({TxID:tx_id, idx: id})
            }
          });
        });
        return {total: total, validOutput: unspentOutputs};
      });
    },

    $findUTX: function(owner){
      let spentTXOs  = {};

      return this._chain.$reduce(function(block, unspentTXs){
        // interating through all transactions in a block
        _.each(block.getTransactions(), (tx,tx_idx)=>{
          // for each output in the transaction
          _.each(tx.outputs, function(output, opt_idx){
            // check if that output is already spent
            let transactionSpent = ((spentTXOs[tx.txId]) && _.includes(spentTXOs[tx.txId], opt_idx));

            let belongsToOwner   = (output.publicKey === owner);
            if( !transactionSpent && belongsToOwner ){
              unspentTXs.push(tx);
            };
          });
          // go to each input and add the output it references to spentTXO
          _.each(tx.inputs, (input, in_idx)=>{
            if(input.CanUnlockOutput(owner)){
              if(!spentTXOs[input.TxID]) spentTXOs[input.TxID] = []
              spentTXOs[input.TxID].push(input.fromOutput)
            }
          });
        });

        return unspentTXs;

      }, [ ]);
    },
  };


  module.exports = BlockChain;
}());
