var logOverflowThresh = 1000;
var lastDateLogged = new Date();

//Temporary log (deleteme if you see these messages)
function log(msg) {
	var d = new Date();
	if (d - lastDateLogged < logOverflowThresh) {return;}
	lastDateLogged = d;
	d.getHours(); // => 9
	d.getMinutes(); // =>  30
	d.getSeconds(); // => 51
	console.log(d.getHours() + ':' + d.getMinutes() + '.' + d.getSeconds() + '> ' + msg.toString());	
}

//Permanent log
function logg(msg) {
	log(msg);
}