'use strict';

var spawn = require('child_process').spawn;

describe('Check the API of cluster', function(){
	var clusterExe;
	before(function(done){
		clusterExe = spawn('node', ['./helpers/cluster_help.js']);
		done();
	});

	it('Check express is open', function(done){
		done();
	});
});