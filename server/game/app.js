//2017-2020 Treat Metcalf
//Alpha Version

'use strict';
require('server-shared');
require('../shared/helperFunctions.js');
require('./config.js');
require('../shared/engines/logEngine.js');

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
require('./startup.js');