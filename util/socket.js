/*
  TCP web server to send / receive messages
  address : 127.0.0.1:9000
*/
const net  = require('net');
const Q    = require('Q');
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

  /*
    Starts websocket and listens
    Takes in a $messageHandler;
    messageHander resolves into a response
    => if response is present, it's sent back
  */
  Socket.prototype.listen = function(msgHandler=()=>{}){
    if(this.type != "server") throw("Invalid socket operation");
    console.log("Socket Server listening at : " + this.address);

    this.server  = net.createServer(function(socket){
      socket.setEncoding('utf8');
      socket.on('error',   SocketErrorHandler("Server message reception failed"));
      socket.on('timeout', SocketErrorHandler("Server message timeout"));

      socket.on('data', function(data){
        var data = data.toString();
        try{
          console.log("Payload : " + data);
          let resp = msgHandler(JSON.parse(data));
          resp = resp || { };
          resp = JSON.stringify(resp);
          console.log("Responding with : " + resp);
          socket.write(resp);
        } catch(e){ SocketErrorHandler("Server message handler failed")( e ) };
      });
    });

    this.server.listen(this.port, this.host);
  };

  /*
    sends message to server and fetches response
  */
  Socket.prototype.$message = function(dt){
    if(this.type != "client") throw("Invalid client operation");
    var def = Q.defer();
    console.log("Sending socket message to : " + this.address);
    console.log(dt);

    this.client = new net.Socket();
    this.client.on('error',   function(e){
      SocketErrorHandler("Message sending failed")(e);
      def.reject(e);
    });
    this.client.on('timeout', function(e){
      SocketErrorHandler("Message sending timeout")(e);
      def.reject(e);
    });

    let self = this;
    this.client.connect(this.port, this.host, function(){
      self.client.write(JSON.stringify(dt))
    });
    this.client.on('data', function(data){
      var data = data.toString();
      console.log("Server responded with : " + data);
      def.resolve(JSON.parse(data));
      self.client.destroy();
    });
    return def.promise;
  };

  module.exports = Socket;

}());
