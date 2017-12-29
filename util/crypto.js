const crypto   = require('crypto');

(function(){

  function hashify(text){
    return crypto.createHmac('sha256', text).digest('hex')
  };

  // Export
  module.exports = {
    "hashify"    : hashify,
  };

})();