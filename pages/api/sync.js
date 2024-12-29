// pages/api/sync.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { direction } = req.body;
    
    // 打印接收到的请求数据
    console.log('Received sync request:', { direction });

    // 模拟同步操作（测试用）
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 返回成功响应
    res.status(200).json({ 
      success: true, 
      message: `Successfully synced ${direction}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // 详细的错误日志
    console.error('Sync error:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({ 
      error: 'Sync failed', 
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}