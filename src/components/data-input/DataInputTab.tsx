import React, { useState } from 'react';
import { DataPoint } from '../DataAnalysisApp';
import FileImporter from '../common/FileImporter';
import DistributionGenerator from './DistributionGenerator';
import AIDataGenerator from './AIDataGenerator';
import './DataInputTab.css';

interface DataInputTabProps {
  onDataChange: (data: DataPoint[]) => void;
}

const DataInputTab: React.FC<DataInputTabProps> = ({ onDataChange }) => {
  const [inputMethod, setInputMethod] = useState<string>('file');

  const handleFileImport = (data: {x: number, y: number}[]) => {
    onDataChange(data);
  };

  const handleDistributionData = (data: DataPoint[]) => {
    onDataChange(data);
  };

  const handleAIData = (data: number[]) => {
    // 将AI生成的简单数字数组转换为DataPoint格式
    const dataPoints = data.map((value, index) => ({
      x: index,
      y: value
    }));
    onDataChange(dataPoints);
  };

  return (
    <div className="data-input-tab">
      <div className="input-method-selector">
        <button
          className={`method-button ${inputMethod === 'file' ? 'active' : ''}`}
          onClick={() => setInputMethod('file')}
        >
          File Upload
        </button>
        <button
          className={`method-button ${inputMethod === 'distribution' ? 'active' : ''}`}
          onClick={() => setInputMethod('distribution')}
        >
          Distribution Generation
        </button>
        <button
          className={`method-button ${inputMethod === 'ai' ? 'active' : ''}`}
          onClick={() => setInputMethod('ai')}
        >
          AI Data Generation
        </button>
      </div>

      <div className="input-content">
        {inputMethod === 'file' && (
          <div className="file-upload-section">
            <h3>Upload Data File</h3>
            <p>Supports JSON and CSV format data file import</p>
            <FileImporter onFileImport={handleFileImport} />
          </div>
        )}

        {inputMethod === 'distribution' && (
          <div className="distribution-generator-section">
            <h3>Generate Data from Statistical Distributions</h3>
            <p>Select distribution type and set parameters to generate simulation data</p>
            <DistributionGenerator onDataGenerated={handleDistributionData} />
          </div>
        )}

        {inputMethod === 'ai' && (
          <div className="ai-generator-section">
            <h3>AI Data Generation</h3>
            <p>Describe the data patterns and features you need</p>
            <AIDataGenerator onDataGenerated={handleAIData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DataInputTab;