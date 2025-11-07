import React, { useState } from 'react';
import { DataPoint } from '../DataAnalysisApp';
import EnhancedFileImporter from '../common/EnhancedFileImporter';
import ParameterControls, { DistributionType } from '../distributions/ParameterControls';
import './DataInputTab.css';

interface DataInputTabProps {
  onDataGenerated: (data: DataPoint[], name?: string, operationName?: string) => void;
}

const DataInputTab: React.FC<DataInputTabProps> = ({ onDataGenerated }) => {
  const [datasetName, setDatasetName] = useState<string>('');
  const [showDatasetNameInput, setShowDatasetNameInput] = useState<boolean>(false);
  const [inputMethod, setInputMethod] = useState<'file' | 'distribution' | 'ai'>('file');
  const [csvData, setCsvData] = useState<DataPoint[]>([]);
  const [distributionData, setDistributionData] = useState<DataPoint[]>([]);

  const [selectedDistribution, setSelectedDistribution] = useState<DistributionType>('normal');
  const [distributionParameters, setDistributionParameters] = useState<Record<DistributionType, Record<string, number>>>({
    normal: { mean: 0, stdDev: 1 },
    uniform: { min: 0, max: 1 },
    binomial: { n: 10, p: 0.5 },
    poisson: { lambda: 1 }
  });
  const [sampleCount, setSampleCount] = useState<number>(100);
  // File input reference removed


  
  // Handle enhanced file import
  const handleEnhancedFileImport = (data: DataPoint[], source?: string) => {
    setCsvData(data);
    
    // 可以添加额外的逻辑，例如显示导入源信息
    console.log(`Data imported from ${source || 'unknown source'}`);
    
    if (datasetName.trim() || !showDatasetNameInput) {
      onDataGenerated(data, datasetName.trim() || undefined, `Import Data: ${source || 'File'}`);
      setDatasetName('');
    } else {
      setShowDatasetNameInput(true);
    }
  };
  


  // Handle distribution data generation
  const handleDistributionData = () => {
    const distributionNames = {
      normal: 'Normal Distribution',
      uniform: 'Uniform Distribution',
      binomial: 'Binomial Distribution',
      poisson: 'Poisson Distribution'
    };
    
    let data: DataPoint[] = [];
    switch (selectedDistribution) {
      case 'normal':
        const { mean, stdDev } = distributionParameters.normal;
        data = generateNormalDistribution(mean, stdDev, sampleCount);
        break;
      case 'uniform':
        const { min, max } = distributionParameters.uniform;
        data = generateUniformDistribution(min, max, sampleCount);
        break;
      case 'binomial':
        const { n, p } = distributionParameters.binomial;
        data = generateBinomialDistribution(n, p, sampleCount);
        break;
      case 'poisson':
        const { lambda } = distributionParameters.poisson;
        data = generatePoissonDistribution(lambda, sampleCount);
        break;
      default:
        data = [];
    }
    
    setDistributionData(data);
    
    if (datasetName.trim() || !showDatasetNameInput) {
      onDataGenerated(data, datasetName.trim() || undefined, `Generate ${distributionNames[selectedDistribution]} Data`);
      setDatasetName('');
    } else {
      setShowDatasetNameInput(true);
    }
  };
  
  // Handle distribution parameter change
  const handleDistributionParameterChange = (type: DistributionType, params: any) => {
    setDistributionParameters((prev: any) => ({
      ...prev,
      [type]: params
    }));
  };
  
  // Generate normal distribution data
  const generateNormalDistribution = (mean: number, stdDev: number, count: number): DataPoint[] => {
    const data: DataPoint[] = [];
    for (let i = 0; i < count; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const value = mean + z0 * stdDev;
      data.push({ x: i, y: value });
    }
    return data;
  };

  // Generate uniform distribution data
  const generateUniformDistribution = (min: number, max: number, count: number): DataPoint[] => {
    const data: DataPoint[] = [];
    for (let i = 0; i < count; i++) {
      const value = Math.random() * (max - min) + min;
      data.push({ x: i, y: value });
    }
    return data;
  };

  // Generate binomial distribution data
  const generateBinomialDistribution = (n: number, p: number, count: number): DataPoint[] => {
    const data: DataPoint[] = [];
    for (let i = 0; i < count; i++) {
      let successes = 0;
      for (let j = 0; j < n; j++) {
        if (Math.random() < p) {
          successes++;
        }
      }
      data.push({ x: i, y: successes });
    }
    return data;
  };

  // Generate Poisson distribution data
  const generatePoissonDistribution = (lambda: number, count: number): DataPoint[] => {
    const data: DataPoint[] = [];
    for (let i = 0; i < count; i++) {
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= Math.random();
      } while (p > Math.exp(-lambda));
      data.push({ x: i, y: k - 1 });
    }
    return data;
  };
  
  // Handle sample count change
  const handleSampleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value, 10);
    if (!isNaN(count) && count > 0 && count <= 1000) {
      setSampleCount(count);
    }
  };





  // Handle AI-generated data
  const handleAIData = (data: number[], operationName?: string) => {
    // Convert simple number array generated by AI to DataPoint format
    const dataPoints = data.map((value, index) => ({
      x: index,
      y: value
    }));
    
    if (datasetName.trim() || !showDatasetNameInput) {
      onDataGenerated(dataPoints, datasetName.trim() || undefined, operationName || 'AI Generated Data');
      setDatasetName('');
    } else {
      setShowDatasetNameInput(true);
    }
  };
  
  // Mock AIDataGenerator component (if actual component doesn't exist)
  const AIDataGenerator = ({ onDataGenerated }: { onDataGenerated?: (data: number[]) => void }) => {
    const [description, setDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const handleGenerate = () => {
      setIsGenerating(true);
      // Mock AI data generation
      setTimeout(() => {
        const mockData = Array.from({length: 50}, () => Math.random() * 100);
        const callback = onDataGenerated || ((data) => {
          handleAIData(data, 'AI Generated Data');
        });
        callback(mockData);
        setIsGenerating(false);
      }, 1500);
    };
    
    return (
      <div className="ai-generator-container">
        <label htmlFor="ai-description">Data Description:</label>
        <textarea
          id="ai-description"
          name="ai-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          placeholder="Describe your data requirements (e.g., 'Generate 50 points with normal distribution')"
          className="ai-description-input"
        />
        <button 
          type="button"
          onClick={handleGenerate} 
          disabled={isGenerating}
          className="ai-generate-button"
        >
          {isGenerating ? 'Generating...' : 'Generate Data'}
        </button>
      </div>
    );
  };

  return (
    <div className="data-input-tab">
      <div className="input-method-selector">
        <button
          type="button"
          className={`method-button ${inputMethod === 'file' ? 'active' : ''}`}
          onClick={() => setInputMethod('file')}
        >
          File Upload
        </button>
        <button
          type="button"
          className={`method-button ${inputMethod === 'distribution' ? 'active' : ''}`}
          onClick={() => setInputMethod('distribution')}
        >
          Distribution Generator
        </button>
        <button
          type="button"
          className={`method-button ${inputMethod === 'ai' ? 'active' : ''}`}
          onClick={() => setInputMethod('ai')}
        >
          AI Generate Data
        </button>
      </div>

      <div className="input-content">
        {showDatasetNameInput && (
          <div className="dataset-name-input-container">
            <label htmlFor="dataset-name">Dataset Name:</label>
            <input
              id="dataset-name"
              type="text"
              value={datasetName}
              onChange={(e) => setDatasetName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              placeholder="Enter a name for your dataset"
              maxLength={50}
            />
            <div className="dataset-name-actions">
                <button type="button" onClick={() => {
                  // Get data and operation name based on current input type
                  let dataToSave: DataPoint[] = [];
                  let opName = '';
                  const distributionNames = {
                    normal: 'Normal Distribution',
                    uniform: 'Uniform Distribution',
                    binomial: 'Binomial Distribution',
                    poisson: 'Poisson Distribution'
                  };
                  
                  switch (inputMethod) {
                    case 'file':
                      dataToSave = csvData;
                      opName = 'Import File Data';
                      break;
                    case 'distribution':
                      dataToSave = distributionData;
                      opName = `Generate ${distributionNames[selectedDistribution]} Data`;
                      break;
                    case 'ai':
                      // AI生成的数据已经在handleAIData中处理
                      dataToSave = [];
                      opName = 'AI Generated Data';
                      break;
                    default:
                      dataToSave = [];
                      opName = 'Data Update';
                  }
                  
                  if (dataToSave.length > 0) {
                  onDataGenerated(dataToSave, datasetName.trim() || undefined, opName);
                }
                  
                  setShowDatasetNameInput(false);
                  setDatasetName('');
                }}>Save</button>
                <button type="button" onClick={() => {
                  setShowDatasetNameInput(false);
                  setDatasetName('');
                }}>Cancel</button>
              </div>
          </div>
        )}
        
        {inputMethod === 'file' && (
          <div className="file-upload-section">
            <h3>Data Import</h3>
            <p>Supports multiple formats including JSON, CSV, Excel and more</p>
            <EnhancedFileImporter onDataImport={handleEnhancedFileImport} />
          </div>
        )}

        {inputMethod === 'distribution' && (
          <div className="distribution-section">
            <h3>Generate from Distribution</h3>
            
            {/* 分布类型选择 */}
            <div className="distribution-type-selector">
              <label>Distribution Type:</label>
              <div className="distribution-type-buttons">
                <button
                  type="button"
                  className={`distribution-type-btn ${selectedDistribution === 'normal' ? 'active' : ''}`}
                  onClick={() => setSelectedDistribution('normal')}
                >
                  Normal Distribution
                </button>
                <button
                  type="button"
                  className={`distribution-type-btn ${selectedDistribution === 'binomial' ? 'active' : ''}`}
                  onClick={() => setSelectedDistribution('binomial')}
                >
                  Binomial Distribution
                </button>
                <button
                  type="button"
                  className={`distribution-type-btn ${selectedDistribution === 'poisson' ? 'active' : ''}`}
                  onClick={() => setSelectedDistribution('poisson')}
                >
                  Poisson Distribution
                </button>
                <button
                  type="button"
                  className={`distribution-type-btn ${selectedDistribution === 'uniform' ? 'active' : ''}`}
                  onClick={() => setSelectedDistribution('uniform')}
                >
                  Uniform Distribution
                </button>
              </div>
            </div>
            
            {/* 样本数量设置 */}
            <div className="sample-count-control">
              <label htmlFor="sample-count">Sample Count:</label>
              <input
                id="sample-count"
                type="number"
                value={sampleCount}
                onChange={handleSampleCountChange}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                min="1"
                max="1000"
                className="sample-count-input"
              />
            </div>
            
            {/* 参数控制器 */}
            <ParameterControls
              distributionType={selectedDistribution}
              onParametersChange={handleDistributionParameterChange}
              onRegenerateData={handleDistributionData}
            />
            
            {/* 生成数据按钮 */}
            <div className="distribution-options">
              <button type="button" onClick={handleDistributionData} className="generate-button">
                Generate Data
              </button>
            </div>
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