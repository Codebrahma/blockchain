(function(){

	function cleanData(dt){
    switch(typeof dt){
      case "string":
        return dt
        break;

      case "object":
        return JSON.stringify(dt)
        break;

      case "number":
        return String(dt)
        break;
    };
  };

  module.exports = {
    "cleanData" : cleanData,
  };

}());