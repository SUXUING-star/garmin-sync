// lib/garmin.js
import fetch from 'node-fetch';

export class Garmin {
  constructor({ cnEmail, cnPassword, globalEmail, globalPassword }) {
    this.cnEmail = cnEmail;
    this.cnPassword = cnPassword;
    this.globalEmail = globalEmail;
    this.globalPassword = globalPassword;
  }

  async login(isCN = true) {
    const domain = isCN ? 'garmin.cn' : 'garmin.com';
    const email = isCN ? this.cnEmail : this.globalEmail;
    const password = isCN ? this.cnPassword : this.globalPassword;

    const response = await fetch(`https://sso.${domain}/sso/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: email,
        password: password,
      }),
    });

    if (!response.ok) {
      throw new Error(`Login failed for ${domain}`);
    }

    return await response.json();
  }

  async getActivities(isCN = true) {
    const domain = isCN ? 'garmin.cn' : 'garmin.com';
    const token = await this.login(isCN);

    const response = await fetch(`https://connect.${domain}/modern/proxy/activitylist-service/activities/search/activities`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get activities from ${domain}`);
    }

    return await response.json();
  }

  async syncActivity(activity, fromCN = true) {
    // 实现活动同步逻辑
    const sourceToken = await this.login(fromCN);
    const targetToken = await this.login(!fromCN);
    
    // 下载活动数据
    const sourceDomain = fromCN ? 'garmin.cn' : 'garmin.com';
    const downloadResponse = await fetch(`https://connect.${sourceDomain}/modern/proxy/download-service/files/activity/${activity.activityId}`, {
      headers: {
        'Authorization': `Bearer ${sourceToken.access_token}`,
      },
    });

    if (!downloadResponse.ok) {
      throw new Error('Failed to download activity');
    }

    const activityData = await downloadResponse.blob();

    // 上传到目标平台
    const targetDomain = fromCN ? 'garmin.com' : 'garmin.cn';
    const uploadResponse = await fetch(`https://connect.${targetDomain}/modern/proxy/upload-service/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${targetToken.access_token}`,
      },
      body: activityData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload activity');
    }

    return await uploadResponse.json();
  }

  async syncCNToGlobal() {
    const activities = await this.getActivities(true);
    const results = [];

    for (const activity of activities) {
      try {
        const result = await this.syncActivity(activity, true);
        results.push({
          activityId: activity.activityId,
          status: 'success',
          result,
        });
      } catch (error) {
        results.push({
          activityId: activity.activityId,
          status: 'error',
          error: error.message,
        });
      }
    }

    return results;
  }

  async syncGlobalToCN() {
    const activities = await this.getActivities(false);
    const results = [];

    for (const activity of activities) {
      try {
        const result = await this.syncActivity(activity, false);
        results.push({
          activityId: activity.activityId,
          status: 'success',
          result,
        });
      } catch (error) {
        results.push({
          activityId: activity.activityId,
          status: 'error',
          error: error.message,
        });
      }
    }

    return results;
  }
}