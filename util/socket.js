/*
  TCP web server to send / receive messages
  address : 127.0.0.1:9000
*/
const net  = require('net');

(function(){

  function SocketErrorHandler(type){
    return function(e){
      console.log("Socket Error - " + type + " : " + e);
    };
  };

  function Socket(address, type){
    let p = address.split(":");
    this.host = p[ 0 ];
    this.port = parseInt(p[ 1 ]);
    this.address = address;
    this.type = type;
  };

  Socket.prototype.startServer = function(msgHandler=()=>{}){
    if(this.type != "server") throw("Invalid socket operation");

    console.log("Socket Server listening at : " + this.address);

    this.server  = net.createServer(function(socket){
      socket.setEncoding('utf8');
      socket.on('error',   SocketErrorHandler("Server message reception failed"));
      socket.on('timeout', SocketErrorHandler("Server message timeout"));

      socket.on('data', function(data){
        var data = data.toString();
        try{
          msgHandler(JSON.parse(data));
        } catch(e){ SocketErrorHandler("Server message handler failed")( e ) };
      });
    });

    this.server.listen(this.port, this.host);
  };

  Socket.prototype.messageClient = function(dt){
    if(this.type != "client") throw("Invalid client operation");

    console.log("Sending socket message to : " + this.address);

    this.client = new net.Socket();
    this.client.on('error',   SocketErrorHandler("Client message reception failed"));
    this.client.on('timeout', SocketErrorHandler("Client message timeout"));

    let self = this;
    this.client.connect(this.port, this.host, function(){
      self.client.write(JSON.stringify(dt), function(){
        self.client.destroy();
      });
    });
  };

  module.exports = Socket;

}());
