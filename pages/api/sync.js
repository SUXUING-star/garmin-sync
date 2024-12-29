// pages/api/sync.js
import GarminSync from '../../lib/garmin/sync';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { direction } = req.body;

    const sync = new GarminSync({
      cnUsername: process.env.GARMIN_CN_EMAIL,
      cnPassword: process.env.GARMIN_CN_PWD,
      globalUsername: process.env.GARMIN_GLOBAL_EMAIL,
      globalPassword: process.env.GARMIN_GLOBAL_PWD
    });

    let result;
    if (direction === 'cn_to_global') {
      result = await sync.syncCNToGlobal();
    } else {
      result = await sync.syncGlobalToCN();
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}