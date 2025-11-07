import React, { useState } from 'react';
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
}

const HypothesisTestingTab: React.FC<HypothesisTestingTabProps> = ({ data, datasets = [] }) => {
  const [hypothesisMean, setHypothesisMean] = useState<number>(10);
  const [significanceLevel, setSignificanceLevel] = useState<number>(0.05);
  const [selectedAxis, setSelectedAxis] = useState<'x' | 'y'>('y');
  const [testResult, setTestResult] = useState<HypothesisTestResult | null>(null);
  const [testType, setTestType] = useState<'single-sample' | 'two-sample'>('single-sample');
  const [selectedDataset1, setSelectedDataset1] = useState<string>('');
  const [selectedDataset2, setSelectedDataset2] = useState<string>('');
  const [assumeEqualVariances, setAssumeEqualVariances] = useState<boolean>(true);

  const handleTest = () => {
    if (testType === 'single-sample') {
      if (data.length === 0) return;
      const result = performHypothesisTest(data, hypothesisMean, significanceLevel, selectedAxis);
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
        assumeEqualVariances
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
                <div className="hypothesis-display">
                  μ ≠ {hypothesisMean}
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
                <div className="hypothesis-display">
                  μ₁ ≠ μ₂ (Means are different)
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
                <span className="p-value">{testResult.pValue.toFixed(6)}</span>
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

function performHypothesisTest(data: DataPoint[], hypothesisMean: number, significanceLevel: number, axis: 'x' | 'y'): HypothesisTestResult {
  const values = data.map(point => point[axis]).filter(val => !isNaN(val));
  const n = values.length;
  const sampleMean = values.reduce((sum, val) => sum + val, 0) / n;
  const sampleVar = values.reduce((sum, val) => sum + Math.pow(val - sampleMean, 2), 0) / (n - 1);
  const sampleStdDev = Math.sqrt(sampleVar);
  const standardError = sampleStdDev / Math.sqrt(n);

  // Calculate t-statistic
  const testStatistic = (sampleMean - hypothesisMean) / standardError;

  // Calculate p-value (two-tailed test)
  // Using normal distribution approximation for p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(testStatistic)));

  // Calculate critical value (two-tailed test)
  const criticalValue = inverseNormalCDF(1 - significanceLevel / 2);
  const rejectionRegion: [number, number] = [-criticalValue, criticalValue];

  // Calculate confidence interval
  const marginOfError = criticalValue * standardError;
  const confidenceInterval: [number, number] = [
    sampleMean - marginOfError,
    sampleMean + marginOfError
  ];

  // Decision
  const rejectNull = pValue < significanceLevel;

  // Generate conclusion
  const conclusion = rejectNull 
    ? `At α=${significanceLevel} level, we reject the null hypothesis H₀. Because p-value(${pValue.toFixed(6)}) < α(${significanceLevel}).`
    : `At α=${significanceLevel} level, we do not have enough evidence to reject the null hypothesis H₀. Because p-value(${pValue.toFixed(6)}) ≥ α(${significanceLevel}).`;

  // Interpretation
  const interpretation = rejectNull
    ? `There is evidence that the population mean is not equal to ${hypothesisMean}.`
    : `There is not enough evidence to conclude that the population mean is different from ${hypothesisMean}.`;

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

// Two-sample t-test function
function performTwoSampleTTest(
  dataset1: DataPoint[],
  dataset2: DataPoint[],
  significanceLevel: number,
  axis: 'x' | 'y',
  assumeEqualVariances: boolean
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
  
  // Calculate p-value (two-tailed test)
  const pValue = 2 * (1 - normalCDF(Math.abs(testStatistic)));
  
  // Calculate critical value (two-tailed test)
  const criticalValue = inverseNormalCDF(1 - significanceLevel / 2);
  const rejectionRegion: [number, number] = [-criticalValue, criticalValue];
  
  // Calculate confidence interval for the difference
  const marginOfError = criticalValue * standardError;
  const confidenceInterval: [number, number] = [
    (mean1 - mean2) - marginOfError,
    (mean1 - mean2) + marginOfError
  ];
  
  // Decision
  const rejectNull = pValue < significanceLevel;
  
  // Generate conclusion
  const conclusion = rejectNull 
    ? `At α=${significanceLevel} level, we reject the null hypothesis H₀. Because p-value(${pValue.toFixed(6)}) < α(${significanceLevel}).`
    : `At α=${significanceLevel} level, we do not have enough evidence to reject the null hypothesis H₀. Because p-value(${pValue.toFixed(6)}) ≥ α(${significanceLevel}).`;
  
  // Interpretation
  const interpretation = rejectNull
    ? `There is evidence that the means of the two populations are different. Mean difference: ${(mean1 - mean2).toFixed(4)}`
    : `There is not enough evidence to conclude that the means of the two populations are different. Mean difference: ${(mean1 - mean2).toFixed(4)}`;
  
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
    rejectionRegion
  };
}

// Approximate standard normal CDF
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
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

function calculatePosition(value: number, result: HypothesisTestResult): number {
  const range = result.confidenceInterval[1] - result.confidenceInterval[0];
  const offset = value - result.confidenceInterval[0];
  // Add some margin to prevent the interval from sticking to container edges
  const margin = 5;
  return margin + (offset / range) * (100 - 2 * margin);
}

export default HypothesisTestingTab;