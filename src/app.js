const { spawn } = require('child_process');

const processes = [
  {
    name: "web1",
    process: spawn('node', ['./hello-service/app.js', '8080'])
  },
  {
    name: "game1",
    process: spawn('node', ['./hello-service/app.js', '3001'])
  }
];

processes.map(p => {
  p.process.stdout.on('data', (data) => {
    console.log(`[${p.name}] ${data}`);
  });
  
  p.process.stderr.on('data', (data) => {
    console.error(`[${p.name}] ${data}`);
  });
  
  p.process.on('close', (code) => {
    console.log(`[${p.name}] child process exited with code ${code}`);
  });
});