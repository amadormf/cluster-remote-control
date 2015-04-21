# cluster-api
Api for manage a cluster of node

#API

##GET

	/status
	Get status of all information
	{
		"cluster": {
			"pid": 2939,
			"cpu": "1%",
			"memory":{

			}
		}
		wokers:[
			{	
				"id": 1,
				"pid": 2939,
				"cpu": "1%",
				"memory":{

				}
			},
			{

			}
		]
	}	


	/status/:id
	Get status of one worker

	/restart
	Restart the worker with :id parameter

	/restart/:id
	Restart one worker

	/shutdown
	Shutdown all workers

	/shutdown/:id
	Shutdown the worker with :id parameter

	/add
	Add a worker to cluster

	/add/:number
	Add a :number of workers to cluster

	/errors
	Get all errors in worker


