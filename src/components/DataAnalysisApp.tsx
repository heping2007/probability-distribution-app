import React, { useState } from 'react';
import Tabs from './common/Tabs';
import DataInputTab from './data-input/DataInputTab';
import StatisticalAnalysisTab from './analysis/StatisticalAnalysisTab';
import MLEMOMAnalysisTab from './analysis/MLEMOMAnalysisTab';
import HypothesisTestingTab from './analysis/HypothesisTestingTab';
import ConfidenceIntervalTab from './analysis/ConfidenceIntervalTab';
import TestDataGenerator from './analysis/TestDataGenerator';
import DataVisualization from './visualization/DataVisualization';
import './DataAnalysisApp.css';

export interface DataPoint {
  x: number;
  y: number;
}

const DataAnalysisApp: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [activeTab, setActiveTab] = useState<string>('input');

  const handleDataChange = (newData: DataPoint[]) => {
    setData(newData);
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
          { id: 'ci', label: 'Confidence Interval', disabled: data.length === 0 },
          { id: 'stats', label: 'Basic Statistics', disabled: data.length === 0 },
          { id: 'mlemom', label: 'MLE/MoM Analysis', disabled: data.length === 0 },
          { id: 'testing', label: 'Hypothesis Testing', disabled: data.length === 0 },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="app-content">
        {activeTab === 'input' && (
          <div className="data-input-section">
            <DataInputTab onDataChange={handleDataChange} />
            <TestDataGenerator onDataChange={handleDataChange} />
          </div>
        )}
        
        {activeTab === 'ci' && (
          <ConfidenceIntervalTab data={data} />
        )}
        
        {activeTab === 'stats' && (
          <StatisticalAnalysisTab data={data} />
        )}
        
        {activeTab === 'mlemom' && (
          <MLEMOMAnalysisTab data={data} />
        )}
        
        {activeTab === 'testing' && (
          <HypothesisTestingTab data={data} />
        )}
      </div>

      {data.length > 0 && (
        <div className="visualization-section">
          <h2>Data Visualization</h2>
          <DataVisualization data={data} />
        </div>
      )}

      <footer className="app-footer">
        <p>Data Analysis Platform - Powerful Data Input and Analysis Tool</p>
      </footer>
    </div>
  );
};

export default DataAnalysisApp;