var cluster = require('cluster');
var http = require('http');
var numCPUs = 4;
var clusterApi = require('../index');

if (cluster.isMaster) {
  // Fork workers.
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  var conf = {

		"port" : 3000,
		"onrestart": function(){},
		"onshutdwon": function(){},
		"onadd": function(){}
  };

  //launch API
  clusterApi(conf, function(err){
  	if(err){
  		console.error(err);
		} 
		else{
  		console.log("Launch api is ok");
  	}
  });
  //finish launch API
} else {
  // Workers can share any TCP connection
  // In this case its a HTTP server
  http.createServer(function(req, res) {
    res.writeHead(200);
    res.end("hello world\n");
  }).listen(8000);
}