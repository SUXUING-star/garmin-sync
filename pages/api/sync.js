// pages/api/sync.js
import GarminSync from '../../lib/garmin/sync';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('Received sync request');

  try {
    const { direction } = req.body;
    console.log(`Starting sync (${direction})`);

    // 验证环境变量
    if (!process.env.GARMIN_CN_EMAIL || !process.env.GARMIN_CN_PWD || 
        !process.env.GARMIN_GLOBAL_EMAIL || !process.env.GARMIN_GLOBAL_PWD) {
      throw new Error('缺少必要的环境变量配置');
    }

    const sync = new GarminSync({
      cnUsername: process.env.GARMIN_CN_EMAIL,
      cnPassword: process.env.GARMIN_CN_PWD,
      globalUsername: process.env.GARMIN_GLOBAL_EMAIL,
      globalPassword: process.env.GARMIN_GLOBAL_PWD
    });

    // 记录开始时间
    const startTime = new Date();
    console.log('开始同步过程');

    let result;
    let syncLog = [];

    // 执行同步并记录日志
    if (direction === 'cn_to_global') {
      syncLog.push('正在从中国区同步到国际区...');
      result = await sync.syncCNToGlobal();
      syncLog.push('中国区到国际区同步完成');
    } else {
      syncLog.push('正在从国际区同步到中国区...');
      result = await sync.syncGlobalToCN();
      syncLog.push('国际区到中国区同步完成');
    }

    // 计算同步用时
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('Sync completed:', result);

    res.status(200).json({
      success: true,
      message: '同步成功',
      details: {
        direction: direction,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${duration}秒`,
        syncLog: syncLog,
        ...result
      }
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