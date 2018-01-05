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
    /*
      FETCH Key from DB
    */
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

    /*
      FETCH Key,Value to DB
    */
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
    // Fetch key as a block instance
    $fetch: function(k){
      return this.$get(k).then( Block.deserialize );
    },

    // Insert block into DB and then update TIP
    $append: function(block){
      let head = { 'lh' : block.getHash() };
      return this.$put(block.getHash(), block.serialize())
                 .then(() => this.$put('TIP', head))
    },

    // Check if the chain is empty { Chain is empty if 'TIP' is not set }
    $isEmpty: function(){
      var def = Q.defer();
      this._db.get('TIP', function(error, value){
        let empty = error ? true : false;
        return def.resolve(empty);
      });
      return def.promise;
    },

    // Fetch the tip and if TIP exists then block, if not null
    $fetchLast: function(){
      var def = Q.defer();
      this.$get('TIP').then(function(v){
        this.$fetch(v.lh).then(def.resolve, def.reject);
      }, function(){
        def.resolve(null); // TIP NOT SET
      });
      return def.promise;
    },

    // Append based on condition vfn on block,tip
    $verifyAndAppend: function(block, vfn){
      return this.$fetchLast()
        .then(function(prev){
          var def = Q.defer();
          vfn(block, prev) ? def.resolve(true) : def.reject(false);
          return def.promise;
        })
       .then(() => this.$append(block));
    },


    /*
      Functions to iterate over the blockchain
    */
    $reduce: function(fn=()=>{}, v){
      var def = Q.defer();
      var iterateOverChain = function(block){
        if(!block) return def.resolve(v);
        v = fn(block, v);
        let prev  = block.getPrevHash();
        if(prev == "") return def.resolve(v);
        this.$fetch(prev).then(iterateOverChain, def.reject);
      }.bind(this);
      this.$fetchLast().then(iterateOverChain, def.reject);
      return def.promise;
    },
    $forEach: function(fn=()=>{}){
      var def = Q.defer();
      var iterateOverChain = function(block){
        if(!block) return def.resolve();
        fn(block);
        let prev  = block.getPrevHash();
        if(prev == "") return def.resolve();
        this.$fetch(prev).then(iterateOverChain, def.reject);
      }.bind(this);
      this.$fetchLast().then(iterateOverChain, def.reject);
      return def.promise;
    },
    $filter: function(fn=()=>{}){
      let def = Q.defer();
      let results = [];
      var iterateOverChain = function(block){
        if(!block) return def.resolve(results);
        if(fn(block)) results.push(block);
        let prev = block.getPrevHash();
        if(prev == "") return def.resolve(results);
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
