// scripts/sync_cn.js
const { spawn } = require('child_process');
const path = require('path');

async function syncCN() {
  return new Promise((resolve, reject) => {
      const dailysyncPath = path.join(process.cwd(), 'lib', 'dailysync');
      const syncProcess = spawn('npm', ['run', 'sync_cn'], {
       cwd: dailysyncPath,
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