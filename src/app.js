const { spawn } = require('child_process');

const processes = [
  {
    name: "web1",
    process: spawn('node', ['./web-service/app.js', '8080'])
  },
  {
    name: "game1",
    process: spawn('node', ['./game-service/app.js', '3001'])
  }
];

processes.map(p => {
  p.process.stdout.on('data', (data) => {
    process.stdout.write(`[${p.name}] ${data}`);
  });
  
  p.process.stderr.on('data', (data) => {
    process.stderr.write(`[${p.name}] ${data}`);
  });
  
  p.process.on('close', (code) => {
    process.stdout.write(`[${p.name}] child process exited with code ${code}\n`);
  });
});