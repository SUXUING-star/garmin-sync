// lib/garmin/sync.js
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile } from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export default class GarminSync {
  constructor(config) {
    this.cnUsername = config.cnUsername;
    this.cnPassword = config.cnPassword;
    this.globalUsername = config.globalUsername;
    this.globalPassword = config.globalPassword;
    this.dailysyncPath = path.join(process.cwd(), 'lib', 'dailysync');
  }

  async setupConfig() {
    // 创建 dailysync 的配置文件
    const configPath = path.join(this.dailysyncPath, 'src', 'constant.ts');
    const configContent = `
      // 中国区
      export const GARMIN_USERNAME_DEFAULT = '${this.cnUsername}';
      export const GARMIN_PASSWORD_DEFAULT = '${this.cnPassword}';
      // 国际区
      export const GARMIN_GLOBAL_USERNAME_DEFAULT = '${this.globalUsername}';
      export const GARMIN_GLOBAL_PASSWORD_DEFAULT = '${this.globalPassword}';
      
      // 佳明迁移数量配置
      export const GARMIN_MIGRATE_NUM_DEFAULT = 100;
      export const GARMIN_MIGRATE_START_DEFAULT = 0;
      
      // Bark 通知配置（可选）
      export const BARK_KEY_DEFAULT = '';
    `.trim();

    await writeFile(configPath, configContent, 'utf8');
  }

  async execInDailySync(command) {
    const fullCommand = `npx ts-node src/${command}.ts`;
    console.log(`Executing command: ${fullCommand} in ${this.dailysyncPath}`);
    
    return execAsync(fullCommand, {
      cwd: this.dailysyncPath,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        TS_NODE_PROJECT: path.join(this.dailysyncPath, 'tsconfig.json')
      }
    });
  }

  async syncCNToGlobal() {
    console.log('Starting CN to Global sync');
    
    try {
      await this.setupConfig();
      
      const { stdout, stderr } = await this.execInDailySync('sync_garmin_cn_to_global');
      
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
      await this.setupConfig();
      
      const { stdout, stderr } = await this.execInDailySync('sync_garmin_global_to_cn');
      
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