const S3StreamLogger = require('s3-streamlogger').S3StreamLogger;
global.util = require('util');

var s3stream = new S3StreamLogger({ bucket: s3LoggingBucket, name_format: "LAMBDA_ADMIN.txt"});

var reinitStream = function(){
	var name_format = "LAMBDA_ADMIN.txt";		

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
	  bucket: s3LoggingBucket,
	  folder: reinitYear + '_' + reinitMonth + '_' + reinitDate,
	  name_format: name_format,
	  max_file_size: 500000000,
	  rotate_every: 86405000
	});
	s3stream.write("\r\n");
	logg("----------STREAMWRITER INITIALIZED---------FOLDER: " + reinitYear + "_" + reinitMonth + "_" + reinitDate + "------------\r\n");		
}


global.log = function(msg) {	
	logg(msg);
}

global.logObj = function(obj){
    logg(util.format(obj));
}

global.logg = function(msg) {

	//Check if next UTC day for updating log file folder (reinitialize stream)
	if (currentStreamingDay != new Date().getUTCDate()){
		reinitStream();
		currentStreamingDay = new Date().getUTCDate();
	}	

	try {

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
	catch(e){
		console.log("!!! ERROR LOGGING !!! May be a problem accessing S3");
	}

}

reinitStream();

module.exports.reinitStream = reinitStream;