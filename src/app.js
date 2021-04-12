const { spawn } = require('child_process');

global.gameInstanceCount = 4;
const gameProcesses = [];

for (let i = 1; i <= gameInstanceCount; i++) {
  gameProcesses.push({
    name: `game${i}`,
    process: spawn('node', ['./game-service/app.js', `300${i}`])
  });
}

gameProcesses.map(p => {
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

require('./web-service/app');