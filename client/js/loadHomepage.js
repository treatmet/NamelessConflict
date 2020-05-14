var mongoDbLocation = 'mongodb://RWsystem:RWPa55y3!@rw-database-shard-00-00-aywyv.mongodb.net:27017,rw-database-shard-00-01-aywyv.mongodb.net:27017,rw-database-shard-00-02-aywyv.mongodb.net:27017/RWAR?ssl=true&replicaSet=RW-Database-shard-0&authSource=admin&retryWrites=true';

///MongoDB
var mongojs = require('mongojs');
var db = mongojs(mongoDbLocation, ['RW_USER','RW_USER_PROG']);

log("testing db");
db.RW_USER.find({USERNAME:"testuser"}, function(err,res){
	if (res[0]){
		log("TESTING DB: found testuser");
	}
	else {
		log("TESTING DB: didnt found testuser");
	}
});




