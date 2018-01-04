const WDB       = require('./db.js').WalletDB;
const Elliptic  = require('../util/elliptic.js');
const DB_PATH = process.env.DB_PATH;

(function(){
  function Wallet(priv,pub){
    this.privateKey = priv;
    this.pubKey     = pub;
    if(!priv)
      this.newKeyPair();
    return this;
  };
  Wallet.DB = new WDB(DB_PATH+"/wallet")
  Wallet.$fetch = function(ky){
    return Wallet.DB.$get(ky).then(function(v){
      return new Wallet(v, ky);
    });
  };
  Wallet.prototype = {
    $init: function(){
      return Wallet.DB.$save(this);
    },
    newKeyPair: function(){
      var key         = Elliptic.ec.genKeyPair();
      this.privateKey = key.getPrivate('hex');
      this.pubKey     = key.getPublic().encode('hex');
    }
  };
  // Export
  module.exports = Wallet;
})();
