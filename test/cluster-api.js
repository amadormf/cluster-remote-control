'use strict';

var spawn = require('child_process').spawn;
var Buffer = require('buffer');

describe('Check the API of cluster', function(){
	var clusterExe;
	before(function(done){
		clusterExe = spawn('node', ['./test/helpers/cluster_help.js']);
		clusterExe.stdout.on('data', function(data){
			console.log("data:", data.toString('utf8'));
			
			if(data.toString('utf8')==="Launch api is ok"){
				console.log("Launch test");
				done();
			}
		});
	});
	after(function(done){
		clusterExe.kill('SIGHUP');
		done();
	});

	it('Check express is open', function(done){
		done();
	});
});