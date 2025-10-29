import React, { useState, useMemo } from 'react';
import { DataPoint } from '../DataAnalysisApp';
import './HypothesisTestingTab.css';

type TestType = 't-test' | 'z-test' | 'chi-square';
type TestDirection = 'two-tailed' | 'one-tailed-left' | 'one-tailed-right';

interface HypothesisTestingTabProps {
  data: DataPoint[];
}

interface TestResult {
  statistic: number;
  pValue: number;
  confidenceInterval?: [number, number];
  decision: string;
  interpretation: string;
  error?: string;
}

const HypothesisTestingTab: React.FC<HypothesisTestingTabProps> = ({ data }) => {
  const [testType, setTestType] = useState<TestType>('t-test');
  const [testDirection, setTestDirection] = useState<TestDirection>('two-tailed');
  const [selectedAxis, setSelectedAxis] = useState<'x' | 'y'>('x');
  const [nullHypothesisValue, setNullHypothesisValue] = useState<string>('0');
  const [significanceLevel, setSignificanceLevel] = useState<string>('0.05');
  
  // 计算假设检验结果
  const testResult = useMemo(() => {
    if (data.length === 0) return null;
    
    const values = data.map(point => point[selectedAxis]).filter(val => !isNaN(val));
    const mu0 = parseFloat(nullHypothesisValue);
    const alpha = parseFloat(significanceLevel);
    
    if (isNaN(mu0) || isNaN(alpha) || alpha <= 0 || alpha >= 1) {
      return {
        statistic: NaN,
        pValue: NaN,
        decision: '',
        interpretation: '',
        error: 'Please enter valid hypothesis value and significance level'
      };
    }
    
    switch (testType) {
      case 't-test':
        return performTTest(values, mu0, alpha, testDirection);
      case 'z-test':
        return performZTest(values, mu0, alpha, testDirection);
      case 'chi-square':
        return performChiSquareTest(values, mu0, alpha);
      default:
        return {
          statistic: NaN,
          pValue: NaN,
          decision: '',
          interpretation: '',
          error: 'Unknown test type'
        };
    }
  }, [data, testType, testDirection, selectedAxis, nullHypothesisValue, significanceLevel]);
  
  // t检验实现
  function performTTest(sample: number[], mu0: number, alpha: number, direction: TestDirection): TestResult {
    const n = sample.length;
    const mean = sample.reduce((sum, val) => sum + val, 0) / n;
    const variance = sample.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const stdDev = Math.sqrt(variance);
    const tStat = (mean - mu0) / (stdDev / Math.sqrt(n));
    
    // 简化的p值计算（使用近似方法）
    const df = n - 1;
    let pValue = 0;
    
    // 使用简化的t分布近似
    const tAbs = Math.abs(tStat);
    if (direction === 'two-tailed') {
      pValue = 2 * (1 - tCDF(tAbs, df));
    } else if (direction === 'one-tailed-right') {
      pValue = 1 - tCDF(tStat, df);
    } else {
      pValue = tCDF(tStat, df);
    }
    
    // 计算置信区间
    const tCritical = tInv(1 - alpha / 2, df);
    const marginOfError = tCritical * (stdDev / Math.sqrt(n));
    const confidenceInterval: [number, number] = [
      mean - marginOfError,
      mean + marginOfError
    ];
    
    // 决策和解释
    const rejectNull = direction === 'two-tailed' ? pValue < alpha : 
                     direction === 'one-tailed-right' ? pValue < alpha : 
                     pValue < alpha;
    
    const decision = rejectNull ? 'Reject null hypothesis' : 'Fail to reject null hypothesis';
    const interpretation = `Based on a significance level of ${alpha}, we ${decision.toLowerCase()}. The sample mean (${mean.toFixed(4)}) and the hypothesized value (${mu0})${rejectNull ? ' show a significant difference' : ' do not show a significant difference'}.`;
    
    return {
      statistic: tStat,
      pValue,
      confidenceInterval,
      decision,
      interpretation
    };
  }
  
  // z检验实现
  function performZTest(sample: number[], mu0: number, alpha: number, direction: TestDirection): TestResult {
    const n = sample.length;
    const mean = sample.reduce((sum, val) => sum + val, 0) / n;
    const variance = sample.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const zStat = (mean - mu0) / (stdDev / Math.sqrt(n));
    
    // 简化的p值计算
    let pValue = 0;
    const zAbs = Math.abs(zStat);
    
    if (direction === 'two-tailed') {
      pValue = 2 * (1 - normalCDF(zAbs));
    } else if (direction === 'one-tailed-right') {
      pValue = 1 - normalCDF(zStat);
    } else {
      pValue = normalCDF(zStat);
    }
    
    // 计算置信区间
    const zCritical = normalInv(1 - alpha / 2);
    const marginOfError = zCritical * (stdDev / Math.sqrt(n));
    const confidenceInterval: [number, number] = [
      mean - marginOfError,
      mean + marginOfError
    ];
    
    // 决策和解释
    const rejectNull = direction === 'two-tailed' ? pValue < alpha : 
                     direction === 'one-tailed-right' ? pValue < alpha : 
                     pValue < alpha;
    
    const decision = rejectNull ? 'Reject null hypothesis' : 'Fail to reject null hypothesis';
    const interpretation = `Based on a significance level of ${alpha}, we ${decision.toLowerCase()}. The sample mean (${mean.toFixed(4)}) and the hypothesized value (${mu0})${rejectNull ? ' show a significant difference' : ' do not show a significant difference'}.`;
    
    return {
      statistic: zStat,
      pValue,
      confidenceInterval,
      decision,
      interpretation
    };
  }
  
  // 卡方检验实现（简化版，用于方差检验）
  function performChiSquareTest(sample: number[], sigma0Squared: number, alpha: number): TestResult {
    const n = sample.length;
    const mean = sample.reduce((sum, val) => sum + val, 0) / n;
    const variance = sample.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
    const chiSquareStat = ((n - 1) * variance) / sigma0Squared;
    
    // 简化的p值计算
    const df = n - 1;
    const pValue = 1 - chiSquareCDF(chiSquareStat, df);
    
    // 决策和解释
    const rejectNull = pValue < alpha;
    const decision = rejectNull ? 'Reject null hypothesis' : 'Fail to reject null hypothesis';
    const interpretation = `Based on a significance level of ${alpha}, we ${decision.toLowerCase()}. The sample variance (${variance.toFixed(4)}) and the hypothesized variance (${sigma0Squared})${rejectNull ? ' show a significant difference' : ' do not show a significant difference'}.`;
    
    return {
      statistic: chiSquareStat,
      pValue,
      decision,
      interpretation
    };
  }
  
  // 辅助函数：t分布累积分布函数近似
  function tCDF(t: number, df: number): number {
    // 使用简化的近似计算
    if (t < 0) return 0.5 * tCDF(-t, df);
    const a = 1 / (2 * df - 1);
    const b = 48 / (df * df);
    const c = Math.atan(t / Math.sqrt(df));
    return 0.5 + (c * (1 + a * c * c + b) / Math.PI);
  }
  
  // 辅助函数：t分布逆函数近似
  function tInv(p: number, df: number): number {
    // 使用简化的近似计算
    const z = normalInv(p);
    return z + (z * z * z + z) / (4 * df) + (5 * z * z * z * z * z + 16 * z * z * z + 3 * z) / (96 * df * df);
  }
  
  // 辅助函数：正态分布累积分布函数近似
  function normalCDF(x: number): number {
    const erf = (x: number) => {
      const a1 = 0.254829592;
      const a2 = -0.284496736;
      const a3 = 1.421413741;
      const a4 = -1.453152027;
      const a5 = 1.061405429;
      const p = 0.3275911;
      
      const sign = x >= 0 ? 1 : -1;
      x = Math.abs(x);
      
      const t = 1.0 / (1.0 + p * x);
      const y = t * (a1 + t * (a2 + t * (a3 + t * (a4 + t * a5))));
      
      return sign * (1.0 - y * Math.exp(-x * x / 2));
    };
    
    return 0.5 * (1 + erf(x / Math.sqrt(2)));
  }
  
  // 辅助函数：正态分布逆函数近似
  function normalInv(p: number): number {
    if (p <= 0 || p >= 1) return NaN;
    if (p === 0.5) return 0;
    
    const q = p - 0.5;
    let r = 0.14758361765043333;
    let z = 0;
    
    if (Math.abs(q) <= 0.425) {
      r += 0.3225806451637736 * q;
      r += 0.09934846260608651 * q * q;
      r += 0.05889585384440366 * q * q * q;
      r += 0.01738723886192483 * q * q * q * q;
      r += 0.002965605718285042 * q * q * q * q * q;
      r += 0.0003943313403696383 * q * q * q * q * q * q;
      r += 0.00003203303672637833 * q * q * q * q * q * q * q;
      z = q * r;
    } else {
      z = Math.sqrt(-2 * Math.log(q > 0 ? 1 - p : p));
      r = 0.13285924689802488;
      r += 0.10014142182183118 / z;
      r += 0.02788680783928691 / (z * z);
      r += 0.005264450247636781 / (z * z * z);
      r += 0.0006598813874348456 / (z * z * z * z);
      r += 0.00005098876723377197 / (z * z * z * z * z);
      r += 0.0000012740116116024736 / (z * z * z * z * z * z);
      z = z - r;
      if (q < 0) z = -z;
    }
    
    return z;
  }
  
  // 辅助函数：卡方分布累积分布函数近似
  function chiSquareCDF(x: number, df: number): number {
    // 使用简化的伽马函数近似
    return 1 - lowerIncompleteGamma(df / 2, x / 2) / gamma(df / 2);
  }
  
  // 辅助函数：伽马函数近似
  function gamma(z: number): number {
    const p = [
      0.99999999999980993,
      676.5203681218851,
      -1259.1392167224028,
      771.32342877765313,
      -176.61502916214059,
      12.507343278686905,
      -0.13857109526572012,
      9.9843695780195716e-6,
      1.5056327351493116e-7
    ];
    
    if (z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    }
    
    z -= 1;
    let x = p[0];
    for (let i = 1; i < p.length; i++) {
      x += p[i] / (z + i);
    }
    
    const t = z + p.length - 0.5;
    const sqrt2Pi = Math.sqrt(2 * Math.PI);
    
    return sqrt2Pi * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }
  
  // 辅助函数：不完全伽马函数近似
  function lowerIncompleteGamma(a: number, x: number): number {
    // 使用简化的级数展开近似
    let sum = 0;
    let term = 1 / a;
    let n = 0;
    
    while (Math.abs(term) > 1e-10 && n < 100) {
      sum += term;
      n++;
      term *= x / (a + n);
    }
    
    return Math.pow(x, a) * Math.exp(-x) * sum;
  }
  
  return (
    <div className="hypothesis-testing-tab">
      <h2>Hypothesis Testing</h2>
      
      <div className="test-controls">
        <div className="control-group">
          <label htmlFor="test-type-select">Select Test Type:</label>
          <select
            id="test-type-select"
            value={testType}
            onChange={(e) => setTestType(e.target.value as TestType)}
            className="test-type-select"
          >
            <option value="t-test">t-test (Mean)</option>
            <option value="z-test">z-test (Mean)</option>
            <option value="chi-square">Chi-square Test (Variance)</option>
          </select>
        </div>
        
        {(testType === 't-test' || testType === 'z-test') && (
          <div className="control-group">
            <label htmlFor="test-direction-select">Test Direction:</label>
          <select
            id="test-direction-select"
            value={testDirection}
            onChange={(e) => setTestDirection(e.target.value as TestDirection)}
            className="test-direction-select"
          >
            <option value="two-tailed">Two-tailed Test</option>
            <option value="one-tailed-right">One-tailed Test (Right)</option>
            <option value="one-tailed-left">One-tailed Test (Left)</option>
          </select>
          </div>
        )}
        
        <div className="control-group">
          <label htmlFor="axis-select">Select Data Axis:</label>
          <select
            id="axis-select"
            value={selectedAxis}
            onChange={(e) => setSelectedAxis(e.target.value as 'x' | 'y')}
            className="axis-select"
          >
            <option value="x">X-axis Data</option>
            <option value="y">Y-axis Data</option>
          </select>
        </div>
        
        <div className="control-group">
          <label htmlFor="null-hypothesis-input">
            {testType === 'chi-square' ? 'Hypothesized Variance (σ²₀):' : 'Hypothesized Mean (μ₀):'}
          </label>
          <input
            id="null-hypothesis-input"
            type="number"
            value={nullHypothesisValue}
            onChange={(e) => setNullHypothesisValue(e.target.value)}
            className="null-hypothesis-input"
            step="any"
          />
        </div>
        
        <div className="control-group">
          <label htmlFor="significance-level-input">Significance Level (α):</label>
          <input
            id="significance-level-input"
            type="number"
            value={significanceLevel}
            onChange={(e) => setSignificanceLevel(e.target.value)}
            className="significance-level-input"
            min="0.001"
            max="0.5"
            step="0.001"
          />
        </div>
      </div>
      
      {testResult && !testResult.error && !Number.isNaN(testResult.statistic) && (
        <div className="test-results">
          <div className="result-card">
            <h3>Test Statistics</h3>
            <div className="stat-item">
              <span className="stat-label">
                {testType === 't-test' ? 't-statistic:' : 
                 testType === 'z-test' ? 'z-statistic:' : 'Chi-square statistic:'}
              </span>
              <span className="stat-value">{testResult.statistic.toFixed(6)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">p-value:</span>
              <span className="stat-value" style={{ 
                color: testResult.pValue < parseFloat(significanceLevel) ? '#ff1493' : '#333'
              }}>
                {testResult.pValue.toFixed(6)}
              </span>
            </div>
          </div>
          
          {testResult.confidenceInterval && (
            <div className="result-card">
              <h3>Confidence Interval</h3>
              <div className="confidence-interval">
                <span>
                  ({testResult.confidenceInterval[0].toFixed(4)}, {testResult.confidenceInterval[1].toFixed(4)})
                </span>
              </div>
            </div>
          )}
          
          <div className="result-card">
            <h3>Test Conclusion</h3>
            <div className="decision">
              <strong>{testResult.decision}</strong>
            </div>
            <div className="interpretation">
              {testResult.interpretation}
            </div>
          </div>
        </div>
      )}
      
      {testResult && testResult.error && (
        <div className="error-message">
          <p>{testResult.error}</p>
        </div>
      )}
      
      <div className="formula-section">
        <h3>Test Formulas</h3>
        <div className="formula-content">
          {testType === 't-test' && (
            <div>
              <p>t-statistic calculation formula:</p>
              <p className="formula">t = (x̄ - μ₀) / (s / √n)</p>
              <p>Where: x̄ is sample mean, μ₀ is hypothesized mean, s is sample standard deviation, n is sample size</p>
            </div>
          )}
          {testType === 'z-test' && (
            <div>
              <p>z-statistic calculation formula:</p>
              <p className="formula">z = (x̄ - μ₀) / (σ / √n)</p>
              <p>Where: x̄ is sample mean, μ₀ is hypothesized mean, σ is standard deviation, n is sample size</p>
            </div>
          )}
          {testType === 'chi-square' && (
            <div>
              <p>Chi-square statistic calculation formula:</p>
              <p className="formula">χ² = (n-1)s² / σ₀²</p>
              <p>Where: n is sample size, s² is sample variance, σ₀² is hypothesized variance</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HypothesisTestingTab;