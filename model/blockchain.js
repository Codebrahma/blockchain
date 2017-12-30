const _       = require('underscore');

const DB      = require('./db.js');
const Block   = require('./block.js');

const TxInput      = require('./transaction.js').TxInput;
const TxOutput     = require('./transaction.js').TxOutput;
const Transaction  = require('./transaction.js').Transaction;

const Elliptic     = require('./wallet.js').Elliptic;

(function(){
  const BLOCKCHAIN_MINER = process.env.BLOCKCHAIN_MINER || "codeanand";

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
        let cbTx = this.newCoinbaseTx();
        let _gBlock = new Block(transactions = [cbTx]);
        _gBlock.mine_and_verify(false);
        // append block to the block chain
        return this._chain.$append(_gBlock);
      }.bind(this);

      return this._chain.$isEmpty().then(initChain);
    },

    $addBlock: function(data){
      var self = this;
      var newUtxTx = function(prevBlock, pvtKey){

        var newT = self.$newUTXOTransaction(data.from, data.to, data.amount, pvtKey);
        return newT.then(function(tx){
          //FIXME throw doesnt fail the promise. gives a success console msg
          if (tx == 'Not enough funds') throw("Not enough funds");
          var temp = new Block([tx], prevBlock.getHash());
          temp.mine_and_verify();
          // append block to the block chain
          return self._chain.$append(temp);
        });

      };

      var getPrivKey = function(pubkey){
        return self._chain.$get('key_' + pubkey);
      };

      return this._chain.$fetchLast().then((prevBlock)=> {
        return getPrivKey(data.from).then((privkey)=>{
          return newUtxTx(prevBlock, privkey);
        });
      });
    },

    $print: function(verbose){
      // iterate through the chain and print each block
      return this._chain.$forEach(function(l){ l.print(verbose); });
    },

    /// Transaction methods
    newCoinbaseTx: function(to=BLOCKCHAIN_MINER, data="Reward to "+to){
      let input  = new TxInput(null, -1, data);
      let output = new TxOutput(this.subsidy, to);
      let tx     = new Transaction(null, [input], [output])
      tx.setId();
      return tx;
    },

    $newUTXOTransaction: function(from, to, amount, pvtKey){
      var inputs = [];
      var outputs = [];
      var sepndableOps = this.$findSpendableOutputs(from, amount);
      
      return sepndableOps.then(function(total_validOutput){

        if(total_validOutput.total < amount) {
          return 'Not enough funds';
        }

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

      var UTX = this._chain.$forEach(function(block){
        let unspentTXs = [];
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
      });
      return UTX.then(_.flatten);
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
