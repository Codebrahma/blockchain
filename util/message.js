const Q        = require('q');
const _        = require('underscore');
const WSocket  = require('./socket.js');
const logem    = require('logem');

(function(){

  var capitalize = function(s) { return s.charAt(0).toUpperCase() + s.slice(1) };

  function MessagerrorHandler(type){
    return function(e){
      logem.error("Messaging Error - " + type + " : " + e);
    };
  };

  function Messenger(from, to=from){
    this.from = from;
    this.to   = to;
    this.socket = new WSocket(this.to, type="client");
  };

  Messenger.prototype = {
    $to: function(to, cmd, data){
      return new Messenger(this.from, to).$send(cmd, data)
    },
    $send: function(cmd, data={}){
      logem.debug(cmd + " to " + this.to);
      return this.socket.$message({
        command: cmd,
        from   : this.from,
        to     : this.to,
        data   : data,
      });
    },
    $broadcast: function(nList, cmd, data={}){
      let self = this.from;
      let broadcast = _.map(nList.list, function(d, to){
        return new Messenger(self, to).$send(cmd, data);
      });
      return Q.allSettled(broadcast).then( d => _.map(d, v => v.value) );
    },
  };

  function MessageHandler(address){
    this.address = address;
    this.socket  = new WSocket(this.address, type="server");
  };

  MessageHandler.prototype = {
    // To overridden
    onHeartbeat  : ()=>{},
    onRegister   : ()=>{},
    onUnregister : ()=>{},
    onMinerlist  : ()=>{},
    onVersion    : ()=>{},
    onBlockchain : ()=>{},
    onDefault    : (dt)=>{ MessagerrorHandler("Unrecognized command")(dt) },

    listen: function(){
      var self = this;
      this.socket.listen(function(d){
        return self.onMessage(d);
      });
    },

    on: function(v,h){
      this["on"+capitalize(v)] = h;
    },

    onMessage: function(dt){
      logem.debug(dt);
      if(!dt.command || !dt.from || !dt.to){
        MessagerrorHandler("Invalid message format")(dt);
        return;
      };
      let cmd = dt.command;
      let fn  = this[ "on" + capitalize(cmd) ];
      logem.debug(cmd + " from " + dt.from);
      return ( fn ? fn(dt) : MessagerrorHandler("Handler missing")(dt) );
    }
  };

  module.exports = {
    "Messenger": Messenger,
    "MessageHandler": MessageHandler,
  };

}());
