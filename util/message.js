const WSocket  = require('./socket.js');

(function(){

  const MESSAGE_TYPES = [
    "heartbeat",
  ]

  function Message(from, to){
    this.from = from;
    this.to   = to;
    this.client = new WSocket(this.to);
  };

  Message.prototype.send = function(cmd){
    this.client.messageClient({ command: cmd, from: this.from, to:this.to })
  };

  module.exports = Message;

}());
