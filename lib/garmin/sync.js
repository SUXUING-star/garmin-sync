// lib/garmin/sync.js
const GarminConnect = require('./client');

class GarminSync {
  constructor(config) {
    this.cnClient = new GarminConnect({
      username: config.cnUsername,
      password: config.cnPassword,
      region: 'cn'
    });

    this.globalClient = new GarminConnect({
      username: config.globalUsername,
      password: config.globalPassword,
      region: 'global'
    });
  }

  async syncCNToGlobal() {
    try {
      // 获取中国区最新活动
      const activities = await this.cnClient.getActivities(0, 1);
      if (!activities || activities.length === 0) {
        return { success: true, message: '没有新的活动需要同步' };
      }

      // 下载活动文件
      const activity = activities[0];
      const file = await this.cnClient.downloadActivity(activity.activityId);

      // 上传到国际区
      const result = await this.globalClient.uploadActivity(file);

      return {
        success: true,
        message: '同步成功',
        activityId: activity.activityId,
        result
      };
    } catch (error) {
      console.error('同步失败:', error);
      throw error;
    }
  }

  async syncGlobalToCN() {
    try {
      // 获取国际区最新活动
      const activities = await this.globalClient.getActivities(0, 1);
      if (!activities || activities.length === 0) {
        return { success: true, message: '没有新的活动需要同步' };
      }

      // 下载活动文件
      const activity = activities[0];
      const file = await this.globalClient.downloadActivity(activity.activityId);

      // 上传到中国区
      const result = await this.cnClient.uploadActivity(file);

      return {
        success: true,
        message: '同步成功',
        activityId: activity.activityId,
        result
      };
    } catch (error) {
      console.error('同步失败:', error);
      throw error;
    }
  }
}

module.exports = GarminSync;