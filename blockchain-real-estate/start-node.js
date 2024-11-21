const { spawn } = require('child_process');
const path = require('path');

const hardhatBin = path.join(__dirname, 'node_modules', '.bin', 'hardhat.cmd');
const child = spawn(hardhatBin, ['node'], { 
    stdio: 'inherit',
    shell: true
});

child.on('error', (error) => {
    console.error(`Error: ${error.message}`);
});
