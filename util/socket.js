const net  = require('net');

(function(){

  function Socket(address){
    let p = address.split(":");
    this.host = p[ 0 ];
    this.port = p[ 1 ];
    this.address = address;
  };

  Socket.prototype.startServer = function(msgHandler){
    console.log("Server running at : " + this.address);
    this.server  = net.createServer(function(socket) {
      socket.on('data', function(data){
        var data = data.toString();
        msgHandler(JSON.parse(data));
      });
      socket.on('error', function(data){
        console.log("Scoket Error");
        console.log(data);
      });
    });
    this.server.listen(this.port, this.host);
  };

  Socket.prototype.messageClient = function(dt){
    let self = this;
    console.log("Connecting to : " + this.address);
    this.client = new net.Socket();
    this.client.connect(this.port, this.host, function(){
      self.client.write(JSON.stringify(dt));
    });
  };

  module.exports = Socket;

}());
