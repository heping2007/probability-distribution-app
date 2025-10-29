import React, { useState, useMemo } from 'react';
import { DataPoint } from '../DataAnalysisApp';
import './ConfidenceIntervalTab.css';

interface ConfidenceIntervalTabProps {
  data: DataPoint[];
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
  level: number;
}

interface CIResults {
  xConfidenceInterval: ConfidenceInterval;
  yConfidenceInterval: ConfidenceInterval;
  xMean: number;
  yMean: number;
  xStdDev: number;
  yStdDev: number;
  count: number;
}

const ConfidenceIntervalTab: React.FC<ConfidenceIntervalTabProps> = ({ data }) => {
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);
  const [analysisType, setAnalysisType] = useState<'mean' | 'proportion'>('mean');
  
  const results = useMemo(() => calculateConfidenceIntervals(data, confidenceLevel, analysisType), 
    [data, confidenceLevel, analysisType]);

  return (
    <div className="confidence-interval-tab">
      <h2>Confidence Interval Analysis</h2>
      
      <div className="ci-controls">
        <div className="analysis-type-selector">
          <label>Analysis Type: </label>
          <div className="analysis-type-buttons">
            <button 
              className={`analysis-btn ${analysisType === 'mean' ? 'active' : ''}`}
              onClick={() => setAnalysisType('mean')}
            >
              Mean
            </button>
            <button 
              className={`analysis-btn ${analysisType === 'proportion' ? 'active' : ''}`}
              onClick={() => setAnalysisType('proportion')}
            >
              Proportion
            </button>
          </div>
        </div>
        
        <div className="confidence-level-selector">
          <label>Confidence Level: </label>
          <select 
            value={confidenceLevel} 
            onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
            className="confidence-select"
          >
            <option value={0.90}>90%</option>
            <option value={0.95}>95%</option>
            <option value={0.99}>99%</option>
          </select>
        </div>
      </div>
      
      <div className="ci-results">
        <div className="ci-grid">
          <div className="ci-card">
            <h3>X Variable Analysis</h3>
            <div className="ci-item">
              <span className="ci-label">Statistic:</span>
              <span className="ci-value">{analysisType === 'mean' ? 'Mean' : 'Proportion'}</span>
            </div>
            <div className="ci-item">
              <span className="ci-label">Value:</span>
              <span className="ci-value">{analysisType === 'mean' ? results.xMean.toFixed(4) : calculateProportion(data.map(d => d.x)).toFixed(4)}</span>
            </div>
            <div className="ci-item">
              <span className="ci-label">CI ({(confidenceLevel * 100).toFixed(0)}%):</span>
              <span className="ci-value">[{results.xConfidenceInterval.lower.toFixed(4)}, {results.xConfidenceInterval.upper.toFixed(4)}]</span>
            </div>
            <div className="ci-item">
              <span className="ci-label">Margin of Error:</span>
              <span className="ci-value">{((results.xConfidenceInterval.upper - results.xConfidenceInterval.lower) / 2).toFixed(4)}</span>
            </div>
          </div>
          
          <div className="ci-card">
            <h3>Y Variable Analysis</h3>
            <div className="ci-item">
              <span className="ci-label">Statistic:</span>
              <span className="ci-value">{analysisType === 'mean' ? 'Mean' : 'Proportion'}</span>
            </div>
            <div className="ci-item">
              <span className="ci-label">Value:</span>
              <span className="ci-value">{analysisType === 'mean' ? results.yMean.toFixed(4) : calculateProportion(data.map(d => d.y)).toFixed(4)}</span>
            </div>
            <div className="ci-item">
              <span className="ci-label">CI ({(confidenceLevel * 100).toFixed(0)}%):</span>
              <span className="ci-value">[{results.yConfidenceInterval.lower.toFixed(4)}, {results.yConfidenceInterval.upper.toFixed(4)}]</span>
            </div>
            <div className="ci-item">
              <span className="ci-label">Margin of Error:</span>
              <span className="ci-value">{((results.yConfidenceInterval.upper - results.yConfidenceInterval.lower) / 2).toFixed(4)}</span>
            </div>
          </div>
          
          <div className="ci-card">
            <h3>Methodology</h3>
            <div className="methodology-content">
              <p><strong>Method:</strong> {analysisType === 'mean' ? 'Z-score method' : 'Wald method'}</p>
              <p><strong>Sample Size:</strong> {results.count}</p>
              <p><strong>Critical Value:</strong> {getCriticalValue(confidenceLevel).toFixed(4)}</p>
              <p className="formula-text">
                {analysisType === 'mean' 
                  ? 'Formula: X̄ ± Z*(σ/√n)' 
                  : 'Formula: p̂ ± Z*√(p̂(1-p̂)/n)'}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {results.count === 0 && (
        <div className="no-data-message">
          <p>Please import or generate data for analysis first</p>
        </div>
      )}
    </div>
  );
};

