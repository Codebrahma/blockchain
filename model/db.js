var deferred  = require('deferred');

const levelup   = require('levelup');
const leveldown = require('leveldown');
const encode    = require('encoding-down');

const Block   = require('./block.js');
const DB_PATH = process.env.DB_PATH;

(function(){

  if(!DB_PATH){
    throw("DB_PATH not SET");
  };

  /*
    Bucket structure
    TIP => hash_n Address of the last hash
    hash_1 => Serialized Block 1
    hash_2 => Serialized Block 2 ..
    hash_n => Serialized Block n
  */

  function DBExceptionHandler(e){
    if(e){
      console.log("DATABASE ERROR: " + e);
      console.error(e);
      console.trace();
    };    
  };

  function DB(){
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
        return def.resolve();
      })
      // Call default exception hander and reject
      .catch(function(e){
        DBExceptionHandler(e);
        return deferred.reject(e);
      });
      return def.promise;
    },

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

    $forEach: function(fn){
      var def = deferred();
      
      var fetchLast = function(){
        return this.$fetchLast();
      }.bind(this);

      var iterateOverChain = function(block){
        // Execute callback on the block
        fn(block);
        // Get prev_hash property from the block
        let prev  = block.getPrevHash();
        // Resolve function once we've traversed to the end 
        if(prev == "") return def.resolve();
        // If not fetch the previous block
        this.$fetch(prev).then(iterateOverChain);
      }.bind(this);

      fetchLast().then(iterateOverChain);

      return def.promise;
    },

  };

  module.exports = DB;
}());
