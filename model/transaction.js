const Crypto  = require('../util/crypto.js');

(function(){
  
  // Transaction input  
  function TxInput(txId, fromOutput, scriptSig){
    this.TxID = txId || null;
    this.fromOutput = fromOutput;
    this.scriptSig  = scriptSig || null;
  };
  
  TxInput.prototype = {
    CanUnlockOutput : function(outputPubKey){
      return this.scriptSig == outputPubKey;
    },
  };

  // Transaction output
  function TxOutput(value, publicKey){
    this.value = value || 0;
    this.publicKey = publicKey || 0;
  };
  TxOutput.prototype = {
    CanBeUnlockedWith: function(unlockingData){
      this.publicKey === unlockingData;
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

  // Export
  module.exports = {
    "TxInput"    : TxInput,
    "TxOutput"   : TxOutput,
    "Transaction": Transaction,
  };

})();