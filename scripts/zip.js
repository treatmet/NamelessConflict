const fs = require("fs");
const archiver = require("archiver");

if (process.argv.length < 3) {
  console.error("Example usage: node eb-deploy.js game");
  return;
}

const env = "Production";
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
  //var now = new Date();
  //config.fileName = `${config.name}-${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`
  //  + `_${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.zip`;

  config.fileName = `${config.name}.zip`;
  var output = fs.createWriteStream(`${__dirname}/../${config.relativePath}/${config.fileName}`);
  var archive = archiver('zip', {
    zlib: { level: 9 } // Sets the compression level.
  });

  output.on('close', function() {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
    resolve();
  });
  
  output.on('end', function() {
    console.log('Data has been drained');
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

(async () => {
  console.log(`Deploying ${app} service to ${env}`);

  await zip(config);

  //fs.unlinkSync(config.fileName);

  console.log("Done");
})()