function calculateConfidenceIntervals(data: DataPoint[], confidenceLevel: number, analysisType: 'mean' | 'proportion'): CIResults {
  if (data.length === 0) {
    return {
      xConfidenceInterval: { lower: 0, upper: 0, level: confidenceLevel },
      yConfidenceInterval: { lower: 0, upper: 0, level: confidenceLevel },
      xMean: 0,
      yMean: 0,
      xStdDev: 0,
      yStdDev: 0,
      count: 0,
    };
  }

  const count = data.length;
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);

  // Calculate means and standard deviations
  const xMean = xValues.reduce((sum, val) => sum + val, 0) / count;
  const yMean = yValues.reduce((sum, val) => sum + val, 0) / count;
  
  const xStdDev = Math.sqrt(
    xValues.reduce((sum, val) => sum + Math.pow(val - xMean, 2), 0) / (count - 1) // Sample std dev
  );
  const yStdDev = Math.sqrt(
    yValues.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0) / (count - 1) // Sample std dev
  );

  // Calculate confidence intervals based on analysis type
  let xConfidenceInterval: ConfidenceInterval;
  let yConfidenceInterval: ConfidenceInterval;

  if (analysisType === 'mean') {
    xConfidenceInterval = calculateMeanConfidenceInterval(xMean, xStdDev, count, confidenceLevel);
    yConfidenceInterval = calculateMeanConfidenceInterval(yMean, yStdDev, count, confidenceLevel);
  } else {
    // For proportion, we'll treat non-zero values as successes
    const xProportion = calculateProportion(xValues);
    const yProportion = calculateProportion(yValues);
    
    xConfidenceInterval = calculateProportionConfidenceInterval(xProportion, count, confidenceLevel);
    yConfidenceInterval = calculateProportionConfidenceInterval(yProportion, count, confidenceLevel);
  }

  return {
    xConfidenceInterval,
    yConfidenceInterval,
    xMean,
    yMean,
    xStdDev,
    yStdDev,
    count,
  };
}

function calculateMeanConfidenceInterval(mean: number, stdDev: number, n: number, confidenceLevel: number): ConfidenceInterval {
  const criticalValue = getCriticalValue(confidenceLevel);
  const standardError = stdDev / Math.sqrt(n);
  const marginOfError = criticalValue * standardError;
  
  return {
    lower: mean - marginOfError,
    upper: mean + marginOfError,
    level: confidenceLevel
  };
}

function calculateProportionConfidenceInterval(proportion: number, n: number, confidenceLevel: number): ConfidenceInterval {
  const criticalValue = getCriticalValue(confidenceLevel);
  const standardError = Math.sqrt((proportion * (1 - proportion)) / n);
  const marginOfError = criticalValue * standardError;
  
  // Ensure bounds are within [0, 1]
  return {
    lower: Math.max(0, proportion - marginOfError),
    upper: Math.min(1, proportion + marginOfError),
    level: confidenceLevel
  };
}

function calculateProportion(values: number[]): number {
  // Treat non-zero values as successes for simplicity
  const successes = values.filter(v => v !== 0).length;
  return successes / values.length;
}

function getCriticalValue(confidenceLevel: number): number {
  // Z-scores for common confidence levels
  if (confidenceLevel === 0.90) return 1.645;
  if (confidenceLevel === 0.95) return 1.96;
  if (confidenceLevel === 0.99) return 2.576;
  return 1.96; // Default to 95%
}

export default ConfidenceIntervalTab;