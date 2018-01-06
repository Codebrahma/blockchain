const WSocket  = require('./socket.js');

(function(){

  var capitalize = function(s) { return s.charAt(0).toUpperCase() + s.slice(1) };

  function MessagerrorHandler(type){
    return function(e){
      console.log("Messaging Error - " + type + " : " + e);
    };
  };

  function Message(from, to){
    this.from = from;
    this.to   = to;
    this.socket = new WSocket(this.to, type="client");
  };

  Message.prototype.send = function(cmd){
    this.socket.messageClient({ command: cmd, from: this.from, to:this.to });
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
    onDefault    : (dt)=>{ MessagerrorHandler("Unrecognized command")(dt) },

    listen: function(){
      var self = this;
      this.socket.startServer(function(d){
        self.onMessage(d);
      });
    },

    on: function(v,h){
      this["on"+capitalize(v)] = h;
    },

    onMessage: function(dt){
      if(!dt.command || !dt.from || !dt.to){
        MessagerrorHandler("Invalid message format")(dt);
        return;
      };
      let cmd = dt.command;
      console.log("Received " + cmd + " from " + dt.from);
      let fn  = this[ "on" + capitalize(cmd) ];
      fn ? fn(dt) : MessagerrorHandler("Handler missing")(dt);
    }
  };

  module.exports = {
    "Message": Message,
    "MessageHandler": MessageHandler,
  };

}());
