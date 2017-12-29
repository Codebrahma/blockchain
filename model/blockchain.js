const _       = require('underscore');

const DB      = require('./db.js');
const Block   = require('./block.js');

const TxInput      = require('./transaction.js').TxInput;
const TxOutput     = require('./transaction.js').TxOutput;
const Transaction  = require('./transaction.js').Transaction;


(function(){

  function BlockChain(){
    this.subsidy = 10;
    this._chain = new DB();
  };

  BlockChain.prototype = {

    $init: function(){
      var initChain = function(empty){
        // Do nothing if chain exists ( ie, not empty )
        if(!empty) return;
        // Create genesis block
        let _gBlock = new Block();
        // append block to the block chain
        return this.$append(_gBlock);
      }.bind(this);

      return this._chain.$isEmpty().then(initChain);
    },

    $addBlock: function(data){
      var self = this;
      var newUtxTx = function(prevBlock){
        var newT = self.$newUTXOTransaction(data.from, data.to, data.amount);
        newT.then(function(tx){
          console.log("------------------");
          console.log(tx)
          var temp = new Block({transactions: [tx]}, prevBlock.getHash());
          // append block to the block chain
          return self.$append(temp);
        });
        return newT;
      };
      return this._chain.$fetchLast().then(newUtxTx);
    },

    $append: function(block){
      // add coinbase tx while mining
      let cbTx = this.newCoinbaseTx();
      // append block to the block chain after consensus
      return this._chain.$append(block.mine(cbTx));
    },

    $print: function(verbose){
      // iterate through the chain and print each block
      return this._chain.$forEach(function(l){ l.print(verbose); });
    },

    /// Transaction methods
    newCoinbaseTx: function(to="codeanand", data="Reward to "+to){
      let input  = new TxInput(null, -1, data);
      let output = new TxOutput(this.subsidy, to);
      let tx     = new Transaction(null, [input], [output])
      tx.setId();
      return tx;
    },

    $newUTXOTransaction: function(from, to, amount){
      var inputs = [];
      var outputs = [];
      var sepndableOps = this.$findSpendableOutputs(from, amount);
      sepndableOps.then((total_validOutput=>{
        if(total_validOutput.total < amount) {
          return 'Not enough funds';
        }

        _.each(total_validOutput.validOutput, function(output){
          var input = new Input(output.TxID, output.idx, from);
          inputs.push(input)
        }); 


        outputs.push(new Output(amount, to));
        if(total_validOutput.total > amount){
          outputs.push(new Output(total_validOutput.total - amount, from));
        }

        var t =  new Transaction(null, inputs, outputs);
        t.setId();
        return t;
      }));
      return sepndableOps;
    },


    $findSpendableOutputs: function(from, amount){
      var unspentOutputs = [];
      var total = 0;
      var utx = this.$findUTX(from);
      utx.then(function(unspentTXs){
        _.each(unspentTXs, function(tx){
          var tx_id = tx.txId;
          
          _.each(tx.outputs, (output, id)=>{
            //TODO abstract this to output class
            if(output.publicKey == from && total < amount) {
              total = total + parseFloat(output.value);
              unspentOutputs.push({TxID:tx_id, idx: id})
            }
          });
        });
        return {total: total, validOutput: unspentOutputs};
      });
      return utx;
    },

    $findUTX: function(owner){
      let unspentTXs = [ ];
      let spentTXOs  = { };

      var accUTX = this._chain.$forEach(function(block){
        // interating through all transactions in a blokck
        _.each(block.getTransactions(), (tx,tx_idx)=>{
          // for each output in the transaction
          _.each(tx.outputs, function(output, opt_idx){
            // check if that output is already spent
            let transactionSpent = (spentTXOs[tx.txId]) && _.includes(spentTXOs[tx.txId], opt_idx);
            
            let belongsToOwner   = (output.publicKey == owner);
            if( !transactionSpent && belongsToOwner ){
              unspentTXs.push(tx);
            };
          });
          // go to each input and add the output it references to spentTXO
          _.each(tx.inputs, (input, in_idx)=>{
            //TODO abstract this to input class
            if(input.scriptSig === owner){
              if(!spentTXOs[input.TxID]) spentTXOs[input.TxID] = []
              spentTXOs[input.TxID].push(input.fromOutput)
            }
          });
        });
        return(unspentTXs);
      });

      return accUTX.then(_.flatten);
    },

    $getBalance: function(owner) {
      let balance = 0;
      return this.$findUTX(owner).then((unspentTX)=>{
        _.each(unspentTX, (tx, tx_idx)=>{
          _.each(tx.outputs, (output, opt_idx)=>{
            if(output.publicKey ==owner){
              balance = balance + parseFloat(output.value);
            }
          });
        });
        console.log("Balance of Mr." + owner + " is " + balance);
      });
    },

  };

  
  module.exports = BlockChain;
}());
