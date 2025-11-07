import React, { useState, useEffect } from 'react';
import Tabs from './common/Tabs';
import DataInputTab from './data-input/DataInputTab';
import StatisticalAnalysisTab from './analysis/StatisticalAnalysisTab';
import MLEMOMAnalysisTab from './analysis/MLEMOMAnalysisTab';
import ConfidenceIntervalTab from './analysis/ConfidenceIntervalTab';
import HypothesisTestingTab from './analysis/HypothesisTestingTab';
// 移除统计特征板块导入
import DataVisualization from './visualization/DataVisualization';
import WelcomeGuide from './WelcomeGuide';
import DataHistoryManager from './data-history/DataHistoryManager';
import './DataAnalysisApp.css';

export interface DataPoint {
  x: number;
  y: number;
}

export interface Dataset {
  id: string;
  name: string;
  created: Date;
  data: DataPoint[];
  distributionType?: string;
  statistics?: {
    count: number;
    mean: number;
    stdDev: number;
  };
}

const DataAnalysisApp: React.FC = () => {
  // 数据集管理状态
  const [datasets, setDatasets] = useState<Map<string, Dataset>>(new Map());
  const [currentDatasetId, setCurrentDatasetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('input');
  const [showWelcomeGuide, setShowWelcomeGuide] = useState<boolean>(false);
  
  // 历史记录相关状态
  const [currentOperationName, setCurrentOperationName] = useState<string>('');
  
  // 当前活动数据集
  const currentDataset = currentDatasetId ? datasets.get(currentDatasetId) : null;
  const currentData = currentDataset?.data || [];
  
  // 数据集比较相关状态
  const [isComparisonMode, setIsComparisonMode] = useState<boolean>(false);
  const [selectedDatasetsForComparison, setSelectedDatasetsForComparison] = useState<string[]>([]);
  
  // 获取要比较的数据集
  const comparisonDatasets = selectedDatasetsForComparison
    .map(id => datasets.get(id))
    .filter(Boolean) as Dataset[];

  // Check if user has seen the welcome guide before
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('hasSeenWelcomeGuide');
    if (!hasSeenGuide) {
      // Show welcome guide after a small delay for better user experience
      const timer = setTimeout(() => {
        setShowWelcomeGuide(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseWelcomeGuide = () => {
    setShowWelcomeGuide(false);
    localStorage.setItem('hasSeenWelcomeGuide', 'true');
  };

  // 生成唯一ID
  const generateId = (): string => {
    return `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
  
  // 计算数据集的基本统计信息
  const calculateDatasetStats = (data: DataPoint[]): Dataset['statistics'] => {
    if (data.length === 0) return undefined;
    
    const xValues = data.map(point => point.x);
    const sum = xValues.reduce((acc, val) => acc + val, 0);
    const mean = sum / xValues.length;
    const variance = xValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / xValues.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      count: xValues.length,
      mean,
      stdDev
    };
  };
  
  // 创建新数据集
  const createDataset = (data: DataPoint[], name?: string, distributionType?: string): void => {
    const id = generateId();
    const newDataset: Dataset = {
      id,
      name: name || `Dataset ${datasets.size + 1} - ${new Date().toLocaleDateString()}`,
      created: new Date(),
      data: [...data],
      distributionType,
      statistics: calculateDatasetStats(data)
    };
    
    const updatedDatasets = new Map(datasets);
    updatedDatasets.set(id, newDataset);
    setDatasets(updatedDatasets);
    setCurrentDatasetId(id);
  };
  
  // 切换数据集
  const switchDataset = (datasetId: string): void => {
    if (datasets.has(datasetId)) {
      setCurrentDatasetId(datasetId);
    }
  };
  
  // 删除数据集
  const deleteDataset = (datasetId: string): void => {
    const updatedDatasets = new Map(datasets);
    updatedDatasets.delete(datasetId);
    setDatasets(updatedDatasets);
    
    // 如果删除的是当前数据集，切换到第一个可用数据集或清空
    if (currentDatasetId === datasetId) {
      const firstKey = updatedDatasets.keys().next().value;
      setCurrentDatasetId(firstKey || null);
    }
    
    // 从比较列表中移除
    if (selectedDatasetsForComparison.includes(datasetId)) {
      setSelectedDatasetsForComparison(selectedDatasetsForComparison.filter(id => id !== datasetId));
    }
  };
  
  // 切换数据集比较模式
  const toggleComparisonMode = () => {
    setIsComparisonMode(!isComparisonMode);
    if (isComparisonMode) {
      setSelectedDatasetsForComparison([]); // 退出比较模式时清空选择
    }
  };
  
  // 切换数据集在比较列表中的选中状态
  const toggleDatasetForComparison = (datasetId: string) => {
    if (selectedDatasetsForComparison.includes(datasetId)) {
      setSelectedDatasetsForComparison(selectedDatasetsForComparison.filter(id => id !== datasetId));
    } else {
      setSelectedDatasetsForComparison([...selectedDatasetsForComparison, datasetId]);
    }
  };
  
  // 处理数据变更（创建新数据集）
  const handleDataChange = (newData: DataPoint[], name?: string, operationName?: string, distributionType?: string) => {
    // 设置当前操作名称
    if (operationName) {
      setCurrentOperationName(operationName);
      // 重置操作名称
      setTimeout(() => setCurrentOperationName(''), 500);
    }
    
    // 如果有数据，创建新数据集
    if (newData.length > 0) {
      createDataset(newData, name, distributionType);
    }
  };

  return (
    <div className="data-analysis-app">
      <header className="app-header">
        <h1>Data Analysis Platform</h1>
        <p>Comprehensive Data Input and Statistical Analysis Tool</p>
      </header>

      <Tabs 
        tabs={[
          { id: 'input', label: 'Data Input' },
          { id: 'stats', label: 'Basic Statistics', disabled: currentData.length === 0 },
          { id: 'mlemom', label: 'MLE/MoM Analysis', disabled: currentData.length === 0 },
          { id: 'confidence', label: 'Confidence Intervals', disabled: currentData.length === 0 },
          { id: 'hypothesis-testing', label: 'Hypothesis Testing', disabled: currentData.length === 0 }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 数据集管理区域 */}
      {datasets.size > 0 && (
        <div className="dataset-management">
          <div className="dataset-controls">
            <button 
              type="button"
              className="dataset-btn dataset-new-btn" 
              onClick={() => setActiveTab('input')}
            >
              Create New Dataset
            </button>
            
            <label htmlFor="dataset-select-main" className="sr-only">Select Dataset</label>
            <select 
              id="dataset-select-main"
              className="dataset-select"
              value={currentDatasetId || ''}
              onChange={(e) => switchDataset(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            >
              {Array.from(datasets.values()).map(dataset => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name}
                </option>
              ))}
            </select>
            
            <button 
              type="button"
              className={`dataset-btn ${isComparisonMode ? 'dataset-compare-btn active' : 'dataset-compare-btn'}`}
              onClick={toggleComparisonMode}
            >
              {isComparisonMode ? 'Exit Compare Mode' : 'Compare Datasets'}
            </button>
            
            <button 
              type="button"
              className="dataset-btn dataset-delete-btn" 
              onClick={() => currentDatasetId && deleteDataset(currentDatasetId)}
              disabled={datasets.size <= 1}
            >
              Delete Current Dataset
            </button>
          </div>
          
          {/* 数据集比较选择器 */}
          {isComparisonMode && (
            <div className="dataset-comparison-section">
              <h3>Select datasets to compare:</h3>
              <div className="dataset-checkboxes">
                {Array.from(datasets.values()).map(dataset => (
                  <label key={dataset.id} className="dataset-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedDatasetsForComparison.includes(dataset.id)}
                      onChange={() => toggleDatasetForComparison(dataset.id)}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    />
                    {dataset.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div className="current-dataset-info">
            {isComparisonMode && comparisonDatasets.length > 0 ? (
              <span>Comparing {comparisonDatasets.length} datasets</span>
            ) : (
              <span>Current Dataset: <strong>{currentDataset?.name || 'None'}</strong></span>
            )}
          </div>
        </div>
      )}

      <div className="app-content">
        {/* 数据历史管理器 */}
        {currentData.length > 0 && (
          <DataHistoryManager 
            currentData={currentData}
            onDataChange={(newData) => handleDataChange(newData, 'History Operation')}
            operationName={currentOperationName}
          />
        )}
        
        {activeTab === 'input' && (
          <DataInputTab onDataGenerated={handleDataChange} />
        )}
        
        {activeTab === 'stats' && (
          <StatisticalAnalysisTab data={currentData} />
        )}
        
        {activeTab === 'mlemom' && (
          <MLEMOMAnalysisTab data={currentData} />
        )}
          {activeTab === 'confidence' && (
          <ConfidenceIntervalTab data={currentData} datasets={Array.from(datasets.values())} />
        )}
        
        {activeTab === 'hypothesis-testing' && (
          <HypothesisTestingTab data={currentData} datasets={Array.from(datasets.values())} />
        )}
        {/* 移除统计特征板块组件 */}
      </div>

      {(currentData.length > 0 || comparisonDatasets.length > 0) && (
        <div className="visualization-section">
          <h2>{isComparisonMode && comparisonDatasets.length > 0 ? 'Dataset Comparison' : 'Data Visualization'}</h2>
          <DataVisualization 
            data={currentData} 
            comparisonDatasets={isComparisonMode ? comparisonDatasets : []}
            distributionType={currentDataset?.distributionType}
          />
        </div>
      )}

      <footer className="app-footer">
        <p>Data Analysis Platform - Powerful Data Input and Analysis Tool</p>
      </footer>

      {showWelcomeGuide && <WelcomeGuide onClose={handleCloseWelcomeGuide} />}
    </div>
  );
};

export default DataAnalysisApp;