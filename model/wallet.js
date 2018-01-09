const WDB       = require('./db.js').WalletDB;
const Elliptic  = require('../util/elliptic.js');

(function(){
  function Wallet(pub, priv){
    var key ;
    if(!pub) key = Elliptic.ec.genKeyPair();

    this.pubKey     = pub  || key.getPublic().encode('hex');
    this.privateKey = priv || key.getPrivate('hex');
    
    return this;
  };

  Wallet.fetch = function(pubKey){
      return Wallet._db.$get(pubKey).then((privKey)=>{
        return new Wallet(pubKey, privKey)
      });
  };
  Wallet.prototype = {
    $save: function(){
      return Wallet._db.$save(this);
    },
  };

  Wallet.init = function(DB_PATH){
    this._path = DB_PATH;
    this._db   = new WDB(DB_PATH);
  };

  Wallet.new = function(){
    var key         = Elliptic.ec.genKeyPair();
    let privateKey  = key.getPrivate('hex');
    let pubKey      = key.getPublic().encode('hex');
    return new Wallet(pubKey, privateKey);
  };

  // Export
  module.exports = Wallet;
})();
