var EC = require('elliptic').ec;
// Create and initialize EC context
// (better do it once and reuse it)
var ec = new EC('secp256k1');

(function(){
  function Wallet(){
    this.privateKey;
    this.pubKey;
    this.newKeyPair();
  };

  Wallet.prototype = {
    newKeyPair: function(){
      var key = ec.genKeyPair();
      this.privateKey = key.getPrivate('hex');
      this.pubKey     = key.getPublic().encode('hex');
    }
  };

  function Elliptic(){
  }
  Elliptic.verify = function(pubKey, msg, signature){
    var key = ec.keyFromPublic(pubKey,'hex');
    return key.verify(msg, signature);
  };
  Elliptic.sign = function(pvtKey, msg){
    var key = ec.keyFromPrivate(pvtKey);
    return key.sign(msg).toDER('hex');
  };

  // Export
  module.exports = {
    "Wallet": Wallet,
    "Elliptic": Elliptic,
  };

})();

//TODO remove
//var w = new Wallet();
//var sign = Elliptic.sign(w.privateKey, 'anand');
//Elliptic.verify(w.pubKey, 'anand', sign);