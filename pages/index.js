// pages/index.js
import React from 'react';
import { AlertCircle, ArrowLeftRight, Settings, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

export default function Home() {
  const [syncDirection, setSyncDirection] = React.useState('cn_to_global');
  const [lastSync, setLastSync] = React.useState(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [status, setStatus] = React.useState({ type: 'info', message: '准备就绪' });
  const [logs, setLogs] = React.useState([]);
  const [errorDetails, setErrorDetails] = React.useState(null);
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setStatus({ type: 'info', message: '同步中...' });
    const startTime = new Date().toLocaleString();
    setLogs(prev => [`${startTime} - 开始同步...`, ...prev]);
    setErrorDetails(null);
    setShowErrorDetails(false);
    
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction: syncDirection })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '同步请求失败');
      }

      if (!data.success) {
        const errorMsg = data.error || '同步返回失败状态';
        setErrorDetails({
          message: errorMsg,
          details: data.details || {},
          response: data,
          timestamp: new Date().toISOString()
        });
        throw new Error(errorMsg);
      }

      setStatus({ type: 'success', message: '同步完成' });
      setLastSync(new Date().toLocaleString());
      setLogs(prev => [
        `${new Date().toLocaleString()} - 同步完成`,
        `  方向: ${data.details?.direction || syncDirection}`,
        data.details?.duration ? `  用时: ${data.details.duration}` : '',
        data.details?.activitiesCount ? `  活动数: ${data.details.activitiesCount}` : '',
        ...prev
      ].filter(Boolean));
    } catch (error) {
      console.error('Sync error:', error);
      const errorMessage = error.message || '同步失败，请稍后重试';
      setStatus({ type: 'error', message: `同步失败: ${errorMessage}` });
      setLogs(prev => [`${new Date().toLocaleString()} - 错误: ${errorMessage}`, ...prev]);

      if (!errorDetails) {
        setErrorDetails({
          message: errorMessage,
          error: error,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleErrorDetails = () => {
    setShowErrorDetails(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Garmin 数据同步</h1>
          
          {/* 同步方向选择 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg flex justify-between items-center">
            <span className="text-gray-700">
              {syncDirection === 'cn_to_global' ? '中国区 → 国际区' : '国际区 → 中国区'}
            </span>
            <button 
              onClick={() => setSyncDirection(prev => 
                prev === 'cn_to_global' ? 'global_to_cn' : 'cn_to_global'
              )}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              disabled={isSyncing}
            >
              <ArrowLeftRight className="w-5 h-5" />
            </button>
          </div>

          {/* 同步按钮 */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`w-full py-3 px-4 rounded-lg flex items-center justify-center space-x-2 
              ${isSyncing 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>同步中...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>开始同步</span>
              </>
            )}
          </button>

          {/* 状态显示 */}
          <div className="mt-6">
            <Alert variant={status.type === 'success' ? 'default' : 'destructive'}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>状态</AlertTitle>
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          </div>

          {/* 错误详情 */}
          {errorDetails && (
            <div className="mt-4">
              <button
                onClick={toggleErrorDetails}
                className="text-sm text-red-600 hover:text-red-700 flex items-center space-x-1"
              >
                {showErrorDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                <span>{showErrorDetails ? '收起错误详情' : '查看错误详情'}</span>
              </button>
              
              {showErrorDetails && (
                <div className="mt-2 p-3 bg-red-50 rounded-lg text-sm">
                  <div className="text-red-700 font-medium">错误信息：</div>
                  <div className="mt-1 text-red-600">{errorDetails.message}</div>
                  
                  {errorDetails.details && (
                    <div className="mt-2">
                      <div className="text-red-700 font-medium">详细信息：</div>
                      <pre className="mt-1 text-red-600 text-xs overflow-x-auto">
                        {JSON.stringify(errorDetails.details, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-red-500">
                    发生时间：{new Date(errorDetails.timestamp).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 上次同步时间 */}
          {lastSync && (
            <div className="mt-4 text-sm text-gray-600">
              上次同步: {lastSync}
            </div>
          )}

          {/* 同步日志 */}
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">同步日志</h3>
            <div className="bg-gray-50 rounded-lg p-3 h-48 overflow-y-auto font-mono">
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className={`text-sm ${
                    log.includes('错误') ? 'text-red-600' : 'text-gray-600'
                  } mb-1`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}