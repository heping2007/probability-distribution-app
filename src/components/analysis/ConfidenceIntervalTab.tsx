import React, { useState, useMemo } from 'react';
import { DataPoint } from '../DataAnalysisApp';
import './ConfidenceIntervalTab.css';

interface ConfidenceIntervalTabProps {
  data: DataPoint[];
}

interface ConfidenceIntervalResult {
  mean: number;
  stdError: number;
  confidenceLevel: number;
  criticalValue: number;
  lowerBound: number;
  upperBound: number;
  interpretation: string;
}

const ConfidenceIntervalTab: React.FC<ConfidenceIntervalTabProps> = ({ data }) => {
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.95);
  const [selectedAxis, setSelectedAxis] = useState<'x' | 'y'>('y');

  const intervalResult = useMemo(() => {
    if (data.length === 0) return null;
    return calculateConfidenceInterval(data, confidenceLevel, selectedAxis);
  }, [data, confidenceLevel, selectedAxis]);

  return (
    <div className="confidence-interval-tab">
      <h2>置信区间分析</h2>

      <div className="analysis-controls">
        <div className="control-group">
          <label htmlFor="confidence-level">置信水平:</label>
          <select
            id="confidence-level"
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(parseFloat(e.target.value))}
            className="confidence-select"
          >
            <option value="0.90">90%</option>
            <option value="0.95">95%</option>
            <option value="0.99">99%</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="axis-select">选择数据轴:</label>
          <select
            id="axis-select"
            value={selectedAxis}
            onChange={(e) => setSelectedAxis(e.target.value as 'x' | 'y')}
            className="axis-select"
          >
            <option value="x">X轴数据</option>
            <option value="y">Y轴数据</option>
          </select>
        </div>
      </div>

      {intervalResult && (
        <div className="interval-results">
          <div className="stats-card">
            <h3>置信区间计算结果</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">样本均值:</span>
                <span className="stat-value">{intervalResult.mean.toFixed(6)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">标准误:</span>
                <span className="stat-value">{intervalResult.stdError.toFixed(6)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">临界值:</span>
                <span className="stat-value">{intervalResult.criticalValue.toFixed(6)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">样本量:</span>
                <span className="stat-value">{data.length}</span>
              </div>
            </div>
          </div>

          <div className="interval-visualization">
            <h3>{confidenceLevel * 100}% 置信区间</h3>
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
            <h3>解释</h3>
            <p className="interpretation-text">{intervalResult.interpretation}</p>
            <div className="formula-section">
              <h4>计算公式</h4>
              <div className="formula">
                <code>
                  置信区间 = x̄ ± z*(s/√n)
                </code>
                <p className="formula-explanation">
                  其中：x̄ 是样本均值，z* 是对应置信水平的临界值，s 是样本标准差，n 是样本量
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {data.length === 0 && (
        <div className="no-data-message">
          <p>请先导入或生成数据以进行分析</p>
        </div>
      )}
    </div>
  );
};

function calculateConfidenceInterval(data: DataPoint[], confidenceLevel: number, axis: 'x' | 'y'): ConfidenceIntervalResult {
  const values = data.map(point => point[axis]).filter(val => !isNaN(val));
  const n = values.length;
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);
  const stdError = stdDev / Math.sqrt(n);

  // 使用z分布的临界值（大样本近似）
  let criticalValue: number;
  switch (confidenceLevel) {
    case 0.90:
      criticalValue = 1.645;
      break;
    case 0.95:
      criticalValue = 1.96;
      break;
    case 0.99:
      criticalValue = 2.576;
      break;
    default:
      criticalValue = 1.96; // 默认95%
  }

  const marginOfError = criticalValue * stdError;
  const lowerBound = mean - marginOfError;
  const upperBound = mean + marginOfError;

  const interpretation = `我们有${confidenceLevel * 100}%的置信度认为，总体均值μ落在${lowerBound.toFixed(4)}到${upperBound.toFixed(4)}之间。`;

  return {
    mean,
    stdError,
    confidenceLevel,
    criticalValue,
    lowerBound,
    upperBound,
    interpretation
  };
}

function calculatePosition(value: number, result: ConfidenceIntervalResult): number {
  const range = result.upperBound - result.lowerBound;
  const offset = value - result.lowerBound;
  // 添加一些边距，使区间不紧贴容器边缘
  const margin = 10;
  return margin + (offset / range) * (100 - 2 * margin);
}

export default ConfidenceIntervalTab;