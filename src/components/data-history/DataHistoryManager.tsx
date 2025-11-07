import React, { useState, useEffect, useCallback } from 'react';
import { DataPoint } from '../DataAnalysisApp';
import './DataHistoryManager.css';

interface HistoryEntry {
  id: string;
  timestamp: Date;
  operation: string;
  previousData: DataPoint[];
  newData: DataPoint[];
}

interface DataHistoryManagerProps {
  currentData: DataPoint[];
  onDataChange: (data: DataPoint[]) => void;
  operationName?: string;
}

const DataHistoryManager: React.FC<DataHistoryManagerProps> = ({ 
  currentData, 
  onDataChange,
  operationName 
}) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [lastRecordedData, setLastRecordedData] = useState<DataPoint[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [showUpdateNotification, setShowUpdateNotification] = useState<string>('');
  
  // 生成唯一ID
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // 记录操作
  const recordOperation = (operation: string, previousData: DataPoint[], newData: DataPoint[]): void => {
    if (!isRecording) return;
    
    // 检查数据是否有变化
    if (JSON.stringify(previousData) === JSON.stringify(newData)) return;
    
    const newEntry: HistoryEntry = {
      id: generateId(),
      timestamp: new Date(),
      operation,
      previousData: [...previousData],
      newData: [...newData]
    };
    
    // 如果当前不是在历史记录的最后，截断历史记录
    const updatedHistory = history.slice(0, currentIndex + 1);
    updatedHistory.push(newEntry);
    
    setHistory(updatedHistory);
    setCurrentIndex(updatedHistory.length - 1);
    setLastRecordedData([...newData]);
  };

  // 撤销操作
  const undo = useCallback((): void => {
    if (currentIndex > 0) {
      setIsRecording(false);
      const previousEntry = history[currentIndex - 1];
      onDataChange(previousEntry.newData);
      setCurrentIndex(currentIndex - 1);
      
      // Add undo operation log
    console.log(`Undo operation: ${previousEntry.operation}`, previousEntry.newData);
      
      // 短暂延迟后重新启用记录
      setTimeout(() => setIsRecording(true), 100);
    }
  }, [currentIndex, history, onDataChange]);

  // 重做操作
  const redo = useCallback((): void => {
    if (currentIndex < history.length - 1) {
      setIsRecording(false);
      const nextEntry = history[currentIndex + 1];
      onDataChange(nextEntry.newData);
      setCurrentIndex(currentIndex + 1);
      
      // Add redo operation log
    console.log(`Redo operation: ${nextEntry.operation}`, nextEntry.newData);
      
      // 短暂延迟后重新启用记录
      setTimeout(() => setIsRecording(true), 100);
    }
  }, [currentIndex, history, onDataChange]);
  
  // 跳转到指定历史记录
  const jumpToHistory = useCallback((index: number): void => {
    if (index >= 0 && index < history.length) {
      setIsRecording(false);
      const targetEntry = history[index];
      onDataChange(targetEntry.newData);
      setCurrentIndex(index);
      
      console.log(`跳转到历史操作: ${targetEntry.operation}`, targetEntry.newData);
      
      setTimeout(() => setIsRecording(true), 100);
    }
  }, [history, onDataChange]);

  // 当currentData变化时记录操作
  useEffect(() => {
    // 检查是否有变化且不是由撤销/重做触发的
    if (JSON.stringify(lastRecordedData) !== JSON.stringify(currentData) && isRecording) {
      const opName = operationName || 'Data Update';
      recordOperation(opName, lastRecordedData, currentData);
      
      // 显示数据更新通知
      setShowUpdateNotification(opName);
      // 3秒后自动隐藏通知
      setTimeout(() => setShowUpdateNotification(''), 3000);
    }
  }, [currentData, lastRecordedData, isRecording, operationName]);
  
  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Z 撤销
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        undo();
      }
      // Ctrl+Y 重做
      if ((event.ctrlKey || event.metaKey) && event.key === 'y') {
        event.preventDefault();
        redo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // 获取格式化的时间戳
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString();
  };

  // Get history summary information
  const getHistorySummary = (): string => {
    if (history.length === 0) return 'No history records';
    
    const historySummary = history
      .slice(0, currentIndex + 1)
      .map(entry => entry.operation)
      .join(' → ');
    
    return historySummary;
  };

  // 清除历史记录
  const clearHistory = (): void => {
    setHistory([]);
    setCurrentIndex(-1);
    setLastRecordedData([...currentData]);
  };

  return (
    <>
      {/* 数据更新通知 - 移到历史管理器外部 */}
      {showUpdateNotification && (
        <div className="notification-container">
          <div className="data-update-notification">
            <span className="update-icon">✓</span>
            <span className="update-text">{showUpdateNotification}</span>
          </div>
        </div>
      )}
      
      <div className="data-history-manager">
      
        <div className="history-controls">
        <button 
          type="button"
          className="history-button undo-button"
          onClick={undo}
          disabled={currentIndex <= 0}
          title="Undo"
        >
          Undo
        </button>
        <button 
          type="button"
          className="history-button redo-button"
          onClick={redo}
          disabled={currentIndex >= history.length - 1}
          title="Redo"
        >
          Redo
        </button>
        <button 
          type="button"
          className="history-button clear-button"
          onClick={clearHistory}
          disabled={history.length === 0}
          title="Clear History"
        >
          Clear History
        </button>
      </div>
      
      <div className="history-summary">
        <span className="history-label">Operation History:</span>
        <span className="history-text">{getHistorySummary()}</span>
      </div>
      
      <div className="history-timeline">
        {history.map((entry, index) => (
          <div 
            key={entry.id}
            className={`timeline-item ${index <= currentIndex ? 'active' : 'inactive'} ${index === currentIndex ? 'current' : ''}`}
            title={`${entry.operation} (${formatTimestamp(entry.timestamp)})`}
            onClick={() => jumpToHistory(index)}
          >
            <div className={`timeline-dot ${index === currentIndex ? 'current-dot' : ''}`}></div>
            {index === currentIndex && (
              <div className="timeline-current-indicator">Current</div>
            )}
            <div className="timeline-tooltip">
              <div className="tooltip-operation">{entry.operation}</div>
              <div className="tooltip-time">{formatTimestamp(entry.timestamp)}</div>
              <div className="tooltip-data-count">Data Points: {entry.newData.length}</div>
              <div className="tooltip-actions">
                <span className="tooltip-jump">Click to jump to this operation</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>
    </>
  );
};

export default DataHistoryManager;