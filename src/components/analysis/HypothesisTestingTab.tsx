import React, { useState } from 'react';
import { DataPoint } from '../DataAnalysisApp';
import './HypothesisTestingTab.css';

interface HypothesisTestingTabProps {
  data: DataPoint[];
}

interface HypothesisTestResult {
  hypothesisMean: number;
  sampleMean: number;
  sampleStdDev: number;
  sampleSize: number;
  significanceLevel: number;
  testStatistic: number;
  pValue: number;
  confidenceInterval: [number, number];
  rejectNull: boolean;
  conclusion: string;
  interpretation: string;
  rejectionRegion: [number, number];
}

const HypothesisTestingTab: React.FC<HypothesisTestingTabProps> = ({ data }) => {
  const [hypothesisMean, setHypothesisMean] = useState<number>(10);
  const [significanceLevel, setSignificanceLevel] = useState<number>(0.05);
  const [selectedAxis, setSelectedAxis] = useState<'x' | 'y'>('y');
  const [testResult, setTestResult] = useState<HypothesisTestResult | null>(null);

  const handleTest = () => {
    if (data.length === 0) return;
    const result = performHypothesisTest(data, hypothesisMean, significanceLevel, selectedAxis);
    setTestResult(result);
  };

  const handleMeanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      setHypothesisMean(value);
    }
  };

  const handleSignificanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0 && value < 1) {
      setSignificanceLevel(value);
    }
  };

  return (
    <div className="hypothesis-testing-tab">
      <h2>假设检验 - 核心交互区</h2>

      <div className="test-settings">
        <div className="setting-group">
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

        <div className="hypothesis-form">
          <h3>假设设置</h3>
          
          <div className="hypothesis-row">
            <div className="hypothesis-item">
              <label>原假设 (H₀):</label>
              <div className="hypothesis-input">
                <span>μ =</span>
                <input
                  type="number"
                  value={hypothesisMean}
                  onChange={handleMeanChange}
                  step="0.01"
                  className="mean-input"
                />
              </div>
            </div>

            <div className="hypothesis-item">
              <label>备择假设 (H₁):</label>
              <div className="hypothesis-display">
                μ ≠ {hypothesisMean}
              </div>
            </div>
          </div>

          <div className="significance-group">
            <label htmlFor="significance-level">显著性水平 (α):</label>
            <div className="significance-input">
              <input
                type="number"
                id="significance-level"
                value={significanceLevel}
                onChange={handleSignificanceChange}
                step="0.001"
                min="0.001"
                max="0.999"
                className="alpha-input"
              />
              <div className="alpha-explanation">
                <small>α是当H₀为真时，我们错误地拒绝它的风险（第一类错误）</small>
              </div>
            </div>
          </div>

          <button 
            className="test-button"
            onClick={handleTest}
            disabled={data.length === 0}
          >
            执行检验
          </button>
        </div>
      </div>

      {testResult && (
        <div className="test-results">
          <div className="result-summary">
            <h3>检验结果</h3>
            <div className={`conclusion-card ${testResult.rejectNull ? 'reject' : 'not-reject'}`}>
              <h4>结论</h4>
              <p className="conclusion-text">{testResult.conclusion}</p>
              <p className="interpretation-text">{testResult.interpretation}</p>
            </div>
          </div>

          {/* 方式A：基于置信区间的决策 */}
          <div className="result-method">
            <h4>方式A：基于置信区间的决策</h4>
            <div className="confidence-interval-chart">
              <div className="interval-axis">
                <div 
                  className="interval-bar"
                  style={{
                    left: `${calculatePosition(testResult.confidenceInterval[0], testResult)}%`,
                    width: `${calculatePosition(testResult.confidenceInterval[1], testResult) - calculatePosition(testResult.confidenceInterval[0], testResult)}%`
                  }}
                ></div>
                <div 
                  className={`hypothesis-marker ${testResult.rejectNull ? 'outside' : 'inside'}`}
                  style={{ left: `${calculatePosition(testResult.hypothesisMean, testResult)}%` }}
                ></div>
                <div className="mean-marker" style={{ left: `${calculatePosition(testResult.sampleMean, testResult)}%` }}></div>
              </div>
              <div className="interval-labels">
                <span>{testResult.confidenceInterval[0].toFixed(2)}</span>
                <span>μ̂ = {testResult.sampleMean.toFixed(2)}</span>
                <span>μ₀ = {testResult.hypothesisMean.toFixed(2)}</span>
                <span>{testResult.confidenceInterval[1].toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 方式B：基于p值的决策 */}
          <div className="result-method">
            <h4>方式B：基于p值的决策</h4>
            <div className="p-value-comparison">
              <div className="value-item">
                <span className="value-label">计算得到的p值:</span>
                <span className="p-value">{testResult.pValue.toFixed(6)}</span>
              </div>
              <div className="value-item">
                <span className="value-label">显著性水平α:</span>
                <span className="alpha-value">{testResult.significanceLevel.toFixed(4)}</span>
              </div>
              <div className="comparison-result">
                <span className={`comparison-text ${testResult.rejectNull ? 'p-less-alpha' : 'p-greater-alpha'}`}>
                  {testResult.rejectNull ? 'p < α' : 'p ≥ α'}
                </span>
              </div>
            </div>
          </div>

          {/* 方式C：基于拒绝域的决策 */}
          <div className="result-method">
            <h4>方式C：基于拒绝域的决策</h4>
            <div className="distribution-chart">
              <div className="distribution-curve">
                <div className="curve-shape"></div>
                <div 
                  className="left-rejection-region"
                  style={{ width: `${(testResult.significanceLevel / 2) * 100}%` }}
                ></div>
                <div 
                  className="right-rejection-region"
                  style={{ right: `${(testResult.significanceLevel / 2) * 100}%` }}
                ></div>
                <div 
                  className={`test-statistic-marker ${testResult.rejectNull ? 'in-rejection' : 'not-in-rejection'}`}
                  style={{ left: `${50 + (testResult.testStatistic / 4) * 50}%` }}
                ></div>
              </div>
              <div className="distribution-labels">
                <span>{testResult.rejectionRegion[0].toFixed(2)}</span>
                <span>0</span>
                <span>t = {testResult.testStatistic.toFixed(2)}</span>
                <span>{testResult.rejectionRegion[1].toFixed(2)}</span>
              </div>
              <div className="rejection-labels">
                <span>拒绝域 (α/2)</span>
                <span>接受域 (1-α)</span>
                <span>拒绝域 (α/2)</span>
              </div>
            </div>
          </div>

          {/* 详细统计信息 */}
          <div className="detailed-stats">
            <h4>详细统计信息</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">样本均值:</span>
                <span className="stat-value">{testResult.sampleMean.toFixed(6)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">样本标准差:</span>
                <span className="stat-value">{testResult.sampleStdDev.toFixed(6)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">样本量:</span>
                <span className="stat-value">{testResult.sampleSize}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">检验统计量:</span>
                <span className="stat-value">{testResult.testStatistic.toFixed(6)}</span>
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

function performHypothesisTest(data: DataPoint[], hypothesisMean: number, significanceLevel: number, axis: 'x' | 'y'): HypothesisTestResult {
  const values = data.map(point => point[axis]).filter(val => !isNaN(val));
  const n = values.length;
  const sampleMean = values.reduce((sum, val) => sum + val, 0) / n;
  const sampleVar = values.reduce((sum, val) => sum + Math.pow(val - sampleMean, 2), 0) / (n - 1);
  const sampleStdDev = Math.sqrt(sampleVar);
  const standardError = sampleStdDev / Math.sqrt(n);

  // 计算t统计量
  const testStatistic = (sampleMean - hypothesisMean) / standardError;

  // 计算p值（双侧检验）
  // 使用t分布的近似p值计算
  const pValue = 2 * (1 - normalCDF(Math.abs(testStatistic)));

  // 计算临界值（双侧检验）
  const criticalValue = inverseNormalCDF(1 - significanceLevel / 2);
  const rejectionRegion: [number, number] = [-criticalValue, criticalValue];

  // 计算置信区间
  const marginOfError = criticalValue * standardError;
  const confidenceInterval: [number, number] = [
    sampleMean - marginOfError,
    sampleMean + marginOfError
  ];

  // 决策
  const rejectNull = pValue < significanceLevel;

  // 生成结论
  const conclusion = rejectNull 
    ? `在α=${significanceLevel}水平上，拒绝原假设H₀。因为p值(${pValue.toFixed(6)}) < α(${significanceLevel})。`
    : `在α=${significanceLevel}水平上，没有足够证据拒绝原假设H₀。因为p值(${pValue.toFixed(6)}) ≥ α(${significanceLevel})。`;

  // 解释
  const interpretation = rejectNull
    ? `有证据表明总体均值不等于${hypothesisMean}。`
    : `没有足够证据表明总体均值不等于${hypothesisMean}。`;

  return {
    hypothesisMean,
    sampleMean,
    sampleStdDev,
    sampleSize: n,
    significanceLevel,
    testStatistic,
    pValue,
    confidenceInterval,
    rejectNull,
    conclusion,
    interpretation,
    rejectionRegion
  };
}

// 近似标准正态分布的CDF
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

// 近似标准正态分布的逆CDF
function inverseNormalCDF(p: number): number {
  // 对于p接近0或1的情况，使用近似值
  if (p < 0.000001) return -6;
  if (p > 0.999999) return 6;
  
  const q = p - 0.5;
  let r;
  
  if (Math.abs(q) <= 0.46875) {
    r = q * q;
    const numerator = q * (-0.14054333 * r + 0.4361836) * r - 0.6735230 * r + 0.17087277;
    const denominator = (((0.1005462 * r - 0.1502294) * r + 0.3168492) * r - 0.4592122) * r + 1.0;
    return numerator / denominator;
  } else {
    r = Math.sqrt(-Math.log(Math.min(q, 1 - q)));
    let result;
    
    if (r <= 5.0) {
      r = r - 1.6;
      result = 0.01631538 * r;
      result += 0.09678418;
      result *= r;
      result -= 0.18462768;
      result *= r;
      result += 0.27866108;
      result *= r;
      result -= 0.3750062;
      result *= r;
      result += 0.9372980;
    } else {
      r = r - 5.0;
      result = 0.007745493 * r;
      result += 0.022723844;
      result *= r;
      result += 0.0012438008;
      result *= r;
      result -= 0.0010587218;
      result *= r;
      result -= 0.00061592855;
      result *= r;
      result += 0.00041643836;
    }
    
    return result * (q < 0 ? -1 : 1);
  }
}

function calculatePosition(value: number, result: HypothesisTestResult): number {
  const range = result.confidenceInterval[1] - result.confidenceInterval[0];
  const offset = value - result.confidenceInterval[0];
  // 添加一些边距，使区间不紧贴容器边缘
  const margin = 5;
  return margin + (offset / range) * (100 - 2 * margin);
}

export default HypothesisTestingTab;