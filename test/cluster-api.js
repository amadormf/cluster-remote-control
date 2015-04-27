'use strict';

var spawn = require('child_process').spawn;
var Buffer = require('buffer');
var request = require('supertest');

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
					var resp = JSON.parse(res.text);
					console.log(resp);					
					done();
				}
			});						
	});
});