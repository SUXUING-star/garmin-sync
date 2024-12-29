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

      async syncCNToGlobal() {
        console.log('Starting CN to Global sync');
        await this.setupConfig();
          try {
              const { stdout, stderr } = await execAsync('npm run sync_cn', { cwd: this.dailysyncPath });

            if (stderr) {
                 console.error('Sync stderr:', stderr);
              }

              const activities = this.parseActivities(stdout);

             return {
              status: 'success',
                 activitiesCount: activities.length,
                 activities: activities,
                 rawOutput: stdout,
             };

         } catch (error) {
              console.error('Sync error:', error);
             throw new Error(`同步失败: ${error.message}`);
          }
      }

      async syncGlobalToCN() {
           console.log('Starting Global to CN sync');
           await this.setupConfig();
           try {
               const { stdout, stderr } = await execAsync('npm run sync_global', { cwd: this.dailysyncPath });

             if (stderr) {
                  console.error('Sync stderr:', stderr);
               }
              const activities = this.parseActivities(stdout);

              return {
                  status: 'success',
                  activitiesCount: activities.length,
                   activities: activities,
                   rawOutput: stdout,
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
                      activities.push(match[1].trim());
                   }
               }
          }
           return activities;
       }
  }