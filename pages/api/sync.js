// lib/garmin/sync.js
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export default class GarminSync {
  constructor(config) {
    this.cnUsername = config.cnUsername;
    this.cnPassword = config.cnPassword;
    this.globalUsername = config.globalUsername;
    this.globalPassword = config.globalPassword;
  }

  async setupConfig() {
    // 获取 dailysync 项目路径
    const dailysyncPath = path.join(process.cwd(), 'lib', 'dailysync');
    const configPath = path.join(dailysyncPath, 'src', 'constant.ts');

    // 创建配置文件内容
    const configContent = `
// 中国区账号
export const GARMIN_USERNAME_DEFAULT = '${this.cnUsername}';
export const GARMIN_PASSWORD_DEFAULT = '${this.cnPassword}';

// 国际区账号
export const GARMIN_GLOBAL_USERNAME_DEFAULT = '${this.globalUsername}';
export const GARMIN_GLOBAL_PASSWORD_DEFAULT = '${this.globalPassword}';

// 佳明迁移数量配置
export const GARMIN_MIGRATE_NUM_DEFAULT = 10;
export const GARMIN_MIGRATE_START_DEFAULT = 0;
    `.trim();

    // 写入配置文件
    await fs.promises.writeFile(configPath, configContent, 'utf8');
  }

  async syncCNToGlobal() {
    console.log('Starting CN to Global sync');
    
    try {
      await this.setupConfig();
      
      const dailysyncPath = path.join(process.cwd(), 'lib', 'dailysync');
      const command = `cd ${dailysyncPath} && npx ts-node src/sync_garmin_cn_to_global.ts`;
      
      console.log('Executing command:', command);
      
      const { stdout, stderr } = await execAsync(command, {
        env: {
          ...process.env,
          PATH: `${process.env.PATH}:${path.join(process.cwd(), 'node_modules', '.bin')}`
        }
      });

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
      
      const dailysyncPath = path.join(process.cwd(), 'lib', 'dailysync');
      const command = `cd ${dailysyncPath} && npx ts-node src/sync_garmin_global_to_cn.ts`;
      
      console.log('Executing command:', command);
      
      const { stdout, stderr } = await execAsync(command, {
        env: {
          ...process.env,
          PATH: `${process.env.PATH}:${path.join(process.cwd(), 'node_modules', '.bin')}`
        }
      });

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
    const activities = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Syncing activity')) {
        const match = line.match(/Syncing activity: (.*)/);
        if (match) {
          activities.push(match[1]);
        }
      }
    }
    
    return activities;
  }
}