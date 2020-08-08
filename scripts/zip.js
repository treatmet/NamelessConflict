const fs = require("fs");
const archiver = require("archiver");

if (process.argv.length < 3) {
  console.error("Example usage: node eb-deploy.js game");
  return;
}

const app = process.argv[2];

const configs = {
  "game": {
    name: "GameService",
    relativePath: "packages/game-service"
  },
  "web": {
    name: "WebService",
    relativePath: "packages/web-service"
  }
};

const config = configs[app];

const zip = config => new Promise((resolve, reject) => {
  config.fileName = `${config.name}.zip`;

  const relativePath = `${config.relativePath}/${config.fileName}`;

  console.log(`Creating deployment artifact at ${relativePath}`);

  var output = fs.createWriteStream(`${__dirname}/../${config.relativePath}/${config.fileName}`);
  var archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  output.on('close', function() {
    const bytes = archive.pointer();
    const megabytes = Math.round(bytes / 100000) / 10;
    console.log(`Done. Size: ${megabytes} MB`);
    resolve();
  });
  
  output.on('end', function() {
    // TODO: do we care about this event?
  });
  
  archive.on('warning', function(err) {
    if (err.code === 'ENOENT') {
      console.warn(err);
    } else {
      reject(err);
    }
  });

  archive.on('error', function(err) {
    reject(err);
  });
  
  archive.pipe(output);
  
  archive.directory(config.relativePath, false);
  archive.directory("packages/client", "client");
  
  archive.finalize();
});

zip(config);