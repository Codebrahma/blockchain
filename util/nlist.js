(function(){
  /*
    This service acts as a local address book for miners in the network
    The list cleans itself (ie) removes inactive miners
  */

  function NodeList(selfAddress="localhost", INACTIVITY=-1){
    this.list = { };
    this.delay = INACTIVITY;
    this.selfAddress = selfAddress;

    // Periodically remove inactive connections
    if(INACTIVITY > 0)
      this.interval = setInterval(() => this.unregisterInActive(), this.delay/2);
  };

  NodeList.prototype = {
    register: function(dt){
      if(dt.from == this.selfAddress) // Don't register current node
        return;
      this.list[dt.from] = dt;
      this.list[dt.from].requestTime = new Date();
      console.log("Registered node : " + dt.from);
    },
    unregister: function(dt){
      delete this.list[dt.from];
      console.log("Removed node : " + dt.from);
    },
    unregisterInActive: function(){
      console.log("Inactive connections being removed");
      let currentTime = new Date();
      let nodes = Object.keys(this.list);
      for(let nid in nodes){
        let address = nodes[nid];
        let node    = this.list[address];
        if(Math.abs(currentTime - node.requestTime) > this.delay){
          delete this.list[address];
          console.log("Removed node : " + address);
        };
      };
    },
    updateList: function(lst){
      for(let id in lst){
        this.register(lst[ id ]);
      }
      return this.selfAddress;
    },
  };

  module.exports = NodeList;
}());
