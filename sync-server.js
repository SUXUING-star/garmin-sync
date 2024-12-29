// sync-server.js
const express = require('express');
const { exec } = require('child_process');
const { promisify } = require('util');
const cors = require('cors');

const execAsync = promisify(exec);
const app = express();

app.use(cors());
app.use(express.json());

app.post('/sync', async (req, res) => {
  try {
    const { type } = req.body;
    const command = type === 'cn_to_global' ? 'yarn sync_cn' : 'yarn sync_global';
    
    const { stdout, stderr } = await execAsync(command);
    console.log('Sync output:', stdout);
    
    if (stderr) {
      console.error('Sync error:', stderr);
    }
    
    res.json({ success: true, output: stdout });
  } catch (error) {
    console.error('Error executing sync:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Sync server running on port ${PORT}`);
});