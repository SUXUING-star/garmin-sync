// pages/api/sync.js
import GarminSync from '../../lib/garmin/sync';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Received sync request');

  try {
    const { direction } = req.body;
    console.log('Sync direction:', direction);

    // 验证环境变量
    if (!process.env.GARMIN_CN_EMAIL || !process.env.GARMIN_CN_PWD || 
        !process.env.GARMIN_GLOBAL_EMAIL || !process.env.GARMIN_GLOBAL_PWD) {
      console.error('Missing environment variables');
      throw new Error('缺少必要的环境变量配置');
    }

    const sync = new GarminSync({
      cnUsername: process.env.GARMIN_CN_EMAIL,
      cnPassword: process.env.GARMIN_CN_PWD,
      globalUsername: process.env.GARMIN_GLOBAL_EMAIL,
      globalPassword: process.env.GARMIN_GLOBAL_PWD
    });

    console.log('Starting sync process');

    let result;
    if (direction === 'cn_to_global') {
      result = await sync.syncCNToGlobal();
    } else if (direction === 'global_to_cn') {
      result = await sync.syncGlobalToCN();
    } else {
      throw new Error('无效的同步方向');
    }

    console.log('Sync completed successfully:', result);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '同步失败',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}