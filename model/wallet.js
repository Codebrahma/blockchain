const WDB       = require('./db.js').WalletDB;
const Elliptic  = require('../util/elliptic.js');

(function(){
  function Wallet(pub, priv){
    this.pubKey     = pub;
    this.privateKey = priv;
    return this;
  };
  Wallet.prototype = {
    $init: function(){
      return Wallet._db.$save(this);
    },
    $fetch: function(){
      let self = this;
      return Wallet._db.$get(this.pubKey).then(function(v){
        self.privateKey = v;
        return self;
      });
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
