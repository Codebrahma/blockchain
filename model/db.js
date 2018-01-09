const _         = require('underscore');
const Q         = require('Q');
const store     = require('scattered-store');

const Block     = require('./block.js');

(function(){
  function DBExceptionHandler(e){
    if(e){
      console.log("DATABASE ERROR: " + e);
      // console.error(e);
      // console.trace();
    };
  };

  // Base DB class : Wrapper class which interacts with underlying database
  function DB(DB_PATH){
    if(!DB_PATH){
      throw("DB_PATH not SET");
    };
    this._db = store.create(DB_PATH, (err) =>{
      if(err) {
        console.log(err)
      } else {
        console.log("DB Opeened" + DB_PATH);
      }
    })
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
        if(!v) throw("Value is undefined");
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
      this._db.set(k, v)
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
    DB.call(this, DB_PATH+'/chain');
  };
  let chainDBProto = {
    // Fetch key as a block instance
    $fetch: function(k){
      return this.$get(k).then( b => Block.deserialize(b) );
    },

    // Insert block into DB and then update TIP
    $append: function(block){
      let head = { 'lh' : block.getHash() };
      return this.$put(block.getHash(), block.serialize())
                 .then(() => this.$put('TIP', head))
                 .then(() => block);
    },

    // Check if the chain is empty { Chain is empty if 'TIP' is not set }
    $isEmpty: function(){
      var def = Q.defer();
      this._db.get('TIP').then(function(value){
        let empty = value ? false : true;
        return def.resolve(empty);
      });
      return def.promise;
    },

    // Fetch the tip and if TIP exists then block, if not null
    $fetchLast: function(){
      var def = Q.defer();
      this.$get('TIP')
        .then(v  => this.$fetch(v.lh) )
        .then(b  => def.resolve(b)    )
        .catch(e => def.resolve(null) );
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
        this.$fetch(prev).then(b => iterateOverChain(b), e=>def.reject(e));
      }.bind(this);
      this.$fetchLast().then(b => iterateOverChain(b), e=>def.reject(e));
      return def.promise;
    },
    $forEach: function(fn=()=>{}){
      var def = Q.defer();
      var iterateOverChain = function(block){
        if(!block) return def.resolve();
        fn(block);
        let prev  = block.getPrevHash();
        if(prev == "") return def.resolve();
        this.$fetch(prev).then(b => iterateOverChain(b), e=>def.reject(e));
      }.bind(this);
      this.$fetchLast().then(b => iterateOverChain(b), e=>def.reject(e));
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
        this.$fetch(prev).then(b => iterateOverChain(b), e=>def.reject(e));
      }.bind(this);
      this.$fetchLast().then(b => iterateOverChain(b), e=>def.reject(e));
      return def.promise;
    },
  };
  ChainDB.prototype = _.extend(Object.create(DB.prototype), chainDBProto);

  // Database Model which stores the wallet
  function WalletDB(DB_PATH){
    DB.call(this, DB_PATH+'/wallet');
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
