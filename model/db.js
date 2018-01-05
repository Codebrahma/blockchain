const _         = require('underscore');
const Q         = require('Q');
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
      var def = Q.defer();
      // Fetch element by key from DB
      this._db.get(k).then(function(v){
        return def.resolve(v);
      })
      // Call default exception hander and reject
      .catch(function(e){
        DBExceptionHandler(e);
        return def.reject(e);
      });
      return def.promise;
    },

    $put: function(k, v){
      var def = Q.defer();
      // Set element by key,value in DB
      this._db.put(k, v)
      .then(function(){
        return def.resolve([k,v]);
      })
      // Call default exception hander and reject
      .catch(function(e){
        DBExceptionHandler(e);
        return def.reject(e);
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
      var def = Q.defer();
      // Chain is empty if 'TIP' is not set
      this._db.get('TIP', function(error, value){
        let empty = error ? true : false;
        return def.resolve(empty);
      });
      return def.promise;
    },

    $verifyAndAppend: function(block, vfn){
      return this.$fetchLast()
      .then(function(prev){
        var def = Q.defer();
        vfn(block,prev) ? def.resolve(true) : def.reject(false);
        return def.promise;
      })
      .then(t => this.$append(block));
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
      var def = Q.defer();
      // Get reference to last block
      var getLastBlockRef = function(){
        return this.$get('TIP');
      }.bind(this);
      // Fetch last block from DB
      var fetchLastBlock = function(v){
        this.$fetch(v.lh).then(def.resolve);
      }.bind(this);
      getLastBlockRef().then(fetchLastBlock, def.reject);

      return def.promise;
    },
    $reduce: function(fn=()=>{}, v){
      var def = Q.defer();

      var iterateOverChain = function(block){

        // Execute callback on the block, with reduced val
        v = fn(block, v);
        // Get prev_hash property from the block
        let prev  = block.getPrevHash();
        // Resolve function with reduced value once we've traversed to the end
        if(prev == "") return def.resolve(v);
        // If not fetch the previous block
        this.$fetch(prev).then(iterateOverChain, def.reject);
      }.bind(this);

      //FIXME height of a 0 blockchain throws this exception
      this.$fetchLast().then(iterateOverChain, ()=>def.resolve(0));

      return def.promise;
    },
    $forEach: function(fn=()=>{}){
      var def = Q.defer();

      var iterateOverChain = function(block){
        // Execute callback on the block
        fn(block);
        // Get prev_hash property from the block
        let prev  = block.getPrevHash();
        // Resolve function once we've traversed to the end
        if(prev == "") return def.resolve();
        // If not fetch the previous block
        this.$fetch(prev).then(iterateOverChain, def.reject);
      }.bind(this);

      this.$fetchLast().then(iterateOverChain, def.reject);

      return def.promise;
    },
    $filter: function(fn=()=>{}){
      let def = Q.defer();
      let results = [];

      var iterateOverChain = function(block){
      // Execute callback on the block
        if(fn(block))results.push(block)

        // Get prev_hash property from the block
        let prev = block.getPrevHash();
        // Resolve function once we've traversed to the end
        if(prev == "") return def.resolve(results);

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
