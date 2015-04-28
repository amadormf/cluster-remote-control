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
	conf.path = conf.path || '';
	if(conf.path){

	}
	addRoutes(conf);
	initServer(conf, callback);

}

function addRoutes(conf){
	conf.app.get('/status', function(req,res){
		res.set('Content-Type', 'application/json');
		status(conf, req, res);
	});
	conf.app.get('/status/:id', function(req,res){
		res.set('Content-Type', 'application/json');
		statusWorker(req.params.id, function(err, stats){
			if(err){
				responseError(err);
			}
			else{
				res.send(JSON.stringify({worker:stats}));	
			}			
		});		
	});
	conf.app.get('/restart', function(req,res){
		res.set('Content-Type', 'application/json');
		restartAll(res);
	});
	conf.app.get('/restart/:id', function(req,res){
		res.set('Content-Type', 'application/json');
		restartWorker(res);
	})
}

function initServer(conf, callback){
	conf.app.listen(conf.port, function(err){
		if(err){
			console.log(err);
		}
		else{
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
					stats.pid = process.pid;
					statusResponse.cluster = stats;					
					callback();
				}
			});
		},
		function(callback){
			async.each(Object.keys(cluster.workers), function(id, done){
				statusWorker(id, function(err, stats){
					if(err){
						done(err);
					}
					else{
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

function statusWorker(id, callback){
	pidusage.stat(cluster.workers[id].process.pid, function(err, stats){
		if(err){
			callback(err);
		}
		else{
			stats.id = id;
			stats.pid = cluster.workers[id].process.pid;
			callback(null, stats);
		}
	});
}

function restartAll(res){
	var workersSize = Object.keys(cluster.workers).length;
	var contKill = 0;
	var onKill = function(worker, code, signal){
		if(worker.suicide){
			cluster.fork();
			contKill++;
			if(contKill===workersSize){
				res.send(JSON.stringify({restart:{
											restarted:contKill	
										}}));
				cluster.removeListener('exit', onKill);
			}
		}
	}
	cluster.on('exit', onKill);
	Object.keys(cluster.workers).forEach(function(id){
		cluster.workers[id].kill();
	});
}

function restartWorker(res){
	var onKill = function(worker, code, signal){
		if(worker.suicide){
			cluster.fork();
			res.send(JSON.stringify({restart:{
										restarted:1	
									}}));					
		}
	}
	cluster.workers[req.params.id].kill();
}


function responseError(err){
	res.status(500).send(err);
}

module.exports = clusterApi;
