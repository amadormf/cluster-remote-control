'use strict';


var clusterApi = function(conf, callback){
	conf = conf || {};
	conf.app = conf.app || require('express')();
	conf.port = conf.port || 3000;
	conf.listen = (typeof (conf.listen) === 'undefined') ? true : false;	

	addRoutes(conf);
	initServer(conf, callback);

}

function addRoutes(conf){
	conf.app.get('/status', function(req,res){
		res.set('Content-Type', 'application/json');
		res.send(JSON.stringify({hola:"hola"}));
	});
}

function initServer(conf, callback){
	conf.app.listen(conf.port, function(err){
		if(err){
			console.log(err);
		}
		else{
			console.log("Api iniciada");
			callback(null,conf.app);
		}
	});
}

module.exports = clusterApi;
