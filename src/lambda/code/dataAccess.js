const mongojs = require('mongojs');
const ObjectId = require('mongodb').ObjectID;
var db = mongojs(mongoDbLocation, ['RW_USER','RW_USER_PROG','RW_SERV','RW_FRIEND', 'RW_REQUEST']);

var dbUpdateAwait = function(table, action, searchObj, updateObj, cb){
	if (action == "set"){
		db[table].update(searchObj, {$set: updateObj}, {multi: true}, function (err, res, status) {
			if (!err){
				logg("DB: " + table + " " + action + " - " + JSON.stringify(searchObj) + " - " + JSON.stringify(updateObj));
				cb(false, res.n);
			}
			else {
				logg("DB ERROR - " + table + " " + action + " - " + JSON.stringify(searchObj) + " - " + JSON.stringify(updateObj) + " ERROR MESSAGE: " + err);	
				cb("Error updating " + table, 0);
			}
		});		
	}
	else if (action == "ups"){
		db[table].update(searchObj, {$set: updateObj}, {upsert:true, multi: true}, function (err, res, status) {
			if (!err){
				logg("DB: " + table + " " + action + " - " + JSON.stringify(searchObj) + " - " + JSON.stringify(updateObj));
				cb(false, res.n);
			}
			else {
				logg("DB ERROR - " + table + " " + action + " - " + JSON.stringify(searchObj) + " - " + JSON.stringify(updateObj) + " ERROR MESSAGE: " + err);	
				cb("Error updating " + table, 0);
			}
		});		
	}
	else if (action == "inc"){
		db[table].update(searchObj, {$inc: updateObj}, {multi: true}, function (err, res, status) {
			if (!err){
				logg("DB: " + table + " " + action + " - " + JSON.stringify(searchObj) + " - " + JSON.stringify(updateObj));
				cb(false, res.n);
			}
			else {
				logg("DB ERROR - " + table + " " + action + " - " + JSON.stringify(searchObj) + " - " + JSON.stringify(updateObj) + " ERROR MESSAGE: " + err);			
				cb("Error updating " + table, 0);
			}
		});	
	}	
	else if (action == "rem"){
		db[table].remove(searchObj, function(err, result) {
			if (!err){
				if (result.deletedCount > 0)
					logg("DB: " + result.deletedCount + " document(s) deleted - " + JSON.stringify(searchObj));
				cb(false, result.deletedCount);
			}
			else {
				logg("DB ERROR - " + table + " " + action + " - " + JSON.stringify(searchObj) + " ERROR MESSAGE: " + err);		
				cb("Error updating " + table, 0);
			}
		});		
	}
}

var dbFindAwait = function(table, searchObj, cb){
	dbFindOptionsAwait(table, searchObj, {sort:{},limit:100}, async function(err, res){
		if (!err){
			cb(false, res);
		}
	});
}

/*
options:
{sort:{experience: -1},limit:100}
*/
var dbFindOptionsAwait = function(table, searchObj, options, cb){
	
	if (typeof options === 'undefined'){
		options = {sort:{},limit:100};
	}
	if (typeof options.sort === 'undefined'){
		options.sort = {};
	}
	if (typeof options.limit === 'undefined'){
		options.limit = 100;
	}
	
	db[table].find(searchObj).limit(options.limit).sort(options.sort, function(err,res){
		if (!err){
			if (typeof res === 'undefined'){
				res = [];
			}
			cb(false, res);			
		}
		else {		
			logg("DB ERROR - dbFindAwait() - " + table + " - " + JSON.stringify(searchObj) + " ERROR MESSAGE: " + err);
			cb("Error Searching " + table, []);
		}		
	});
}

module.exports.dbUpdateAwait = dbUpdateAwait;
module.exports.dbFindOptionsAwait = dbFindOptionsAwait;
module.exports.dbFindAwait = dbFindAwait;
