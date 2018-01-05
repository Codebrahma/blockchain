const _        = require('underscore');
const Crypto   = require('../util/crypto.js');
const Elliptic = require('../util/elliptic.js');

_.mixin(require('underscore.deepclone'));

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
    serialize: function(){
      return { TxID: this.TxID, fromOutput: this.fromOutput, signature: this.signature, publicKey: this.publicKey };
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
    serialize: function(){
      return { publicKey: this.publicKey, value: this.value};
    },
  };

  // Transaction
  function Transaction(txId, inputs, outputs){
    this.txId = txId || null;
    this.inputs  = _.map(inputs,  i => new TxInput(i.TxID, i.fromOutput, i.signature, i.publicKey)) || [ ];
    this.outputs = _.map(outputs, o => new TxOutput(o.value, o.publicKey)) || [ ];
  };
  Transaction.prototype = {
    getIId: function(){
      return Crypto.hashify(JSON.stringify(this.serialize()));
    },
    setId : function(){
      this.txId = this.getIId();
      return this;
    },
    sign: function(pvtKey){
      let txCopy = _.deepClone(this);
      txCopy     = new Transaction(null, txCopy.inputs, txCopy.outputs)
      _.each(txCopy.inputs, (inp)=>{
        inp.publicKey=null;
        inp.signature=null;
      });
      _.each(txCopy.inputs, (inp, idx)=>{
        inp.publicKey = this.inputs[idx].publicKey;
        txCopy.setId();
        this.inputs[idx].signature = Elliptic.sign(pvtKey, txCopy.txId);
        inp.publicKey = null;
      });
    },
    getInputSignPair: function(){
      var result_pair = [];
      let txCopy = _.deepClone(this);
      txCopy     = new Transaction(null, txCopy.inputs, txCopy.outputs)
      _.each(txCopy.inputs, (inp)=>{
        inp.publicKey=null;
        inp.signature=null;
      });
      _.each(txCopy.inputs, (inp, idx)=>{
        inp.publicKey = this.inputs[idx].publicKey;
        txCopy.setId();
        result_pair.push(txCopy.txId);
      });
      return result_pair;
    },
    isEql: function(t){
      return JSON.stringify(t.serialize()) === JSON.stringify(this.serialize());
    },
    serialize: function(){
      let inputs  = _.map(this.inputs,  i => i.serialize());
      let outputs = _.map(this.outputs, o => o.serialize());
      return { "txId": this.txId, "inputs": this.inputs, "outputs": this.outputs };
    },
    getOwnerBalance: function(onwer){
      let bal = _.reduce(this.outputs, function(b,o){
        if(o.publicKey == onwer) b=b+parseFloat(o.value);
        return b;
      }, 0.0);
      return bal;
    },

    isVaildReward: function(subsidy=process.env.SUBSIDY||10){
      let validReward = (
        (this.inputs.length  == 1) &&
        (this.outputs.length == 1) &&
        this.inputs[ 0 ].fromOutput == -1 &&
        this.outputs[ 0 ].value == subsidy
      );
      return validReward;
    },
  };
  Transaction.deserialize = function(tx) {
    return new Transaction(tx.txId, tx.inputs, tx.outputs);
  };
  Transaction.newCoinbaseTx = function(to=process.env.BLOCKCHAIN_MINER||"codeanand", data="Reward to "+to,subsidy=process.env.SUBSIDY||10){
    let input  = new TxInput(null, -1, data);
    let output = new TxOutput(subsidy, to);
    let tx     = new Transaction(null, [input], [output])
    return tx.setId();
  };

  // Export
  module.exports = {
    "TxInput"    : TxInput,
    "TxOutput"   : TxOutput,
    "Transaction": Transaction,
  };

})();
