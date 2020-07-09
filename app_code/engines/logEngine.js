const S3StreamLogger = require('s3-streamlogger').S3StreamLogger;

var s3stream = new S3StreamLogger({ bucket: config.s3LoggingBucket, name_format: isWebServer ? "WEBADMIN_" + port + ".txt" : "_" + port + ".txt"});

var reinitStream = function(){
	var name_format = "_" + port + ".txt";
	if (myIP && myIP.length > 0){
		name_format = myIP.replace(/\./g,"_") + "_" + port + ".txt";
	}
		
	if (isWebServer){
		name_format = "WEBADMIN_" + name_format;
	}
	

	var reinitYear = (new Date().getUTCFullYear()).toString();
	var reinitMonth = (new Date().getUTCMonth()+1).toString();
	if (reinitMonth.length === 1) {
		reinitMonth = "0" + reinitMonth;
	}
	var reinitDate = (new Date().getUTCDate()).toString();
	if (reinitDate.length === 1) {
		reinitDate = "0" + reinitDate;
	}
	
	s3stream = new S3StreamLogger({
	  bucket: config.s3LoggingBucket,
	  access_key_id: config.awsAccessKeyId,
	  secret_access_key: config.awsSecretAccessKey,
	  folder: reinitYear + '_' + reinitMonth + '_' + reinitDate,
	  name_format: name_format,
	  max_file_size: 500000000,
	  rotate_every: 86405000
	});
	s3stream.write("\r\n");
	logg("----------STREAMWRITER INITIALIZED WITH IP: " + myIP + "---------FOLDER: " + reinitYear + "_" + reinitMonth + "_" + reinitDate + "------------\r\n");		
}


global.log = function(msg) {	
	if (debug){
		logg(msg);
	}
}

global.logObj = function(obj){
	if (debug){
		logg(util.format(obj));
	}
}

global.logg = function(msg) {
	msg = msg.toString();
	var d = new Date();
	var hours = d.getUTCHours();
	if (hours <= 9){hours = "0" + hours;}
	var minutes = d.getUTCMinutes();
	if (minutes <= 9){minutes = "0" + minutes;}
	var seconds = d.getUTCSeconds();
	if (seconds <= 9){seconds = "0" + seconds;}
	
	var logMsgText = hours + ':' + minutes + '.' + seconds + '> ' + msg;
	console.log(logMsgText);	
	if (s3stream){
		s3stream.write(logMsgText+'\r\n');
	}	
}

module.exports.reinitStream = reinitStream;