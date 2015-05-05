'use strict';

var cluster = require('cluster'),
	pidusage = require('pidusage'),
	async = require('async')
;

/**
 * Main function, init de server in the cluster
 * @author amadormf
 * @param  {Object} Object with configuration, view readme options
 * @param  {Function} Callback with 2 parameters, error and express server
 */
var clusterApi = function(conf, callback){
	conf = conf || {};
	conf.app = conf.app || require('express')();
	conf.port = conf.port || 3000;
	conf.listen = (typeof (conf.listen) === 'undefined') ? true : false;	
	conf.path = conf.path || '';
	addRoutes(conf);
	initServer(conf, callback);
}

/**
 * Add routes to express
 * @author amadormf
 * @param {Object} Configuratión options
 */
function addRoutes(conf){
	conf.app.get(conf.path + '/status', function(req,res){
		res.set('Content-Type', 'application/json');
		status(res);
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


/**
 * Initialize the server
 * @author amadormf
 * @param  {Object} Configuratión options
 * @param  {Function} Callback one paremeter (error)
 */
function initServer(conf, callback){
	if(conf.listen){
		conf.app.listen(conf.port, function(err){
			if(err){
				callback(err);
			}
			else{
				callback(null,conf.app);
			}
		});		
	}
	else{
		callback(null, conf.app);
	}
}

/**
 * Get the status of cluster an send response with this
 * @param  {Object} Response of express
 */
function status(res){
	res.set('Content-Type', 'application/json');
	
	var statusResponse = {};

	statusResponse.workers = [];

	async.parallel([
		//get the status of cluster process
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
		//get the status of workers
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

/**
 * Get the status of one worker
 * @author amadormf
 * @param  {Number} Id of worker for get status
 * @param  {Function}  Function callback with 2 parameters, error and status of worker
 */
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

/**
 * Restart all workers
 * @author amadormf
 * @param  {Object} Response
 */
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
		cluster.workers[id].kill('SIGINT');
	});
}

/**
 * [restartWorker description]
 * @author amadormf
 * @param  {[type]}
 * @param  {[type]}
 * @return {[type]}
 */
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
		cluster.workers[id].kill('SIGINT');
	}
	else{
		responseError("No worker with id=" + id + " exists", res);
	}
}

/**
 * Shutdown all workers
 * @author amadormf
 * @param  {Object} Response 
 */
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


/**
 * Shutdown one worker
 * @author amadormf
 * @param  {Number} id of worker for shutdown
 * @param  {[type]} Response
 */
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

/**
 * Add one worker to cluster
 * @author amadormf
 * @param  {Object} Response
 */
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

/**
 * Add a number of workers
 * @author amadormf
 * @param  {Number} numWorkers Workers for add
 * @param  {Object} res Response of server
 */
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

/**
 * Send the erros in JSON
 * @author amadormf
 * @param  {String} err Message of error
 * @param  {Object} res Response
 */
function responseError(err, res){
	res.status(500).send(JSON.stringify({error: err}));
}

module.exports = clusterApi;
