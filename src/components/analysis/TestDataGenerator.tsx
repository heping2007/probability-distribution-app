import React from 'react';
import { DataPoint } from '../DataAnalysisApp';

interface TestDataGeneratorProps {
  onDataChange: (data: DataPoint[]) => void;
}

const TestDataGenerator: React.FC<TestDataGeneratorProps> = ({ onDataChange }) => {
  // 生成正态分布数据
  const generateNormalData = (mean: number, stdDev: number, count: number): number[] => {
    const data: number[] = [];
    for (let i = 0; i < count; i++) {
      // Box-Muller变换生成正态分布
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      data.push(mean + stdDev * z0);
    }
    return data;
  };
  
  // 生成均匀分布数据
  const generateUniformData = (min: number, max: number, count: number): number[] => {
    const data: number[] = [];
    for (let i = 0; i < count; i++) {
      data.push(min + Math.random() * (max - min));
    }
    return data;
  };
  
  // 生成指数分布数据
  const generateExponentialData = (lambda: number, count: number): number[] => {
    const data: number[] = [];
    for (let i = 0; i < count; i++) {
      data.push(-Math.log(1 - Math.random()) / lambda);
    }
    return data;
  };
  
  // 测试数据集1：正态分布（有显著差异的均值）
  const generateTestData1 = () => {
    const data: DataPoint[] = [];
    const xData = generateNormalData(10, 2, 50);
    const yData = generateNormalData(15, 3, 50);
    
    for (let i = 0; i < 50; i++) {
      data.push({ x: xData[i], y: yData[i] });
    }
    
    onDataChange(data);
  };
  
  // 测试数据集2：混合分布（用于卡方检验）
  const generateTestData2 = () => {
    const data: DataPoint[] = [];
    const xData = generateExponentialData(0.5, 30).concat(generateNormalData(5, 1, 20));
    const yData = generateUniformData(0, 10, 50);
    
    for (let i = 0; i < 50; i++) {
      data.push({ x: xData[i], y: yData[i] });
    }
    
    onDataChange(data);
  };
  
  return (
    <div className="test-data-generator">
      <h3>Test Data Generator</h3>
      <p>Click the buttons below to generate test data for hypothesis testing functionality:</p>
      <div className="button-group">
        <button 
          onClick={generateTestData1}
          className="generate-button"
        >
          Generate Test Data 1 (Normal Distribution - Significant Mean Difference)
        </button>
        <button 
          onClick={generateTestData2}
          className="generate-button"
        >
          Generate Test Data 2 (Mixed Distribution - For Variance Testing)
        </button>
      </div>
      <div className="data-description">
        <div className="data-info">
          <strong>Test Data 1 Features:</strong>
          <ul>
            <li>X-axis: Normal Distribution N(10, 4) - Mean 10, Standard Deviation 2</li>
            <li>Y-axis: Normal Distribution N(15, 9) - Mean 15, Standard Deviation 3</li>
            <li>Sample size: 50 data points in each group</li>
            <li>Suitable for: t-test, z-test (can detect mean differences)</li>
          </ul>
        </div>
        <div className="data-info">
          <strong>Test Data 2 Features:</strong>
          <ul>
            <li>X-axis: Mixed distribution (Exponential + Normal)</li>
            <li>Y-axis: Uniform distribution U(0, 10)</li>
            <li>Sample size: 50 data points in each group</li>
            <li>Suitable for: Chi-square test (variance testing)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestDataGenerator;