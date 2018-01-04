const _       = require('underscore');
const Q       = require('Q');

const DB      = require('./db.js').ChainDB;
const Block   = require('./block.js');
const Wallet  = require('./wallet.js');

const TxInput      = require('./transaction.js').TxInput;
const TxOutput     = require('./transaction.js').TxOutput;
const Transaction  = require('./transaction.js').Transaction;

(function(){
  function BlockChain(){
    this._chain  = new DB(process.env.DB_PATH+"/chain");
    this._wallet = Wallet;
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

      var initChain = function(empty){
        // do nothing if chain not empty
        if(!empty) return Q();

        // create genesis block
        let _gBlock = Block.getGenesisBlock();

        // append block to the block chain
        return self._chain.$append(_gBlock);
      };

      return this._chain.$isEmpty().then(initChain);
    },

    $addBlock: function(data, privateKey){
      var self = this;

      var newUtxTx = function(d){
        let tx        = d[0];
        let prevBlock = d[1];

        var temp = new Block([tx], prevBlock.getHash());
        temp.verify_and_mine();

        // append block to the block chain
        return self._chain.$append(temp);
      };

      let prep = Q.all([
        self.$newUTXOTransaction(data, privateKey),
        this._chain.$fetchLast(),
      ]);

      return prep.then(newUtxTx);
    },

    $print: function(verbose){
      // iterate through the chain and print each block
      return this._chain.$forEach(function(l){ l.print(verbose); });
    },

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

        // interating through all transactions in a blokck
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

    $getBalance: function(owner) {
      let balance = 0.0;
      return this.$findUTX(owner).then((unspentTX)=>{
        _.each(unspentTX, (tx, tx_idx)=>{
          _.each(tx.outputs, (output, opt_idx)=>{
            if(output.publicKey ==owner){
              balance = balance + parseFloat(output.value);
            }
          });
        });
        return balance;
      });
    },

  };


  module.exports = BlockChain;
}());
