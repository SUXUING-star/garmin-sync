// lib/garmin/sync.js
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default class GarminSync {
  constructor(config) {
    this.cnUsername = config.cnUsername;
    this.cnPassword = config.cnPassword;
    this.globalUsername = config.globalUsername;
    this.globalPassword = config.globalPassword;
  }

  async syncCNToGlobal() {
    console.log('Starting CN to Global sync');
    
    try {
      const { stdout, stderr } = await execAsync('yarn sync_cn');
      
      if (stderr) {
        console.error('Sync stderr:', stderr);
        if (!stdout.includes('Successfully synced')) {
          throw new Error(stderr);
        }
      }

      // 解析同步结果
      const activities = this.parseActivities(stdout);
      
      return {
        status: 'success',
        activitiesCount: activities.length,
        activities: activities,
        rawOutput: stdout
      };
    } catch (error) {
      console.error('Sync error:', error);
      throw new Error(`同步失败: ${error.message}`);
    }
  }

  async syncGlobalToCN() {
    console.log('Starting Global to CN sync');
    
    try {
      const { stdout, stderr } = await execAsync('yarn sync_global');
      
      if (stderr) {
        console.error('Sync stderr:', stderr);
        if (!stdout.includes('Successfully synced')) {
          throw new Error(stderr);
        }
      }

      // 解析同步结果
      const activities = this.parseActivities(stdout);
      
      return {
        status: 'success',
        activitiesCount: activities.length,
        activities: activities,
        rawOutput: stdout
      };
    } catch (error) {
      console.error('Sync error:', error);
      throw new Error(`同步失败: ${error.message}`);
    }
  }

  parseActivities(output) {
    // 尝试从输出中解析活动信息
    const activities = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Syncing activity')) {
        // 提取活动信息
        const match = line.match(/Syncing activity: (.*)/);
        if (match) {
          activities.push(match[1]);
        }
      }
    }
    
    return activities;
  }
}