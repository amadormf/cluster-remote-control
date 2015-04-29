'use strict';


var request = require('request');

var host = 'http://localhost:3000';
module.exports = {
	getStatus : getStatus,
	getStatusWorker : getStatusWorker
}

function getStatus(callback){
	request(host + '/status', function(error, response, body){
		callback(error,JSON.parse(body));
	});
}
function getStatusWorker(id, callback){
	request(host + '/status/' + id, function(error, response,body){
		callback(error,JSON.parse(body));
	});
}