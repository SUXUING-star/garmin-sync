const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const webpush = require('web-push');
const { promisify } = require('util');
const execAsync = promisify(exec);

const app = express();
app.use(cors());
app.use(express.json());

// 配置Web Push
const vapidKeys = webpush.generateVAPIDKeys();
webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// 存储推送订阅
let pushSubscription = null;

// 保存推送订阅
app.post('/api/subscribe', (req, res) => {
  pushSubscription = req.body;
  res.status(200).json({ message: '订阅成功' });
});

// 获取推送公钥
app.get('/api/vapidPublicKey', (req, res) => {
  res.json({ publicKey: vapidKeys.publicKey });
});

// 主同步API
app.post('/api/sync', async (req, res) => {
  try {
    const { direction } = req.body;
    const command = direction === 'cn_to_global' ? 'yarn sync_cn' : 'yarn sync_global';
    
    // 发送开始同步通知
    if (pushSubscription) {
      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: 'Garmin Sync',
            body: '开始同步数据...'
          })
        );
      } catch (error) {
        console.error('推送通知失败:', error);
      }
    }

    // 执行同步命令
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.env.DAILYSYNC_PATH || path.join(__dirname, 'dailysync')
    });

    // 记录日志
    console.log('同步输出:', stdout);
    if (stderr) {
      console.error('同步错误:', stderr);
    }

    // 发送完成通知
    if (pushSubscription) {
      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: 'Garmin Sync',
            body: '同步完成'
          })
        );
      } catch (error) {
        console.error('推送通知失败:', error);
      }
    }

    res.json({ 
      success: true, 
      message: '同步完成',
      logs: stdout
    });

  } catch (error) {
    console.error('同步失败:', error);

    // 发送错误通知
    if (pushSubscription) {
      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify({
            title: 'Garmin Sync',
            body: `同步失败: ${error.message}`
          })
        );
      } catch (pushError) {
        console.error('推送通知失败:', pushError);
      }
    }

    res.status(500).json({ 
      success: false, 
      message: '同步失败',
      error: error.message
    });
  }
});

// 获取同步状态API
app.get('/api/status', (req, res) => {
  res.json({
    lastSync: global.lastSync || null,
    isRunning: global.isSyncing || false
  });
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: '服务器错误',
    error: err.message 
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

// 优雅退出处理
process.on('SIGTERM', () => {
  console.log('接收到 SIGTERM 信号，准备关闭服务器...');
  // 清理资源
  process.exit(0);
});

module.exports = app;