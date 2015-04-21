# cluster-api
Api for manage a cluster of node

#API

##GET

###/status
Get status of all information

Return:

	{
		"cluster": {
			"pid": 2939,
			"cpu": "1%",
			"memory":24  //in Mb
		}
		"wokers":[
			{
				"id": 1,
				"pid": 2939,
				"cpu": "1%",
				"memory": 33 //in Mb
			},
			{
				"id": 1,
				"pid": 2940,
				"cpu": "1%",
				"memory": 33 //in Mb
			},
			{
				"id": 1,
				"pid": 2941,
				"cpu": "1%",
				"memory": 33 //in Mb
			},
			{
				"id": 1,
				"pid": 2942,
				"cpu": "1%",
				"memory": 33 //in Mb
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
			"memory": 33 //in Mb
		}
	}

###/restart
Restart the worker with :id parameter

Return:

	{
		"restart":true || false
	}

###/restart/:id
Restart one worker


###/shutdown
Shutdown all workers

###/shutdown/:id
Shutdown the worker with :id parameter

###/add
Add a worker to cluster

###/add/:number
Add a :number of workers to cluster

###/log
Get log of cluster
