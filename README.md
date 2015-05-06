# cluster-remote-control
Remote control API for manage a cluster of node

#INSTALL

	npm install --save cluster-remote-control

#API

##GET

###/status
Get status of all information

Return:

	{
		"cluster": {
			"pid": 2939,
			"cpu": "1%",
			"memory":24 
		}
		"wokers":[
			{
				"id": 1,
				"pid": 2939,
				"cpu": "1%",
				"memory": 33
			},
			{
				"id": 1,
				"pid": 2940,
				"cpu": "1%",
				"memory": 33
			},
			{
				"id": 1,
				"pid": 2941,
				"cpu": "1%",
				"memory": 33
			},
			{
				"id": 1,
				"pid": 2942,
				"cpu": "1%",
				"memory": 33
			},
		]
	}


###/status/:id
Get status of one worker

Return:

	{
		"worker":{
			"id": 1,
			"pid": 2939,
			"cpu": "1%",
			"memory": 33 
		}
	}

###/restart
Restart the worker with :id parameter

Return:

	{
		"restart": {
			"restarted":4
		};
	}
###/restart/:id
Restart one worker

Return:

	{
		"restart": {
			"restarted":1
		};
	}
	

###/shutdown
Shutdown all workers

Return:

	{
		"shutdown":[
			"worker":{
				"id": 1
				"shut": true || false
			}
			"worker":{
				"id": 2
				"shut": true || false
			}
			"worker":{
				"id": 3
				"shut": true || false
			}
			"worker":{
				"id": 4
				"shut": true || false
			}									
		]
	}

###/shutdown/:id
Shutdown the worker with :id parameter

Return:

	{
		"shutdown":{
			"worker":{
				"id":1,
				"shut":true
			}
		}
	}

###/add
Add a worker to cluster

Return:

	{
		"add":{
			"worker":{ //or null if the add no work
				"id":3,
				"pid":323
			}
		}
	}

###/add/:number
Add a :number of workers to cluster
	
	{
		"add":[
			"worker":{ //or null if the add no work
				"id":5,
				"pid":323
			},
			"worker":{ //or null if the add no work
				"id":6,
				"pid":324
			},
			"worker":{ //or null if the add no work
				"id":7,
				"pid":325
			},						
		]
	}
##Configuration

	{
		"port" : 3000,
		"app": app,  //if send express instance
		"listen": true, //if true init the listen express
		"path": "/cluster", //agregate path to the routes
	}

##Use

Example:

``` js
var cluster = require('cluster');
var http = require('http');
var numCPUs = require('os').cpus().length;
var clusterApi = require('cluster-api');

if (cluster.isMaster) {
	// Fork workers.
	for (var i = 0; i < numCPUs; i++) {
		cluster.fork();
	}

  	var conf = {
		"port" : 3000,
  	};
  	//launch API
  	clusterApi(conf, function(err){
	  	if(err){
	  		console.error(err);
		} 
		else{
			console.log("Launch api is ok");
		}
  	});
  //finish launch API
} else {
  // Workers can share any TCP connection
  // In this case its a HTTP server
  http.createServer(function(req, res) {
    res.writeHead(200);
    res.end("hello world\n");
  }).listen(8000);
}
```


###The MIT License (MIT)

Copyright (c) 2015 Amador Mateo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.