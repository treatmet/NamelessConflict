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