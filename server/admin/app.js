//2017-2020 Treat Metcalf
//Alpha Version

'use strict';
global.absAppDir = __dirname + "/../..";

//Crash handling
process
  .on('unhandledRejection', (reason, p) => {
	logg("--SERVER CRASH:Unhandled Rejection at Promise");
    logg("--" + reason);
	logObj(p);
  })
  .on('uncaughtException', err => {
	logg("--SERVER CRASH:Uncaught Exception thrown");
    logg(util.format(err));
    process.exit(1);
  });

//---------------------------------STARTUP---------------------------------------
require(absAppDir + '/server/admin/config.js');
require(absAppDir + '/server/admin/startup.js');
