// pages/api/sync.js
import { Garmin } from '../../lib/garmin';

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { direction } = req.body;

    // 获取环境变量中的账号信息
    const CN_EMAIL = process.env.GARMIN_CN_EMAIL;
    const CN_PWD = process.env.GARMIN_CN_PWD;
    const GLOBAL_EMAIL = process.env.GARMIN_GLOBAL_EMAIL;
    const GLOBAL_PWD = process.env.GARMIN_GLOBAL_PWD;

    if (!CN_EMAIL || !CN_PWD || !GLOBAL_EMAIL || !GLOBAL_PWD) {
      throw new Error('Missing Garmin credentials');
    }

    const garmin = new Garmin({
      cnEmail: CN_EMAIL,
      cnPassword: CN_PWD,
      globalEmail: GLOBAL_EMAIL,
      globalPassword: GLOBAL_PWD,
    });

    // 执行同步
    let result;
    if (direction === 'cn_to_global') {
      result = await garmin.syncCNToGlobal();
    } else {
      result = await garmin.syncGlobalToCN();
    }

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: error.message });
  }
}