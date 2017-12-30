const Crypto  = require('../util/crypto.js');
const _       = require('underscore');

(function(){
  
  // Transaction input  
  function TxInput(txId, fromOutput, signature, publicKey){
    this.TxID = txId || null;
    this.fromOutput = fromOutput;
    this.signature  = signature || null;
    this.publicKey  = publicKey || null;
  };
  
  TxInput.prototype = {
    CanUnlockOutput : function(outputPubKey){
      return this.publicKey === outputPubKey;
    },
  };

  // Transaction output
  function TxOutput(value, publicKey){
    this.value = value || 0;
    this.publicKey = publicKey || null;
  };
  TxOutput.prototype = {
    CanBeUnlockedWith: function(unlockingData){
      return this.publicKey === unlockingData;
    },
  };

  // Transaction
  function Transaction(txId, inputs, outputs){
    this.txId = txId || null;
    this.inputs = inputs || [];
    this.outputs = outputs || [];
  };
  Transaction.prototype = {
    setId : function(){
      this.txId = Crypto.hashify(JSON.stringify(this.inputs) + JSON.stringify(this.outputs));
    }
  };
  Transaction.deserialize = function(tx) {
    let x = new Transaction(tx.txId);
    _.each(tx.inputs, (input)=> {
      x.inputs.push(new TxInput(input.TxID, input.fromOutput, input.signature, input.publicKey));
    });
    _.each(tx.outputs, (output)=> {
      x.outputs.push(new TxOutput(output.value, output.publicKey));
    });
    return x;
  }

  // Export
  module.exports = {
    "TxInput"    : TxInput,
    "TxOutput"   : TxOutput,
    "Transaction": Transaction,
  };

})();