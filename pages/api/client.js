// lib/garmin/client.js
const { GarminClient } = require('garmin-node-api');

class GarminConnect {
  constructor(options = {}) {
    this.username = options.username;
    this.password = options.password;
    this.region = options.region || 'cn'; // 'cn' or 'global'
    this.client = new GarminClient({
      username: this.username,
      password: this.password,
      region: this.region
    });
  }

  async login() {
    try {
      await this.client.login();
      return true;
    } catch (error) {
      console.error(`登录失败 (${this.region}):`, error);
      throw error;
    }
  }

  async getActivities(start = 0, limit = 10) {
    try {
      await this.login();
      const activities = await this.client.getActivities(start, limit);
      return activities;
    } catch (error) {
      console.error('获取活动失败:', error);
      throw error;
    }
  }

  async downloadActivity(activityId) {
    try {
      await this.login();
      const data = await this.client.downloadActivity(activityId);
      return data;
    } catch (error) {
      console.error('下载活动失败:', error);
      throw error;
    }
  }

  async uploadActivity(file) {
    try {
      await this.login();
      const result = await this.client.uploadActivity(file);
      return result;
    } catch (error) {
      console.error('上传活动失败:', error);
      throw error;
    }
  }
}

module.exports = GarminConnect;