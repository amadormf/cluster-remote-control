'use strict';

var spawn = require('child_process').spawn;
var Buffer = require('buffer');
var request = require('supertest');
var async = require('async');
var helper = require('./helpers/testhelper.js');

var host = 'http://localhost:3000';
request = request(host);

describe('Check the API of cluster', function(){
	var clusterExe;
	//run cluster
	before(function(done){
		clusterExe = spawn('node', ['./test/helpers/cluster_help.js']);
		clusterExe.stdout.on('data', function(data){
			console.log("data:", data.toString('utf8'));
			
			if(data.toString('utf8')==="Launch api is ok\n"){
				console.log("Launch test");
				done();
			}
		});
	});
	//kill cluster
	after(function(done){
		console.log("kill cluster");
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
});