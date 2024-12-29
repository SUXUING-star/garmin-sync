// pages/api/sync.js
export const config = {
  api: {
    bodyParser: true,
  },
};

async function runGarminSync(type) {
  try {
    const response = await fetch('http://localhost:3001/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    });
    
    if (!response.ok) {
      throw new Error(`Sync failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Sync error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type } = req.body;
    
    if (!type || !['cn_to_global', 'global_to_cn'].includes(type)) {
      return res.status(400).json({ error: 'Invalid sync type' });
    }

    const result = await runGarminSync(type);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in sync handler:', error);
    res.status(500).json({ error: 'Sync failed', details: error.message });
  }
}