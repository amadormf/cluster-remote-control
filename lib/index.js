'use strict';

var cluster = require('cluster'),
	pidusage = require('pidusage'),
	async = require('async')
;

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
		status(conf, req, res);
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


function status(conf,req,res){
	res.set('Content-Type', 'application/json');
	
	var statusResponse = {};

	statusResponse.workers = [];

	async.parallel([
		//get cluster status
		function(callback){
			pidusage.stat(process.pid, function(err,stats){
				if(err){
					callback(err);
				}
				else{					
					statusResponse.cluster = stats;
					callback();
				}
			});
		},
		function(callback){
			async.each(Object.keys(cluster.workers), function(id, done){
				getStatusWorker(id, function(err, stats){
					if(err){
						done(err);
					}
					else{
						stats.id = id;
						statusResponse.workers.push(stats);
						done();
					}	
				});
			},function(err){
				callback(err);
			});
		}
	],
	function(err, results){
		if(err){
			responseError(err);
		}
		else{
			res.send(JSON.stringify(statusResponse));
		}
	});
	

}

function getStatusWorker(id, callback){
	pidusage.stat(cluster.workers[id].process.pid, callback);
}

function responseError(err){
	res.status(500).send(err);
}

module.exports = clusterApi;
