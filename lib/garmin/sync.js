// lib/garmin/sync.js
import { exec } from 'child_process';
import { promisify } from 'util';
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
     // 使用环境变量
      process.env.GARMIN_USERNAME_DEFAULT = this.cnUsername;
      process.env.GARMIN_PASSWORD_DEFAULT = this.cnPassword;
      process.env.GARMIN_GLOBAL_USERNAME_DEFAULT = this.globalUsername;
      process.env.GARMIN_GLOBAL_PASSWORD_DEFAULT = this.globalPassword;
  }


  async executeSync(scriptName) {
    try {
      // 使用 npm run 执行 script
      const command = `npm run ${scriptName}`;

      const { stdout, stderr } = await execAsync(command, {
        cwd: this.dailysyncPath,
         env: process.env,
      });

      if (stderr && !stderr.includes('ExperimentalWarning')) {
        console.error('Sync stderr:', stderr);
          throw new Error(stderr);
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
      const stdout = await this.executeSync('sync_cn');
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
      const stdout = await this.executeSync('sync_global');
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
          activities.push(match[1].trim());
        }
      }
    }
    
    return activities;
  }
}