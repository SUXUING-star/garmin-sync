// scripts/sync_cn.js
const { spawn } = require('child_process');
const path = require('path');

async function syncCN() {
  return new Promise((resolve, reject) => {
    const dailysyncPath = path.join(process.cwd(), 'lib', 'dailysync');
    const syncProcess = spawn('yarn', ['sync_cn'], {
      cwd: dailysyncPath,
      shell: true,
      stdio: 'pipe'
    });

    let output = '';

    syncProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(data.toString());
    });

    syncProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    syncProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Sync failed with code ${code}`));
      }
    });
  });
}

syncCN().catch(console.error);

// scripts/sync_global.js
const { spawn } = require('child_process');
const path = require('path');

async function syncGlobal() {
  return new Promise((resolve, reject) => {
    const dailysyncPath = path.join(process.cwd(), 'lib', 'dailysync');
    const syncProcess = spawn('yarn', ['sync_global'], {
      cwd: dailysyncPath,
      shell: true,
      stdio: 'pipe'
    });

    let output = '';

    syncProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log(data.toString());
    });

    syncProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    syncProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Sync failed with code ${code}`));
      }
    });
  });
}

syncGlobal().catch(console.error);