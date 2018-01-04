var EC  = require('elliptic').ec;
var md5 = require('md5');

String.prototype.hexEncode = function(){
  var hex, i;
  var result = "";
  for (i=0; i<this.length; i++) {
    hex = this.charCodeAt(i).toString(16);
    result += ("000"+hex).slice(-4);
  };
  return result;
};

(function(){
  function Elliptic(){
    return this;
  };
  Elliptic.verify = function(pubKey, msg, signature){
    msg = md5(msg).hexEncode();
    var key = Elliptic.ec.keyFromPublic(pubKey,'hex');
    var x =  key.verify(msg, signature);
    return x;
  };
  Elliptic.sign = function(pvtKey, msg){
    msg = md5(msg).hexEncode();
    var key = Elliptic.ec.keyFromPrivate(pvtKey);
    return key.sign(msg).toDER('hex');
  };

  // Create and initialize EC context
  // (better do it once and reuse it)
  Elliptic.ec = new EC('secp256k1');

  // Export
  module.exports = Elliptic;
})();

//FIXME
//A VERY WEIRD ISSUE, I have changed the data but it is still verifying
//var data = 'e6cb0a3dfd1e8850d0c6cbea768aded74fb690175738b49a3968cef3c7feaa38104022cd59f1aa916fa52edefa150cfffcfc64290f5694db801f120a977315b29eddde912bb316e7145f378843eaaf25c8ebb3b0f1ead690177ba3f835c100034ddcodeanand0.0015';
//var sign = Elliptic.sign('905b6c7755f9354cf6977e4ca0e86f6f5874ed5e0a357ce9f418171d4f8d24f8', data);
//var truth = Elliptic.verify('04022cd59f1aa916fa52edefa150cfffcfc64290f5694db801f120a977315b29eddde912bb316e7145f378843eaaf25c8ebb3b0f1ead690177ba3f835c100034dd', data, sign);
//console.log(truth);