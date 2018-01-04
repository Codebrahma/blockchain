const _         = require('underscore');
const deferred  = require('deferred');
const levelup   = require('levelup');
const leveldown = require('leveldown');
const encode    = require('encoding-down');

const Block     = require('./block.js');

(function(){
  function DBExceptionHandler(e){
    if(e){
      console.log("DATABASE ERROR: " + e);
      console.error(e);
      console.trace();
    };
  };

  // Base DB class : Wrapper class which interacts with underlying database
  function DB(DB_PATH){
    if(!DB_PATH){
      throw("DB_PATH not SET");
    };
    this._db = levelup(encode(leveldown(DB_PATH), { valueEncoding: 'json' }));
    return this;
  };

  DB.prototype = {
    $get: function(k){
      var def = deferred();
      // Fetch element by key from DB
      this._db.get(k).then(function(v){
        return def.resolve(v);
      })
      // Call default exception hander and reject
      .catch(function(e){
        DBExceptionHandler(e);
        return deferred.reject(e);
      });
      return def.promise;
    },

    $put: function(k, v){
      var def = deferred();
      // Set element by key,value in DB
      this._db.put(k, v)
      .then(function(){
        return def.resolve([k,v]);
      })
      // Call default exception hander and reject
      .catch(function(e){
        DBExceptionHandler(e);
        return deferred.reject(e);
      });
      return def.promise;
    },
  };

  // Database Model which stores the blockchain
  /*
    DB structure
    TIP => hash_n Address of the last hash
    hash_1 => Serialized Block 1
    hash_2 => Serialized Block 2 ..
    hash_n => Serialized Block n
  */
  function ChainDB(DB_PATH){
    DB.call(this, DB_PATH);
  };
  let chainDBProto = {
    $fetch: function(k){
      // Wrap fetched element with Block
      return this.$get(k).then( Block.deserialize );
    },
    $isEmpty: function(){
      var def = deferred();
      // Chain is empty if 'TIP' is not set
      this._db.get('TIP', function(error, value){
        let empty = error ? true : false;
        return def.resolve(empty);
      });
      return def.promise;
    },
    $append: function(block){
      // Insert block into DB
      var insertNewBlock = function(){
        return this.$put(block.getHash(), block.serialize());
      }.bind(this);
      // Update reference to last block
      var updateLastBlock = function(){
        return this.$put('TIP', { 'lh' : block.getHash() });
      }.bind(this);
      return insertNewBlock().then(updateLastBlock);
    },
    $fetchLast: function(){
      // Get reference to last block
      var getLastBlockRef = function(){
        return this.$get('TIP');
      }.bind(this);
      // Fetch last block from DB
      var fetchLastBlock = function(v){
        return this.$fetch(v.lh);
      }.bind(this);
      return getLastBlockRef().then(fetchLastBlock);
    },
    // TODO: write a seperate reduce function
    $forEach: function(fn=()=>{}, res=[]){
      var def = deferred();

      var iterateOverChain = function(block){
        // Execute callback on the block
        res.push(fn(block));
        // Get prev_hash property from the block
        let prev  = block.getPrevHash();
        // Resolve function once we've traversed to the end
        if(prev == "") return def.resolve(res);
        // If not fetch the previous block
        this.$fetch(prev).then(iterateOverChain, def.reject);
      }.bind(this);

      this.$fetchLast().then(iterateOverChain, def.reject);

      return def.promise;
    },
  };
  ChainDB.prototype = _.extend(Object.create(DB.prototype), chainDBProto);

  // Database Model which stores the wallet
  function WalletDB(DB_PATH){
    DB.call(this, DB_PATH);
  };
  let walletDBProto = {
    $save: function(w){
      return this.$put(w.pubKey, w.privateKey);
    },
  };
  WalletDB.prototype = _.extend(Object.create(DB.prototype), walletDBProto);

  module.exports = {
    "DB"       : DB,
    "ChainDB"  : ChainDB,
    "WalletDB" : WalletDB,
  };
}());
