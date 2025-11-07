import React, { useState, useMemo } from 'react';
import { DataPoint } from '../DataAnalysisApp';
import './FeatureDemoTab.css';

interface FeatureDemoTabProps {
  // 暂时保留接口以保持兼容性
}

type DemoType = 'estimationComparison' | 'hypothesisTestDemo';
type ScenarioType = 'sameDistribution' | 'differentDistribution';

const FeatureDemoTab: React.FC<FeatureDemoTabProps> = ({ }) => {
  const [selectedDemo, setSelectedDemo] = useState<DemoType>('estimationComparison');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('sameDistribution');
  const [demoData, setDemoData] = useState<DataPoint[]>([]);

  // 生成演示数据
  const generateDemoData = () => {
    const newData: DataPoint[] = [];
    
    if (selectedDemo === 'estimationComparison') {
      // 生成正态分布数据用于参数估计对比
      const mean = 0.1;
      const std = 1.0;
      for (let i = 0; i < 1000; i++) {
        // Box-Muller transform to generate normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        const value = mean + z0 * std;
        newData.push({ x: i, y: value });
      }
    } else if (selectedDemo === 'hypothesisTestDemo') {
      if (selectedScenario === 'sameDistribution') {
        // 场景1: 相同分布不同参数
        // 生成两个均值不同但方差相同的正态分布
        const mean1 = 0;
        const mean2 = 1;
        const std = 1.5;
        for (let i = 0; i < 500; i++) {
          const u1 = Math.random();
          const u2 = Math.random();
          const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          const z1 = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
          newData.push({ x: i, y: mean1 + z0 * std });
          if (i < 500) {
            newData.push({ x: i + 500, y: mean2 + z1 * std });
          }
        }
      } else {
        // 场景2: 不同分布类型
        // 混合正态分布和指数分布
        for (let i = 0; i < 500; i++) {
          // 正态分布数据
          const values: number[] = [];
          
          // 生成正态分布数据
          const u1 = Math.random();
          const u2 = Math.random();
          const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
          values.push(2 + z0 * 1);
          
          // 生成指数分布数据
          const expValue = -2 * Math.log(Math.random());
          values.push(expValue);
          
          // 简单频率统计
          values.forEach(value => {
            const existingPoint = newData.find(point => Math.abs(point.x - value) < 0.5);
            if (existingPoint) {
              existingPoint.y += 1;
            } else {
              newData.push({ x: Math.round(value * 10) / 10, y: 1 });
            }
          });
        }
      }
    }
    
    setDemoData(newData);
  };

  // 参数估计对比分析
  const estimationComparison = useMemo(() => {
    if (demoData.length === 0) return null;
    
    const values = demoData.map(point => point.y).filter(val => !isNaN(val));
    const n = values.length;
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    
    // MLE估计
    const mleMu = mean;
    const mleSigma = Math.sqrt(variance);
    
    // 矩估计
    const momMu = mean;
    const momSigma = Math.sqrt(variance);
    
    // 差异分析
    const muDiff = Math.abs(mleMu - momMu);
    const sigmaDiff = Math.abs(mleSigma - momSigma);
    let comparison = '';
    
    if (muDiff < 0.01 && sigmaDiff < 0.01) {
      comparison = 'Estimation methods have minimal impact on results';
    } else if (muDiff < 0.1 && sigmaDiff < 0.1) {
      comparison = 'Estimation methods have slight impact on results';
    } else {
      comparison = 'Estimation methods have significant impact on results';
    }
    
    return {
      'Normal Distribution Data': {
        'MLE Estimation': { μ: parseFloat(mleMu.toFixed(4)), σ: parseFloat(mleSigma.toFixed(4)) },
        'Moment Estimation': { μ: parseFloat(momMu.toFixed(4)), σ: parseFloat(momSigma.toFixed(4)) },
        'Difference Analysis': comparison
      }
    };
  }, [demoData]);

  // Hypothesis test capability analysis
  const hypothesisTestAnalysis = useMemo((): Record<string, any> => {
    if (demoData.length === 0) return {};
    
    // Split data into two groups
    const group1 = demoData.slice(0, 500).map(point => point.y).filter(val => !isNaN(val));
    const group2 = demoData.slice(500).map(point => point.y).filter(val => !isNaN(val));
    
    // Calculate statistics for both groups
    const calcStats = (data: number[]) => {
      const n = data.length;
      const mean = data.reduce((sum, val) => sum + val, 0) / n;
      const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1);
      const std = Math.sqrt(variance);
      return { mean, std, n };
    };
    
    const stats1 = calcStats(group1);
    const stats2 = calcStats(group2);
    
    // Perform t-test
    const tStatistic = (stats1.mean - stats2.mean) / 
      Math.sqrt((Math.pow(stats1.std, 2) / stats1.n) + (Math.pow(stats2.std, 2) / stats2.n));
    
    // Simplified p-value calculation
    const pValue = 2 * (1 / (1 + Math.exp(-Math.abs(tStatistic) * 0.5)));
    
    let scenarioResult = {};
    
    if (selectedScenario === 'sameDistribution') {
      scenarioResult = {
        'Scenario': 'Same Distribution Different Parameters',
        'Test': 'H₀: μ₁ = μ₂ vs H₁: μ₁ ≠ μ₂',
        'Group 1 Statistics': { mean: parseFloat(stats1.mean.toFixed(4)), std: parseFloat(stats1.std.toFixed(4)), n: stats1.n },
        'Group 2 Statistics': { mean: parseFloat(stats2.mean.toFixed(4)), std: parseFloat(stats2.std.toFixed(4)), n: stats2.n },
        't Statistic': parseFloat(tStatistic.toFixed(4)),
        'p Value': parseFloat(pValue.toFixed(4)),
        'Conclusion': pValue < 0.05 ? 'Reject null hypothesis, significant difference in means' : 'Fail to reject null hypothesis, no significant difference in means',
        'Description': 'Demonstrates statistical test capability to detect distribution parameter differences'
      };
    } else {
      // For different distribution types, use KS test approach
      const ksStatistic = calculateKSSimilarity(group1, group2);
      scenarioResult = {
        'Scenario': 'Different Distribution Types',
        'Test': 'Distribution Consistency Test',
        'Group 1 Distribution Features': `mean=${stats1.mean.toFixed(4)}, std=${stats1.std.toFixed(4)}`,
        'Group 2 Distribution Features': `mean=${stats2.mean.toFixed(4)}, std=${stats2.std.toFixed(4)}`,
        'KS Statistic': parseFloat(ksStatistic.toFixed(4)),
        'Conclusion': ksStatistic > 0.1 ? 'Reject distribution consistency hypothesis, significant difference in distributions' : 'Fail to reject distribution consistency hypothesis',
        'Description': 'Demonstrates test method sensitivity to distribution shape differences'
      };
    }
    
    return scenarioResult;
  }, [demoData, selectedScenario]);

  // 简化的KS相似度计算
  const calculateKSSimilarity = (sample1: number[], sample2: number[]): number => {
    const combined = [...sample1, ...sample2];
    const sorted = [...combined].sort((a, b) => a - b);
    
    let maxDiff = 0;
    for (const value of sorted) {
      const cdf1 = sample1.filter(x => x <= value).length / sample1.length;
      const cdf2 = sample2.filter(x => x <= value).length / sample2.length;
      const diff = Math.abs(cdf1 - cdf2);
      maxDiff = Math.max(maxDiff, diff);
    }
    
    return maxDiff;
  };

  return (
    <div className="feature-demo-tab">
      <h2>Advanced Statistical Features Demo</h2>
      
      <div className="demo-controls">
        <div className="control-group">
          <label htmlFor="demo-select">Select Feature Demo:</label>
          <select
            id="demo-select"
            value={selectedDemo}
            onChange={(e) => setSelectedDemo(e.target.value as DemoType)}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            className="demo-select"
          >
            <option value="estimationComparison">Parameter Estimation Comparison</option>
            <option value="hypothesisTestDemo">Hypothesis Test Demo</option>
          </select>
        </div>
        
        {selectedDemo === 'hypothesisTestDemo' && (
          <div className="control-group">
            <label htmlFor="scenario-select">Select Scenario:</label>
            <select
                id="scenario-select"
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value as ScenarioType)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                className="scenario-select"
              >
              <option value="sameDistribution">Scenario 1: Same Distribution Different Parameters</option>
              <option value="differentDistribution">Scenario 2: Different Distribution Types</option>
            </select>
          </div>
        )}
        
        <button 
          className="generate-button"
          onClick={generateDemoData}
          type="button"
        >
          Generate Demo Data
        </button>
      </div>

      {selectedDemo === 'estimationComparison' && estimationComparison && (
        <div className="estimation-comparison-result">
          <h3>Parameter Estimation Method Comparison</h3>
          <p className="analysis-description">Result differences when estimating the same data with different methods</p>
          
          <div className="comparison-grid">
            {Object.entries(estimationComparison).map(([dataType, results]) => (
              <div key={dataType} className="comparison-card">
                <h4>{dataType}</h4>
                
                <div className="methods-container">
                  {Object.entries(results).map(([method, value]) => (
                    <div key={method} className="method-section">
                      <h5>{method}</h5>
                      {typeof value === 'string' ? (
                        <p className="comparison-text">{value}</p>
                      ) : (
                        <div className="params-list">
                          {Object.entries(value).map(([param, paramValue]) => (
                            <div key={param} className="param-item">
                              <span className="param-label">{param}:</span>
                              <span className="param-value">{paramValue}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="insight-section">
            <h4>Analysis Insights</h4>
            <p>For normal distribution data, MLE estimation and moment estimation usually produce very similar results. This is because parameter estimation for normal distributions has consistency, meaning different estimation methods converge to the same value with large datasets. In small sample cases, slight differences may be observed, but these differences decrease as the sample size increases.</p>
          </div>
        </div>
      )}

      {selectedDemo === 'hypothesisTestDemo' && hypothesisTestAnalysis && (
        <div className="hypothesis-test-result">
          <h3>Hypothesis Testing Capability Demonstration Results</h3>
          
          <div className="test-result-card">
            <div className="result-header">
              <h4>{hypothesisTestAnalysis['Scenario']}</h4>
              <div className={`conclusion-badge ${hypothesisTestAnalysis['Conclusion'].includes('Reject') ? 'reject' : 'not-reject'}`}>
                {hypothesisTestAnalysis['Conclusion']}
              </div>
            </div>
            
            <div className="test-details">
              <p><strong>Test Type:</strong> {hypothesisTestAnalysis['Test']}</p>
          <p><strong>Description:</strong> {hypothesisTestAnalysis['Description']}</p>
              
              {selectedScenario === 'sameDistribution' && (
                <div className="groups-comparison">
                  <div className="group-stats">
                    <h5>Group 1 Statistics</h5>
                    <p>Mean: {hypothesisTestAnalysis['Group 1 Statistics']?.mean}</p>
          <p>Standard Deviation: {hypothesisTestAnalysis['Group 1 Statistics']?.std}</p>
          <p>Sample Size: {hypothesisTestAnalysis['Group 1 Statistics']?.n}</p>
                  </div>
                  <div className="group-stats">
                    <h5>Group 2 Statistics</h5>
                    <p>Mean: {hypothesisTestAnalysis['Group 2 Statistics']?.mean}</p>
          <p>Standard Deviation: {hypothesisTestAnalysis['Group 2 Statistics']?.std}</p>
          <p>Sample Size: {hypothesisTestAnalysis['Group 2 Statistics']?.n}</p>
                  </div>
                  <div className="test-stats">
                    <h5>Test Results</h5>
                    <p>t Statistic: {hypothesisTestAnalysis['t Statistic']}</p>
          <p>p Value: {hypothesisTestAnalysis['p Value']}</p>
                  </div>
                </div>
              )}
              
              {selectedScenario === 'differentDistribution' && (
                <div className="distribution-comparison">
                  <div className="dist-stats">
                    <h5>Group 1 Distribution Features</h5>
                    <p>{hypothesisTestAnalysis['Group 1 Distribution Features']}</p>
                  </div>
                  <div className="dist-stats">
                    <h5>Group 2 Distribution Features</h5>
                    <p>{hypothesisTestAnalysis['Group 2 Distribution Features']}</p>
                  </div>
                  <div className="test-stats">
                    <h5>Test Results</h5>
                    <p>KS Statistic: {hypothesisTestAnalysis['KS Statistic']}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="insight-section">
            <h4>Analysis Insights</h4>
            {selectedScenario === 'sameDistribution' ? (
              <p>This scenario demonstrates the ability of statistical tests to detect differences in distribution parameters. When two samples come from the same distribution but with different parameters, hypothesis testing can detect these differences and provide statistically significant conclusions. The smaller the p-value, the higher the confidence in rejecting the null hypothesis.</p>
            ) : (
              <p>This scenario demonstrates the sensitivity of test methods to differences in distribution shapes. When two samples come from different types of distributions, even if some of their statistics may be similar, distribution consistency tests can still identify differences in their overall distribution shapes.</p>
            )}
          </div>
        </div>
      )}
      
      {demoData.length > 0 && (
        <div className="demo-data-info">
          <p><strong>Demo data generated:</strong> {demoData.length} data points</p>
        </div>
      )}
    </div>
  );
};

export default FeatureDemoTab;