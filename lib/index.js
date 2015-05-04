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
	addRoutes(conf);
	initServer(conf, callback);

}

function addRoutes(conf){
	conf.app.get(conf.path + '/status', function(req,res){
		res.set('Content-Type', 'application/json');
		status(conf, req, res);
	});
	conf.app.get(conf.path + '/status/:id', function(req,res){
		res.set('Content-Type', 'application/json');
		statusWorker(req.params.id, function(err, stats){
			if(err){
				responseError(err,res);
			}
			else{
				res.send(JSON.stringify({worker:stats}));	
			}			
		});		
	});
	conf.app.get(conf.path + '/restart', function(req,res){
		res.set('Content-Type', 'application/json');
		restartAll(res);
	});
	conf.app.get(conf.path + '/restart/:id', function(req,res){
		res.set('Content-Type', 'application/json');
		restartWorker(req.params.id,res);
	});
	conf.app.get(conf.path + '/shutdown', function(req, res){
		res.set('Content-Type', 'application/json');
		shutdownAll(res);
	});
	conf.app.get(conf.path + '/shutdown/:id', function(req,res){
		res.set('Content-Type', 'application/json');
		shutdownWorker(req.params.id,res);
	});
	conf.app.get(conf.path + '/add', function(req,res){
		res.set('Content-Type', 'application/json');
		addWorker(res);
	});
	conf.app.get(conf.path + '/add/:numWorkers', function(req,res){
		res.set('Content-Type', 'application/json');
		addWorkers(req.params.numWorkers, res);
	});
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
	if(cluster.workers[id]){
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
	else{
		callback("No worker with id=" + id + " exists");
	}

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
		cluster.workers[id].kill('SIGHUP');
	});
}

function restartWorker(id,res){
	var onKill = function(worker, code, signal){
		if(worker.suicide){
			cluster.fork();
			res.send(JSON.stringify({restart:{
										restarted:1	
									}}));					
		}
		cluster.removeListener('exit', onKill);
	}
	if(cluster.workers[id]){
		cluster.on('exit', onKill);
		cluster.workers[id].kill();
	}
	else{
		responseError("No worker with id=" + id + " exists", res);
	}
}

function shutdownAll(res){
	var contKill = 0;	
	var workersSize = Object.keys(cluster.workers).length;	
	var onKill = function(worker, code, signal){
		if(worker.suicide){
			contKill++;
			if(contKill===workersSize){
				res.send(JSON.stringify({shutdown:{
											shutdown:contKill	
										}}));
				cluster.removeListener('exit', onKill);
			}
		}
	}
	cluster.on('exit', onKill);
	Object.keys(cluster.workers).forEach(function(id){
		cluster.workers[id].kill('SIGKILL');
	});
}



function shutdownWorker(id,res){
	var onKill = function(worker, code, signal){
		if(worker.suicide){
			res.send(JSON.stringify({shutdown:{
										shutdown:1	
									}}));					
		}
		cluster.removeListener('exit', onKill);
	}
	if(cluster.workers[id]){
		cluster.on('exit', onKill);
		cluster.workers[id].kill();		
	}
	else{
		responseError("No worker with id=" + id + " exists", res);
	}	
}

function addWorker(res){
	var worker = cluster.fork();
	res.send(JSON.stringify({
		add:{
			worker:{
				id: worker.id,
				pid: worker.process.pid
			}
		}
	}));
}

function addWorkers(numWorkers, res){
	var resultAdd = {
		add: []
	};
	for(var i = 0; i < numWorkers; ++i){
		var worker = cluster.fork();
		resultAdd.add.push({
			worker: {
				id: worker.id,
				pid: worker.process.pid				
			}
		});
	}
	res.send(JSON.stringify(resultAdd));
}

function responseError(err, res){
	res.status(500).send(JSON.stringify({error: err}));
}

module.exports = clusterApi;
