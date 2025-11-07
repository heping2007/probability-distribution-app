import React, { useState, useMemo } from 'react';
import { DataPoint, Dataset } from '../DataAnalysisApp';
import { calculateTwoSampleMeanDifferenceCI } from '../../utils/statistics';
import './ConfidenceIntervalTab.css';

interface ConfidenceIntervalTabProps {
  data: DataPoint[];
  datasets?: Dataset[];
}

interface ConfidenceIntervalResult {
  mean: number;
  stdError: number;
  confidenceLevel: number;
  criticalValue: number;
  lowerBound: number;
  upperBound: number;
  interpretation: string;
  intervalType: 'two-sided' | 'lower-only' | 'upper-only';
}

const ConfidenceIntervalTab: React.FC<ConfidenceIntervalTabProps> = ({ data, datasets = [] }) => {
  const [confidenceLevel, setConfidenceLevel] = useState<number>(95);
  const [selectedAxis, setSelectedAxis] = useState<'x' | 'y'>('y');
  const [intervalType, setIntervalType] = useState<'two-sided' | 'lower-only' | 'upper-only' | 'mean-difference'>('lower-only');
  const [selectedDataset1, setSelectedDataset1] = useState<string>('');
  const [selectedDataset2, setSelectedDataset2] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleConfidenceLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    // Clear previous error
    setError('');
    
    // Validate input range
    if (isNaN(value)) {
      setError('Please enter a valid confidence level');
      return;
    }
    
    if (value < 80 || value > 99) {
      setError('Confidence level must be between 80% and 99%');
    } else {
      setConfidenceLevel(value);
    }
  };

  const intervalResult = useMemo(() => {
    if (confidenceLevel < 80 || confidenceLevel > 99) return null;
    
    if (intervalType === 'mean-difference') {
      const dataset1 = datasets.find(ds => ds.id === selectedDataset1);
      const dataset2 = datasets.find(ds => ds.id === selectedDataset2);
      
      if (!dataset1 || !dataset2) return null;
      
      const values1 = dataset1.data.map((point: DataPoint) => point[selectedAxis]).filter((val: number) => !isNaN(val));
      const values2 = dataset2.data.map((point: DataPoint) => point[selectedAxis]).filter((val: number) => !isNaN(val));
      
      if (values1.length === 0 || values2.length === 0) return null;
      
      return calculateTwoSampleMeanDifferenceCI(values1, values2, confidenceLevel / 100);
    }
    
    if (data.length === 0) return null;
    return calculateConfidenceInterval(data, confidenceLevel / 100, selectedAxis, intervalType as 'two-sided' | 'lower-only' | 'upper-only');
  }, [data, confidenceLevel, selectedAxis, intervalType, datasets, selectedDataset1, selectedDataset2]);

  return (
    <div className="confidence-interval-tab">
      <h2>Confidence Interval Analysis</h2>

      <div className="analysis-controls">
        <div className="control-group">
          <label htmlFor="confidence-level">Confidence Level:</label>
          <div className="confidence-input-group">
            <input
              type="number"
              id="confidence-level"
              value={confidenceLevel}
              onChange={handleConfidenceLevelChange}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              className={`confidence-input ${error ? 'error' : ''}`}
              min="80"
              max="99"
              step="0.1"
            />
            <span className="confidence-percent">%</span>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="control-group">
          <label htmlFor="axis-select">Select Data Axis:</label>
          <select
            id="axis-select"
            value={selectedAxis}
            onChange={(e) => setSelectedAxis(e.target.value as 'x' | 'y')}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            className="axis-select"
          >
            <option value="x">X-axis Data</option>
            <option value="y">Y-axis Data</option>
          </select>
        </div>

        <div className="control-group">
          <label>Confidence Interval Type:</label>
          <div className="interval-type-radio">
            <label className="radio-option">
              <input
                type="radio"
                name="interval-type"
                value="two-sided"
                checked={intervalType === 'two-sided'}
                onChange={(e) => setIntervalType(e.target.value as 'two-sided' | 'lower-only' | 'upper-only' | 'mean-difference')}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
              <span>Two-sided</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="interval-type"
                value="lower-only"
                checked={intervalType === 'lower-only'}
                onChange={(e) => setIntervalType(e.target.value as 'two-sided' | 'lower-only' | 'upper-only' | 'mean-difference')}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
              <span>Lower bound only</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="interval-type"
                value="upper-only"
                checked={intervalType === 'upper-only'}
                onChange={(e) => setIntervalType(e.target.value as 'two-sided' | 'lower-only' | 'upper-only' | 'mean-difference')}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
              <span>Upper bound only</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="interval-type"
                value="mean-difference"
                checked={intervalType === 'mean-difference'}
                onChange={(e) => setIntervalType(e.target.value as 'two-sided' | 'lower-only' | 'upper-only' | 'mean-difference')}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
              <span>Mean Difference (Two Samples)</span>
            </label>
          </div>
        </div>
        
        {/* Dataset selection for two-sample mean difference */}
        {intervalType === 'mean-difference' && (
          <div className="control-group dataset-selection-group">
            <label>Select Datasets for Comparison:</label>
            <div className="dataset-select-container">
              <div className="dataset-select-item">
                <label htmlFor="dataset1">Dataset 1:</label>
                <select
                  id="dataset1"
                  value={selectedDataset1}
                  onChange={(e) => setSelectedDataset1(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  className="dataset-select"
                  title="Select first dataset for comparison"
                >
                  <option value="">Select a dataset</option>
                  {datasets.map(dataset => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="dataset-select-item">
                <label htmlFor="dataset2">Dataset 2:</label>
                <select
                  id="dataset2"
                  value={selectedDataset2}
                  onChange={(e) => setSelectedDataset2(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  className="dataset-select"
                  title="Select second dataset for comparison"
                >
                  <option value="">Select a dataset</option>
                  {datasets.map(dataset => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {intervalResult && (
        <div className="interval-results">
          <div className="stats-card">
            <h3>Confidence Interval Calculation Results</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Sample Mean:</span>
                <span className="stat-value">{intervalResult.mean.toFixed(6)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Standard Error:</span>
                <span className="stat-value">{intervalResult.stdError.toFixed(6)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Critical Value:</span>
                <span className="stat-value">{intervalResult.criticalValue.toFixed(6)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sample Size:</span>
                <span className="stat-value">{data.length}</span>
              </div>
            </div>
          </div>

          <div className="interval-visualization">
            <h3>{confidenceLevel}% Confidence Interval</h3>
            <div className="interval-chart">
              <div className="interval-axis">
                <div 
                  className="interval-bar"
                  style={{
                    left: `${calculatePosition(intervalResult.lowerBound, intervalResult)}%`,
                    width: `${calculatePosition(intervalResult.upperBound, intervalResult) - calculatePosition(intervalResult.lowerBound, intervalResult)}%`
                  }}
                >
                  <div className="interval-center"></div>
                </div>
                <div className="mean-marker" style={{ left: `${50}%` }}></div>
              </div>
              <div className="interval-labels">
                <span className="label-left">{intervalResult.lowerBound.toFixed(4)}</span>
                  <span className="label-center">μ̂</span>
                  <span className="label-right">{intervalResult.upperBound.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div className="interpretation-card">
            <h3>Interpretation</h3>
            <p className="interpretation-text">{intervalResult.interpretation}</p>
            <div className="formula-section">
              <h4>Calculation Formula</h4>
              <div className="formula">
                <code>
                  Confidence Interval = x̄ ± z*(s/√n)
                </code>
                <p className="formula-explanation">
                  Where: x̄ is sample mean, z* is critical value for confidence level, s is sample standard deviation, n is sample size
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {data.length === 0 && (
        <div className="no-data-message">
          <p>Please import or generate data for analysis first</p>
        </div>
      )}
    </div>
  );
};

function calculateConfidenceInterval(
  data: DataPoint[], 
  confidenceLevel: number, 
  axis: 'x' | 'y',
  intervalType: 'two-sided' | 'lower-only' | 'upper-only'
): ConfidenceIntervalResult {
  const values = data.map(point => point[axis]).filter(val => !isNaN(val));
  const n = values.length;
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  const stdError = stdDev / Math.sqrt(n);

  // Calculate critical value for standard normal distribution
  let criticalValue: number;
  switch (confidenceLevel) {
    case 0.90:
      criticalValue = intervalType === 'two-sided' ? 1.645 : 1.282;
      break;
    case 0.95:
      criticalValue = intervalType === 'two-sided' ? 1.96 : 1.645;
      break;
    case 0.99:
      criticalValue = intervalType === 'two-sided' ? 2.576 : 2.326;
      break;
    default:
      criticalValue = intervalType === 'two-sided' ? 1.96 : 1.645; // Default 95%
  }

  const marginOfError = criticalValue * stdError;
  let lowerBound: number;
  let upperBound: number;
  let interpretation: string;

  switch(intervalType) {
    case 'two-sided':
      lowerBound = mean - marginOfError;
      upperBound = mean + marginOfError;
      interpretation = `We are ${confidenceLevel * 100}% confident that the population mean μ falls between ${lowerBound.toFixed(4)} and ${upperBound.toFixed(4)}.`;
      break;
    case 'lower-only':
      lowerBound = mean - marginOfError;
      upperBound = Infinity;
      interpretation = `We are ${confidenceLevel * 100}% confident that the population mean μ is greater than or equal to ${lowerBound.toFixed(4)}.`;
      break;
    case 'upper-only':
      lowerBound = -Infinity;
      upperBound = mean + marginOfError;
      interpretation = `We are ${confidenceLevel * 100}% confident that the population mean μ is less than or equal to ${upperBound.toFixed(4)}.`;
      break;
    default:
      lowerBound = mean - marginOfError;
      upperBound = mean + marginOfError;
      interpretation = `We are ${confidenceLevel * 100}% confident that the population mean μ falls between ${lowerBound.toFixed(4)} and ${upperBound.toFixed(4)}.`;
  }

  return {
    mean,
    stdError,
    confidenceLevel,
    criticalValue,
    lowerBound,
    upperBound,
    interpretation,
    intervalType
  };
}

function calculatePosition(value: number, result: ConfidenceIntervalResult): number {
  // 处理单侧区间的特殊情况
  if (result.intervalType === 'lower-only') {
    // 对于左侧区间，使用一个合理的范围来显示，以均值为中心
    const displayRange = 2 * (result.mean - result.lowerBound);
    const displayLower = result.lowerBound;
    
    if (value === result.lowerBound) {
      return 10; // 左侧边界固定在10%
    }
    if (value === Infinity) {
      return 90; // 右侧边界固定在90%
    }
    
    const offset = value - displayLower;
    return 10 + (offset / displayRange) * 80;
  } 
  
  if (result.intervalType === 'upper-only') {
    // 对于右侧区间，使用一个合理的范围来显示，以均值为中心
    const displayRange = 2 * (result.upperBound - result.mean);
    const displayLower = result.upperBound - displayRange;
    
    if (value === -Infinity) {
      return 10; // 左侧边界固定在10%
    }
    if (value === result.upperBound) {
      return 90; // 右侧边界固定在90%
    }
    
    const offset = value - displayLower;
    return 10 + (offset / displayRange) * 80;
  }
  
  // 双侧区间的正常计算
  const range = result.upperBound - result.lowerBound;
  const offset = value - result.lowerBound;
  // Add some margin to prevent the interval from sticking to container edges
  const margin = 10;
  return margin + (offset / range) * (100 - 2 * margin);
}

export default ConfidenceIntervalTab;