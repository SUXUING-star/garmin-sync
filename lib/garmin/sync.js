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
    this.dailysyncPath = path.join(process.cwd(), 'lib', 'dailysync');
  }

  async setupConfig() {
    const configPath = path.join(this.dailysyncPath, 'src', 'constant.ts');
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

    await fs.promises.writeFile(configPath, configContent, 'utf8');
  }

  async executeSync(scriptPath) {
    try {
      await this.setupConfig();

      // 使用项目本地的 ts-node
      const tsNodePath = path.join(this.dailysyncPath, 'node_modules', '.bin', 'ts-node');
      const scriptFullPath = path.join(this.dailysyncPath, 'src', scriptPath);

      // 检查 ts-node 是否存在
      if (!fs.existsSync(tsNodePath)) {
        console.log('Local ts-node not found, installing dependencies...');
        await execAsync('npm install', { cwd: this.dailysyncPath });
      }

      const command = `"${tsNodePath}" "${scriptFullPath}"`;
      console.log('Executing command:', command);

      const { stdout, stderr } = await execAsync(command, {
        cwd: this.dailysyncPath,
        env: {
          ...process.env,
          PATH: `${path.join(this.dailysyncPath, 'node_modules', '.bin')}${path.delimiter}${process.env.PATH}`
        }
      });

      if (stderr && !stderr.includes('ExperimentalWarning')) {
        console.error('Sync stderr:', stderr);
        if (!stdout.includes('Successfully synced')) {
          throw new Error(stderr);
        }
      }

      return stdout;
    } catch (error) {
      console.error('Sync execution error:', error);
      throw error;
    }
  }

  async syncCNToGlobal() {
    console.log('Starting CN to Global sync');
    try {
      const stdout = await this.executeSync('sync_garmin_cn_to_global.ts');
      const activities = this.parseActivities(stdout);

      return {
        status: 'success',
        activitiesCount: activities.length,
        activities: activities,
        rawOutput: stdout
      };
    } catch (error) {
      console.error('CN to Global sync error:', error);
      throw new Error(`同步失败: ${error.message}`);
    }
  }

  async syncGlobalToCN() {
    console.log('Starting Global to CN sync');
    try {
      const stdout = await this.executeSync('sync_garmin_global_to_cn.ts');
      const activities = this.parseActivities(stdout);

      return {
        status: 'success',
        activitiesCount: activities.length,
        activities: activities,
        rawOutput: stdout
      };
    } catch (error) {
      console.error('Global to CN sync error:', error);
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