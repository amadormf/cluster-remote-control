'use strict';

var spawn = require('child_process').spawn;
var Buffer = require('buffer');
var request = require('supertest');
var async = require('async');
var helper = require('./helpers/testhelper.js');
var _ = require('lodash');

var host = 'http://localhost:3000';
request = request(host);

describe('Check the API of cluster', function(){
	var clusterExe;
	//run cluster
	beforeEach(function(done){
		clusterExe = spawn('node', ['./test/helpers/cluster_help.js']);
		clusterExe.stdout.on('data', function(data){
			console.log("data:", data.toString('utf8'));
			
			if(data.toString('utf8')==="Launch web api is ok\n"){
				console.log("Launch test");
				done();
			}
		});
	});
	//kill cluster
	afterEach(function(done){
		clusterExe.kill('SIGINT');
		done();
	});


	it('Check express is open', function(done){
		request
			.get('/status')
			.expect(200)
			.expect('Content-Type', /application\/json/)
			.end(function(err,res){
				if(err){
					console.log("Not found");
					done(err);					
				}
				else{				
					done();
				}
			});
	});

	it('Check status function', function(done){
		request
			.get('/status')
			.expect(200)
			.expect('Content-Type', /application\/json/)
			.end(function(err,res){
				if(err){
					done(err);
				}
				else{
					var result = JSON.parse(res.text);
					expect(result).to.have.property('cluster');
					expect(result).to.have.deep.property('cluster.pid');
					expect(result).to.have.deep.property('cluster.cpu');
					expect(result).to.have.deep.property('cluster.memory');
					expect(result.workers).to.be.a('array');
					expect(result.workers[0]).to.have.property('id');
					expect(result.workers[0]).to.have.property('pid');
					expect(result.workers[0]).to.have.property('cpu');
					expect(result.workers[0]).to.have.property('memory');
					done();
				}
			});						
	});
	it('Check status for one worker', function(done){
		async.waterfall([			
			helper.getStatus,
			function(statusAll, cb){
				var worker = statusAll.workers[0];
				request
					.get('/status/' + worker.id)
					.expect(200)
					.expect('Content-Type', /application\/json/)
					.end(function(err,res){
						if(err){
							cb(err);
						}
						else{
							var result = JSON.parse(res.text);
							expect(result.worker).to.have.property('id');
							expect(result.worker).to.have.property('pid');
							expect(result.worker).to.have.property('cpu');
							expect(result.worker).to.have.property('memory');
							cb();
						}						
					});			
			}
		], done);
	});
	it('Restart all workers', function(done){
		async.series([
			function(callback){
				request
					.get('/restart')
					.expect(200)
					.expect('Content-Type', /application\/json/)
					.end(function(err,res){
						if(err){
							callback(err);
						}
						else{
							var result = JSON.parse(res.text);					
							expect(result).to.have.deep.property('restart.restarted');
							expect(result.restart.restarted).to.be.a('number');										
							callback();
						}
					});	
			},
			function(callback){
				helper.getStatus(function(error, body){
					callback();
				});
			}
		], done)
	
	});	
	it('Restart one worker', function(done){
		var idWorker = 0;
		async.waterfall([			
			helper.getStatus,
			function(statusAll, cb){
				var worker = statusAll.workers[0];
				idWorker = worker.id;
				request
					.get('/restart/' + worker.id)
					.expect(200)
					.expect('Content-Type', /application\/json/)
					.end(function(err,res){
						if(err){
							cb(err);
						}
						else{
							var result = JSON.parse(res.text);					
							expect(result).to.have.deep.property('restart.restarted');
							expect(result.restart.restarted).to.be.a('number');										
							cb();
						}						
					});			
			},
			function(cb){
				helper.getStatusWorker(idWorker, function(err, body){
					cb();
				});
			}

		],done);
	});
	it('Shutdown all workers', function(done){
		async.waterfall([
		    helper.getStatus,
		    function(statusAll, cb){
		    	request
		    		.get('/shutdown')
		    		.expect(200)
		    		.expect('Content-Type', /application\/json/)
		    		.end(function(err, res){
		    			if(err){
		    				cb(err);
		    			}
		    			else{
							var result = JSON.parse(res.text);					
							expect(result).to.have.deep.property('shutdown.shutdown');
							expect(result.shutdown.shutdown).to.be.a('number');										
							cb(null,statusAll);
		    			}
		    		});
		    },
		    function(beginStatus, cb){
		    	helper.getStatus(function(err, status){
		    		cb(err, beginStatus, status);
		    	});
		    },
		    function(beginStatus, actualStatus, cb){
		    	expect(beginStatus.workers.length).to.not.equal(actualStatus.workers.length);
		    	expect(actualStatus.workers.length).to.equal(0);
		    	cb();
		    }
		], done)
	});
	it('Shutdown one worker', function(done){
		async.waterfall([
			helper.getStatus,
			function(statusAll, cb){
				var worker = statusAll.workers[0];
				request
					.get('/shutdown/' + worker.id)
					.expect(200)
					.expect('Content-Type', /application\/json/)
					.end(function(err,res){
						if(err){
							cb(err);
						}
						else{
							var result = JSON.parse(res.text);
							expect(result).to.have.deep.property('shutdown.shutdown');						
							expect(result.shutdown.shutdown).to.be.a('number');
							expect(result.shutdown.shutdown).to.equal(1);							
							cb(null,statusAll, worker);
						}
					});
			},
			function(beginStatus, worker, cb){
				helper.getStatus(function(err, status){
					cb(err,beginStatus, worker, status);
				});
			},
			function(beginStatus, worker, actualStatus, cb){
				expect(beginStatus.workers.length).to.equal(actualStatus.workers.length+1);
				expect(_.map(actualStatus.workers), function(item){
					return item.id;
				}).to.not.include(worker.id);
				cb();
			}
		],done);

	});
	it('Add one worker', function(done){
		async.waterfall([
			helper.getStatus,
			function(statusAll, cb){
				request
					.get('/add')
					.expect(200)
					.expect('Content-Type', /application\/json/)
					.end(function(err,res){
						if(err){
							cb(err);
						}
						else{
							var result = JSON.parse(res.text);
							expect(result).to.have.deep.property('add.worker.id');
							expect(result).to.have.deep.property('add.worker.pid');
							cb(null,statusAll, result.add.worker);
						}
					});
			},
			function(beginStatus, worker, cb){
				helper.getStatus(function(err,status){
					cb(err,beginStatus, worker, status);
				});
			},
			function(beginStatus, worker, actualStatus, cb){
				expect(beginStatus.workers.length).to.equal(actualStatus.workers.length-1);
				expect(_.map(actualStatus.workers), function(item){
					return item.id;
				}).to.not.include(worker.id);
				cb();
			}
		], done);
	});
	it('Add a especific number of workers', function(done){
		async.waterfall([
			helper.getStatus,
			function(statusAll, cb){
				request
					.get('/add/3')
					.expect(200)
					.expect('Content-Type', /application\/json/)
					.end(function(err,res){
						if(err){
							cb(err);
						}
						else{
							var result = JSON.parse(res.text);
							expect(result.add.length).to.equal(3);
							expect(result.add[0]).to.have.deep.property('worker.id');
							expect(result.add[0]).to.have.deep.property('worker.pid');
							cb(null,statusAll);
						}
					});
			},
			function(beginStatus, cb){
				helper.getStatus(function(err,status){
					cb(err,beginStatus, status);
				});
			},
			function(beginStatus, actualStatus, cb){
				expect(beginStatus.workers.length).to.equal(actualStatus.workers.length-3);
				cb();
			}
		], done);
	});
	it('Get the log of cluster');
});