import React, { useState, useEffect } from 'react';
import { DataPoint, Dataset } from '../DataAnalysisApp';
import './HypothesisTestingTab.css';

interface HypothesisTestingTabProps {
  data: DataPoint[];
  datasets?: Dataset[];
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
  // 添加功效函数相关字段
  powerData?: { mean: number; power: number }[];
  actualPower?: number;
}

// 添加功效函数图表的CSS样式
const styles = `
.power-function-chart {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.power-chart-container {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.power-interpretation {
  background-color: #f0f7ff;
  border-left: 4px solid #2196F3;
  padding: 15px;
  border-radius: 4px;
}

.power-interpretation h5 {
  margin-top: 0;
  color: #1565C0;
  font-size: 16px;
}

.power-interpretation p {
  margin-bottom: 10px;
  line-height: 1.5;
  color: #333;
}

.power-interpretation p:last-child {
  margin-bottom: 0;
}
`;

const HypothesisTestingTab: React.FC<HypothesisTestingTabProps> = ({ data, datasets = [] }) => {
  const [hypothesisMean, setHypothesisMean] = useState<number>(10);
  const [significanceLevel, setSignificanceLevel] = useState<number>(0.05);
  const [selectedAxis, setSelectedAxis] = useState<'x' | 'y'>('y');
  const [testResult, setTestResult] = useState<HypothesisTestResult | null>(null);
  const [testType, setTestType] = useState<'single-sample' | 'two-sample'>('single-sample');
  const [selectedDataset1, setSelectedDataset1] = useState<string>('');
  const [selectedDataset2, setSelectedDataset2] = useState<string>('');
  const [assumeEqualVariances, setAssumeEqualVariances] = useState<boolean>(true);
  const [alternativeType, setAlternativeType] = useState<'two-sided' | 'greater' | 'less'>('two-sided');

  const handleTest = () => {
    if (testType === 'single-sample') {
      if (data.length === 0) return;
      const result = performHypothesisTest(data, hypothesisMean, significanceLevel, selectedAxis, alternativeType);
      setTestResult(result);
    } else {
      // 双样本t检验
      const dataset1 = datasets.find(ds => ds.id === selectedDataset1);
      const dataset2 = datasets.find(ds => ds.id === selectedDataset2);
      
      if (!dataset1 || !dataset2 || dataset1.data.length === 0 || dataset2.data.length === 0) {
        alert('Please select two valid datasets with data');
        return;
      }
      
      const result = performTwoSampleTTest(
        dataset1.data, 
        dataset2.data, 
        significanceLevel, 
        selectedAxis,
        assumeEqualVariances,
        alternativeType
      );
      setTestResult(result);
    }
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

  // 将样式添加到DOM中
  useEffect(() => {
    if (!document.getElementById('power-chart-styles')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'power-chart-styles';
      styleElement.textContent = styles;
      document.head.appendChild(styleElement);
    }
    return () => {
      const styleElement = document.getElementById('power-chart-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  return (
    <div className="hypothesis-testing-tab">
      <h2>Hypothesis Testing - Core Interaction Area</h2>

      <div className="test-settings">
        <div className="setting-group">
          <label htmlFor="axis-select">Select Data Axis:</label>
          <select
            id="axis-select"
            value={selectedAxis}
            onChange={(e) => setSelectedAxis(e.target.value as 'x' | 'y')}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            className="axis-select"
            title="Select which axis data to analyze"
          >
            <option value="x">X-axis Data</option>
            <option value="y">Y-axis Data</option>
          </select>
        </div>
        
        <div className="setting-group">
          <label>Test Type:</label>
          <div className="radio-options">
            <label className="radio-option">
              <input
                type="radio"
                name="test-type"
                value="single-sample"
                checked={testType === 'single-sample'}
                onChange={(e) => setTestType(e.target.value as 'single-sample' | 'two-sample')}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                title="Single sample t-test for mean comparison"
              />
              <span>Single-sample T-test</span>
            </label>
            <label className="radio-option">
              <input
                type="radio"
                name="test-type"
                value="two-sample"
                checked={testType === 'two-sample'}
                onChange={(e) => setTestType(e.target.value as 'single-sample' | 'two-sample')}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                title="Two sample t-test for comparing means between datasets"
              />
              <span>Two-sample T-test</span>
            </label>
          </div>
        </div>
        
        {/* Dataset selection for two-sample test */}
        {testType === 'two-sample' && (
          <div className="setting-group dataset-selection-group">
            <label>Datasets for Comparison:</label>
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
                  <option value="">Select dataset</option>
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
                  <option value="">Select dataset</option>
                  {datasets.map(dataset => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="variance-assumption">
              <label className="checkbox-option">
                <input
                type="checkbox"
                checked={assumeEqualVariances}
                onChange={(e) => setAssumeEqualVariances(e.target.checked)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
                <span>Assume equal variances (Student's t-test)</span>
              </label>
              <small className="hint-text">Uncheck for Welch's t-test (unequal variances)</small>
            </div>
          </div>
        )}

        <div className="hypothesis-form">
          <h3>Hypothesis Settings</h3>
          
          {testType === 'single-sample' ? (
            <div className="hypothesis-row">
              <div className="hypothesis-item">
                <label>Null Hypothesis (H₀):</label>
                <div className="hypothesis-input">
                  <span>μ =</span>
                  <input
                    type="number"
                    id="hypothesis-mean"
                    name="hypothesis-mean"
                    value={hypothesisMean}
                    onChange={handleMeanChange}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    step="0.01"
                    className="mean-input"
                    placeholder="Enter hypothesized mean"
                    title="Enter the mean value for the null hypothesis"
                  />
                </div>
              </div>

              <div className="hypothesis-item">
                <label>Alternative Hypothesis (H₁):</label>
                <div className="alternative-selector">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="alternative-type"
                      value="two-sided"
                      checked={alternativeType === 'two-sided'}
                      onChange={(e) => setAlternativeType(e.target.value as 'two-sided' | 'greater' | 'less')}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      title="Two-sided test: H₁: μ ≠ μ₀"
                    />
                    <span>μ ≠ {hypothesisMean}</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="alternative-type"
                      value="greater"
                      checked={alternativeType === 'greater'}
                      onChange={(e) => setAlternativeType(e.target.value as 'two-sided' | 'greater' | 'less')}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      title="One-sided test: H₁: μ > μ₀"
                    />
                    <span>μ &gt; {hypothesisMean}</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="alternative-type"
                      value="less"
                      checked={alternativeType === 'less'}
                      onChange={(e) => setAlternativeType(e.target.value as 'two-sided' | 'greater' | 'less')}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      title="One-sided test: H₁: μ < μ₀"
                    />
                    <span>μ &lt; {hypothesisMean}</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="hypothesis-row">
              <div className="hypothesis-item">
                <label>Null Hypothesis (H₀):</label>
                <div className="hypothesis-display">
                  μ₁ = μ₂ (Means are equal)
                </div>
              </div>

              <div className="hypothesis-item">
                <label>Alternative Hypothesis (H₁):</label>
                <div className="alternative-selector">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="alternative-type"
                      value="two-sided"
                      checked={alternativeType === 'two-sided'}
                      onChange={(e) => setAlternativeType(e.target.value as 'two-sided' | 'greater' | 'less')}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      title="Two-sided test: H₁: μ₁ ≠ μ₂"
                    />
                    <span>μ₁ ≠ μ₂</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="alternative-type"
                      value="greater"
                      checked={alternativeType === 'greater'}
                      onChange={(e) => setAlternativeType(e.target.value as 'two-sided' | 'greater' | 'less')}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      title="One-sided test: H₁: μ₁ > μ₂"
                    />
                    <span>μ₁ &gt; μ₂</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="alternative-type"
                      value="less"
                      checked={alternativeType === 'less'}
                      onChange={(e) => setAlternativeType(e.target.value as 'two-sided' | 'greater' | 'less')}
                      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      title="One-sided test: H₁: μ₁ < μ₂"
                    />
                    <span>μ₁ &lt; μ₂</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="significance-group">
            <label htmlFor="significance-level">Significance Level (α):</label>
            <div className="significance-input">
              <input
                type="number"
                id="significance-level"
                value={significanceLevel}
                onChange={handleSignificanceChange}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                step="0.001"
                min="0.001"
                max="0.999"
                className="alpha-input"
              />
              <div className="alpha-explanation">
                <small>α is the risk of incorrectly rejecting H₀ when it is true (Type I error)</small>
              </div>
            </div>
          </div>

          <button 
            type="button"
            className="test-button"
            onClick={handleTest}
            disabled={data.length === 0}
          >
            Run Test
          </button>
        </div>
      </div>

      {testResult && (
        <div className="test-results">
          <div className="result-summary">
            <h3>Test Results</h3>
            <div className={`conclusion-card ${testResult.rejectNull ? 'reject' : 'not-reject'}`}>
              <h4>Conclusion</h4>
              <p className="conclusion-text">{testResult.conclusion}</p>
              <p className="interpretation-text">{testResult.interpretation}</p>
            </div>
          </div>

          {/* Method A: Decision based on confidence interval */}
          <div className="result-method">
            <h4>Method A: Decision based on Confidence Interval</h4>
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

          {/* Method B: Decision based on p-value */}
          <div className="result-method">
            <h4>Method B: Decision based on p-value</h4>
            <div className="p-value-comparison">
              <div className="value-item">
                <span className="value-label">Calculated p-value:</span>
                <span className="p-value">{formatPValue(testResult.pValue)}</span>
              </div>
              <div className="value-item">
                <span className="value-label">Significance level α:</span>
                <span className="alpha-value">{testResult.significanceLevel.toFixed(4)}</span>
              </div>
              <div className="comparison-result">
                <span className={`comparison-text ${testResult.rejectNull ? 'p-less-alpha' : 'p-greater-alpha'}`}>
                  {testResult.rejectNull ? 'p < α' : 'p ≥ α'}
                </span>
              </div>
            </div>
          </div>

          {/* Method C: Decision based on rejection region */}
          <div className="result-method">
            <h4>Method C: Decision based on Rejection Region</h4>
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
                <span>Rejection Region (α/2)</span>
                <span>Acceptance Region (1-α)</span>
                <span>Rejection Region (α/2)</span>
              </div>
            </div>
          </div>

          {/* Detailed statistics */}
          <div className="detailed-stats">
            <h4>Detailed Statistics</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Sample Mean:</span>
                <span className="stat-value">{testResult.sampleMean.toFixed(6)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sample Std Dev:</span>
                <span className="stat-value">{testResult.sampleStdDev.toFixed(6)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Sample Size:</span>
                <span className="stat-value">{testResult.sampleSize}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Test Statistic:</span>
                <span className="stat-value">{testResult.testStatistic.toFixed(6)}</span>
              </div>
            </div>
          </div>
          
          {/* 功效函数图表 */}
          {testResult.powerData && testResult.actualPower !== undefined && (
            <div className="result-method">
              <h4>Power Function Analysis</h4>
              <div className="power-function-chart">
                <div className="power-chart-container">
                  <svg width="100%" height="300">
                    {/* X轴 */}
                    <line x1="50" y1="250" x2="450" y2="250" stroke="#333" />
                    <text x="250" y="290" textAnchor="middle" fontSize="14">Effect Size (真实均值 - 原假设均值)</text>
                    
                    {/* Y轴 */}
                    <line x1="50" y1="50" x2="50" y2="250" stroke="#333" />
                    <text x="20" y="150" textAnchor="middle" fontSize="14" transform="rotate(-90, 20, 150)">Power</text>
                    
                    {/* 刻度线 */}
                    {/* X轴刻度 - 强制对称化显示 */}
                    {(() => {
                      const data = testResult.powerData;
                      const midIndex = Math.floor(data.length / 2);
                      const quarterIndex = Math.floor(midIndex / 2);
                      const tickIndices = [0, quarterIndex, midIndex, midIndex + quarterIndex, data.length - 1];
                      
                      return tickIndices.map((dataIndex, i) => {
                        const x = 50 + (dataIndex / (data.length - 1)) * 400;
                        const value = data[dataIndex].mean;
                        return (
                          <g key={`x-tick-${i}`}>
                            <line x1={x} y1="250" x2={x} y2="255" stroke="#333" />
                            <text x={x} y="275" textAnchor="middle" fontSize="10">{value.toFixed(2)}</text>
                          </g>
                        );
                      });
                    })()}
                    
                    {/* Y轴刻度 */}
                    {[0, 0.2, 0.4, 0.6, 0.8, 1].map((value, i) => {
                      const y = 250 - value * 200;
                      return (
                        <g key={`y-tick-${i}`}>
                          <line x1="45" y1={y} x2="50" y2={y} stroke="#333" />
                          <text x="40" y={y + 5} textAnchor="end" fontSize="10">{value}</text>
                        </g>
                      );
                    })}
                    
                    {/* 功效函数曲线 */}
                    <path
                      d={testResult.powerData.map((point, i) => {
                        const x = 50 + (i / (testResult.powerData!.length - 1)) * 400;
                        const y = 250 - point.power * 200;
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#2196F3"
                      strokeWidth="2"
                    />
                    
                    {/* 假设均值标记（在效应大小坐标中为0） */}
                    <g>
                      <line
                        x1={50 + ((0 - testResult.powerData![0].mean) / 
                               (testResult.powerData![testResult.powerData!.length - 1].mean - testResult.powerData![0].mean)) * 400}
                        y1="50"
                        x2={50 + ((0 - testResult.powerData![0].mean) / 
                               (testResult.powerData![testResult.powerData!.length - 1].mean - testResult.powerData![0].mean)) * 400}
                        y2="250"
                        stroke="#FF9800"
                        strokeDasharray="5,5"
                      />
                      <text
                        x={50 + ((0 - testResult.powerData![0].mean) / 
                               (testResult.powerData![testResult.powerData!.length - 1].mean - testResult.powerData![0].mean)) * 400}
                        y="40"
                        textAnchor="middle"
                        fontSize="12"
                        fill="#FF9800"
                      >
                        H₀ (0)
                      </text>
                    </g>
                    
                    {/* 样本均值点（效应大小：sampleMean - hypothesisMean） */}
                    <g>
                      <circle
                        cx={50 + (((testResult.sampleMean - testResult.hypothesisMean) - testResult.powerData![0].mean) / 
                               (testResult.powerData![testResult.powerData!.length - 1].mean - testResult.powerData![0].mean)) * 400}
                        cy={250 - testResult.actualPower! * 200}
                        r="5"
                        fill="#4CAF50"
                      />
                      <text
                        x={50 + (((testResult.sampleMean - testResult.hypothesisMean) - testResult.powerData![0].mean) / 
                               (testResult.powerData![testResult.powerData!.length - 1].mean - testResult.powerData![0].mean)) * 400}
                        y={250 - testResult.actualPower! * 200 - 10}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#4CAF50"
                      >
                        Power: {testResult.actualPower!.toFixed(4)}
                      </text>
                    </g>
                  </svg>
                </div>
                <div className="power-interpretation">
                  <h5>Interpretation</h5>
                  <p>
                    The power of the test is {testResult.actualPower!.toFixed(4)}, which means there is a {testResult.actualPower! * 100}% chance of correctly rejecting the null hypothesis when the alternative hypothesis is true (at the observed mean difference).
                  </p>
                  <p>
                    The power function shows how the test's power changes as the true population mean varies from the hypothesized mean (μ₀).
                  </p>
                </div>
              </div>
            </div>
          )}
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

function performHypothesisTest(data: DataPoint[], hypothesisMean: number, significanceLevel: number, axis: 'x' | 'y', alternativeType: 'two-sided' | 'greater' | 'less' = 'two-sided'): HypothesisTestResult {
  const values = data.map(point => point[axis]).filter(val => !isNaN(val));
  const n = values.length;
  const sampleMean = values.reduce((sum, val) => sum + val, 0) / n;
  const sampleVar = values.reduce((sum, val) => sum + Math.pow(val - sampleMean, 2), 0) / (n - 1);
  const sampleStdDev = Math.sqrt(sampleVar);
  const standardError = sampleStdDev / Math.sqrt(n);

  // Calculate t-statistic
  const testStatistic = (sampleMean - hypothesisMean) / standardError;

  // Calculate p-value based on alternative hypothesis
  let pValue: number;
  let criticalValue: number;
  let rejectionRegion: [number, number];

  if (alternativeType === 'two-sided') {
    // 双侧检验：p-value = 2 * P(|Z| > |t|)
    pValue = 2 * (1 - normalCDF(Math.abs(testStatistic)));
    criticalValue = inverseNormalCDF(1 - significanceLevel / 2);
    rejectionRegion = [-criticalValue, criticalValue];
  } else if (alternativeType === 'greater') {
    // 单侧检验（右侧）：p-value = P(Z > t)
    pValue = 1 - normalCDF(testStatistic);
    criticalValue = inverseNormalCDF(1 - significanceLevel);
    rejectionRegion = [criticalValue, Infinity];
  } else { // 'less'
    // 单侧检验（左侧）：p-value = P(Z < t)
    pValue = normalCDF(testStatistic);
    criticalValue = inverseNormalCDF(significanceLevel);
    rejectionRegion = [-Infinity, criticalValue];
  }

  // Calculate confidence interval
  const marginOfError = criticalValue * standardError;
  const confidenceInterval: [number, number] = [
    sampleMean - marginOfError,
    sampleMean + marginOfError
  ];

  // Decision
  const rejectNull = pValue < significanceLevel;

  // Generate conclusion based on alternative hypothesis
  let conclusion: string;
  let interpretation: string;
  
  if (alternativeType === 'two-sided') {
    conclusion = rejectNull 
      ? `At α=${significanceLevel} level, we reject the null hypothesis H₀. Because p-value(${formatPValue(pValue)}) < α(${significanceLevel}).`
      : `At α=${significanceLevel} level, we do not have enough evidence to reject the null hypothesis H₀. Because p-value(${formatPValue(pValue)}) ≥ α(${significanceLevel}).`;
    interpretation = rejectNull
      ? `There is evidence that the population mean is not equal to ${hypothesisMean}.`
      : `There is not enough evidence to conclude that the population mean is different from ${hypothesisMean}.`;
  } else if (alternativeType === 'greater') {
    conclusion = rejectNull 
      ? `At α=${significanceLevel} level, we reject the null hypothesis H₀. Because p-value(${formatPValue(pValue)}) < α(${significanceLevel}).`
      : `At α=${significanceLevel} level, we do not have enough evidence to reject the null hypothesis H₀. Because p-value(${formatPValue(pValue)}) ≥ α(${significanceLevel}).`;
    interpretation = rejectNull
      ? `There is evidence that the population mean is greater than ${hypothesisMean}.`
      : `There is not enough evidence to conclude that the population mean is greater than ${hypothesisMean}.`;
  } else { // 'less'
    conclusion = rejectNull 
      ? `At α=${significanceLevel} level, we reject the null hypothesis H₀. Because p-value(${formatPValue(pValue)}) < α(${significanceLevel}).`
      : `At α=${significanceLevel} level, we do not have enough evidence to reject the null hypothesis H₀. Because p-value(${formatPValue(pValue)}) ≥ α(${significanceLevel}).`;
    interpretation = rejectNull
      ? `There is evidence that the population mean is less than ${hypothesisMean}.`
      : `There is not enough evidence to conclude that the population mean is less than ${hypothesisMean}.`;
  }

  // 生成功效函数数据（根据备择假设类型）
  const powerData = generatePowerData(hypothesisMean, sampleStdDev, n, significanceLevel, alternativeType);
  const actualPower = calculatePowerFunction(hypothesisMean, sampleStdDev, n, significanceLevel, sampleMean, alternativeType);
  
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
    rejectionRegion,
    powerData,
    actualPower
  };
}

// Two-sample t-test function
function performTwoSampleTTest(
  dataset1: DataPoint[],
  dataset2: DataPoint[],
  significanceLevel: number,
  axis: 'x' | 'y',
  assumeEqualVariances: boolean,
  alternativeType: 'two-sided' | 'greater' | 'less' = 'two-sided'
): HypothesisTestResult {
  // Extract values from selected axis
  const values1 = dataset1.map(point => point[axis]).filter(val => !isNaN(val));
  const values2 = dataset2.map(point => point[axis]).filter(val => !isNaN(val));
  
  const n1 = values1.length;
  const n2 = values2.length;
  
  // Calculate means
  const mean1 = values1.reduce((sum, val) => sum + val, 0) / n1;
  const mean2 = values2.reduce((sum, val) => sum + val, 0) / n2;
  
  // Calculate variances
  const var1 = values1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1);
  const var2 = values2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1);
  
  let standardError: number;
  
  if (assumeEqualVariances) {
    // Pooled variance for equal variances
    const pooledVariance = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    standardError = Math.sqrt(pooledVariance * (1/n1 + 1/n2));
  } else {
    // Welch's t-test for unequal variances
    standardError = Math.sqrt(var1/n1 + var2/n2);
    // Satterthwaite approximation for degrees of freedom (not used)
  }
  
  // Calculate t-statistic (difference in means)
  const testStatistic = (mean1 - mean2) / standardError;
  
  // Calculate p-value and critical value based on alternative hypothesis
  let pValue: number;
  let criticalValue: number;
  let rejectionRegion: [number, number];

  if (alternativeType === 'two-sided') {
    // 双侧检验：p-value = 2 * P(|Z| > |t|)
    pValue = 2 * (1 - normalCDF(Math.abs(testStatistic)));
    criticalValue = inverseNormalCDF(1 - significanceLevel / 2);
    rejectionRegion = [-criticalValue, criticalValue];
  } else if (alternativeType === 'greater') {
    // 单侧检验（右侧）：p-value = P(Z > t)
    pValue = 1 - normalCDF(testStatistic);
    criticalValue = inverseNormalCDF(1 - significanceLevel);
    rejectionRegion = [criticalValue, Infinity];
  } else { // 'less'
    // 单侧检验（左侧）：p-value = P(Z < t)
    pValue = normalCDF(testStatistic);
    criticalValue = inverseNormalCDF(significanceLevel);
    rejectionRegion = [-Infinity, criticalValue];
  }
  
  // Calculate confidence interval for the difference
  const marginOfError = criticalValue * standardError;
  const confidenceInterval: [number, number] = [
    (mean1 - mean2) - marginOfError,
    (mean1 - mean2) + marginOfError
  ];
  
  // Decision
  const rejectNull = pValue < significanceLevel;
  
  // Generate conclusion based on alternative hypothesis
  let conclusion: string;
  let interpretation: string;
  
  if (alternativeType === 'two-sided') {
    conclusion = rejectNull
      ? `At 伪=${significanceLevel} level, we reject the null hypothesis H₀: μ₁ = μ₂. Because p-value(${formatPValue(pValue)}) < 伪(${significanceLevel}).`
      : `At 伪=${significanceLevel} level, we do not have enough evidence to reject the null hypothesis H₀: μ₁ = μ₂. Because p-value(${formatPValue(pValue)}) ≥ 伪(${significanceLevel}).`;
    
    interpretation = rejectNull
      ? `There is evidence that the means of the two populations are different. Mean difference: ${(mean1 - mean2).toFixed(4)}`
      : `There is not enough evidence to conclude that the means of the two populations are different. Mean difference: ${(mean1 - mean2).toFixed(4)}`;
  } else if (alternativeType === 'greater') {
    conclusion = rejectNull
      ? `At 伪=${significanceLevel} level, we reject the null hypothesis H₀: μ₁ ≤ μ₂. Because p-value(${formatPValue(pValue)}) < 伪(${significanceLevel}).`
      : `At 伪=${significanceLevel} level, we do not have enough evidence to reject the null hypothesis H₀: μ₁ ≤ μ₂. Because p-value(${formatPValue(pValue)}) ≥ 伪(${significanceLevel}).`;
    
    interpretation = rejectNull
      ? `There is evidence that the mean of population 1 is greater than the mean of population 2. Mean difference: ${(mean1 - mean2).toFixed(4)}`
      : `There is not enough evidence to conclude that the mean of population 1 is greater than the mean of population 2. Mean difference: ${(mean1 - mean2).toFixed(4)}`;
  } else {
    conclusion = rejectNull
      ? `At 伪=${significanceLevel} level, we reject the null hypothesis H₀: μ₁ ≥ μ₂. Because p-value(${formatPValue(pValue)}) < 伪(${significanceLevel}).`
      : `At 伪=${significanceLevel} level, we do not have enough evidence to reject the null hypothesis H₀: μ₁ ≥ μ₂. Because p-value(${formatPValue(pValue)}) ≥ 伪(${significanceLevel}).`;
    
    interpretation = rejectNull
      ? `There is evidence that the mean of population 1 is less than the mean of population 2. Mean difference: ${(mean1 - mean2).toFixed(4)}`
      : `There is not enough evidence to conclude that the mean of population 1 is less than the mean of population 2. Mean difference: ${(mean1 - mean2).toFixed(4)}`;
  }

  // 生成功效函数数据（对于双样本检验，假设均值为0，实际均值为均值差
  const powerData = generatePowerData(0, standardError, Math.min(n1, n2), significanceLevel, alternativeType);
  const actualPower = calculatePowerFunction(0, standardError, Math.min(n1, n2), significanceLevel, mean1 - mean2, alternativeType);
  
  return {
    hypothesisMean: 0, // For two-sample test, H₀: μ₁ - μ₂ = 0
    sampleMean: mean1 - mean2,
    sampleStdDev: standardError, // Using standard error as std dev in result
    sampleSize: Math.min(n1, n2), // Display minimum sample size
    significanceLevel,
    testStatistic,
    pValue,
    confidenceInterval,
    rejectNull,
    conclusion,
    interpretation,
    rejectionRegion,
    powerData,
    actualPower
  };
}

// 格式化p值的辅助函数
function formatPValue(pValue: number): string {
  if (pValue < 0.000001) {
    return '< 0.000001';
  } else if (pValue > 0.999999) {
    return '> 0.999999';
  } else {
    // 对于中间值，保留6位小数
    return pValue.toFixed(6);
  }
}

// 更精确的标准正态分布CDF实现
function normalCDF(x: number): number {
  // 对于极端值的特殊处理
  if (x < -37) return 0;
  if (x > 37) return 1;
  
  // 使用Rational Chebyshev Approximation方法
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  // 计算绝对值并计算符号
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  
  // 使用多项式近似
  const t = 1 / (1 + p * absX);
  const y = t * Math.exp(-absX * absX / 2) * 
            (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
  
  return 0.5 * (1 + sign * (1 - y));
}

// Approximate inverse standard normal CDF
function inverseNormalCDF(p: number): number {
  // For p close to 0 or 1, use approximation
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

// 计算功效函数（Power Function）- 修正版本
function calculatePowerFunction(
  hypothesisMean: number,
  sampleStdDev: number,
  sampleSize: number,
  significanceLevel: number,
  actualMean: number,
  alternativeType: 'two-sided' | 'greater' | 'less' = 'two-sided'
): number {
  // 计算标准误差
  const standardError = sampleStdDev / Math.sqrt(sampleSize);
  
  // 计算临界值根据备择假设类型
  let lowerCritical: number;
  let upperCritical: number;
  
  if (alternativeType === 'two-sided') {
    upperCritical = inverseNormalCDF(1 - significanceLevel / 2);
    lowerCritical = -upperCritical;
  } else if (alternativeType === 'greater') {
    upperCritical = inverseNormalCDF(1 - significanceLevel);
    lowerCritical = -Infinity;
  } else { // 'less'
    lowerCritical = inverseNormalCDF(significanceLevel);
    upperCritical = Infinity;
  }
  
  // 计算检验统计量在H₁下的分布参数
  const effectSize = actualMean - hypothesisMean;
  const nonCentrality = effectSize / standardError;
  
  // 计算功效基于备择假设类型
  let power: number;
  
  if (alternativeType === 'two-sided') {
    // 双侧检验的功效：P(Z < lowerCritical - nonCentrality) + P(Z > upperCritical - nonCentrality)
    const lowerTail = normalCDF(lowerCritical - nonCentrality);
    const upperTail = 1 - normalCDF(upperCritical - nonCentrality);
    power = lowerTail + upperTail;
  } else if (alternativeType === 'greater') {
    // 单侧检验（右侧）：P(Z > upperCritical - nonCentrality)
    power = 1 - normalCDF(upperCritical - nonCentrality);
  } else { // 'less'
    // 单侧检验（左侧）：P(Z < lowerCritical - nonCentrality)
    power = normalCDF(lowerCritical - nonCentrality);
  }
  
  // 确保功效在[0,1]范围内
  return Math.max(0, Math.min(1, power));
}

// 生成功效函数数据点 - 修正版本
function generatePowerData(
  hypothesisMean: number,
  sampleStdDev: number,
  sampleSize: number,
  significanceLevel: number,
  alternativeType: 'two-sided' | 'greater' | 'less' = 'two-sided'
): { mean: number; power: number }[] {
  // 计算标准误差（SE = σ/√n）
  const standardError = sampleStdDev / Math.sqrt(sampleSize);

  // 增加范围以显示更明显的功效变化
  const range = 12; // 增加范围以更好地显示功效曲线
  const numPoints = 200; // 增加数据点密度以获得更平滑的曲线
  const powerData = [];

  // 计算合适的数据点范围
  let minEffectSize: number;
  let maxEffectSize: number;
  
  if (alternativeType === 'two-sided') {
    // 双侧检验：覆盖更大的范围以显示功效变化
    minEffectSize = -range;
    maxEffectSize = range;
  } else if (alternativeType === 'greater') {
    // 单侧检验（右侧）：从0到较大的正值
    minEffectSize = -2; // 包含一些负值以便观察功效在原假设附近的行为
    maxEffectSize = range;
  } else { // 'less'
    // 单侧检验（左侧）：从较大的负值到0
    minEffectSize = -range;
    maxEffectSize = 2; // 包含一些正值以便观察功效在原假设附近的行为
  }

  for (let i = 0; i < numPoints; i++) {
    // 计算功效量（以标准误差为单位）
    const effectSizeParam = minEffectSize + (i * (maxEffectSize - minEffectSize) / (numPoints - 1));

    // 转换为真实均值：actualMean = hypothesisMean + effectSizeParam * SE
    const actualMean = hypothesisMean + effectSizeParam * standardError;

    // 计算功效
    const power = calculatePowerFunction(hypothesisMean, sampleStdDev, sampleSize, significanceLevel, actualMean, alternativeType);

    powerData.push({ mean: actualMean, power });
  }

  return powerData;
}

function calculatePosition(value: number, result: HypothesisTestResult): number {
  const range = result.confidenceInterval[1] - result.confidenceInterval[0];
  const offset = value - result.confidenceInterval[0];
  // Add some margin to prevent the interval from sticking to container edges
  const margin = 5;
  return margin + (offset / range) * (100 - 2 * margin);
}

export default HypothesisTestingTab;