import React, { useState } from 'react';
import './ParameterControls.css';

// 与父组件匹配的类型定义
export type DistributionType = 'normal' | 'uniform' | 'binomial' | 'poisson' | 'exponential';

interface ParameterControlsProps {
  distributionType: DistributionType;
  onParametersChange: (type: DistributionType, params: Record<string, number>) => void;
  onRegenerateData?: () => void;
}

const ParameterControls: React.FC<ParameterControlsProps> = ({
  distributionType,
  onParametersChange,
  onRegenerateData
}) => {
  // 基础状态定义 - 使用与父组件相同的默认值
  const [mean, setMean] = useState(0);
  const [stdDev, setStdDev] = useState(1);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(1);
  const [n, setN] = useState(10); // 二项分布参数
  const [p, setP] = useState(0.5); // 二项分布参数
  const [poissonLambda, setPoissonLambda] = useState(1); // 泊松分布参数
  const [exponentialLambda, setExponentialLambda] = useState(1); // 指数分布参数

  // 简单的事件处理函数
  const handleMeanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMean(value);
    // 直接通知父组件 - 这是滑块工作的关键
    onParametersChange('normal', { mean: value, stdDev });
  };

  const handleStdDevChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0.1, parseFloat(e.target.value));
    setStdDev(value);
    // 直接通知父组件
    onParametersChange('normal', { mean, stdDev: value });
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMin(value);
    // 确保min < max
    const validMax = Math.max(max, value + 0.1);
    setMax(validMax);
    // 直接通知父组件
    onParametersChange('uniform', { min: value, max: validMax });
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setMax(value);
    // 确保min < max
    const validMin = Math.min(min, value - 0.1);
    setMin(validMin);
    // 直接通知父组件
    onParametersChange('uniform', { min: validMin, max: value });
  };

  // 二项分布参数处理
  const handleNChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.floor(parseFloat(e.target.value)));
    setN(value);
    // 直接通知父组件
    onParametersChange('binomial', { n: value, p });
  };

  const handlePChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(1, parseFloat(e.target.value)));
    setP(value);
    // 直接通知父组件
    onParametersChange('binomial', { n, p: value });
  };

  // 泊松分布参数处理
  const handleLambdaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0.1, parseFloat(e.target.value));
    setPoissonLambda(value);
    // 直接通知父组件
    onParametersChange('poisson', { lambda: value });
  };

  // 指数分布参数处理
  const handleExponentialLambdaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0.1, parseFloat(e.target.value));
    setExponentialLambda(value);
    // 直接通知父组件
    onParametersChange('exponential', { lambda: value });
  };

  // 单独的应用按钮处理
  const handleApplyChanges = () => {
    // 根据当前分布类型提交参数
    switch (distributionType) {
      case 'normal':
        onParametersChange('normal', { mean, stdDev });
        break;
      case 'uniform':
        // 确保min < max
        const validMin = Math.min(min, max - 0.1);
        const validMax = Math.max(max, min + 0.1);
        setMin(validMin);
        setMax(validMax);
        onParametersChange('uniform', { min: validMin, max: validMax });
        break;
      case 'binomial':
        // 确保参数有效
        const validN = Math.max(1, Math.floor(n));
        const validP = Math.max(0, Math.min(1, p));
        setN(validN);
        setP(validP);
        onParametersChange('binomial', { n: validN, p: validP });
        break;
      case 'poisson':
        const validPoissonLambda = Math.max(0.1, poissonLambda);
        setPoissonLambda(validPoissonLambda);
        onParametersChange('poisson', { lambda: validPoissonLambda });
        break;
      case 'exponential':
        const validExponentialLambda = Math.max(0.1, exponentialLambda);
        setExponentialLambda(validExponentialLambda);
        onParametersChange('exponential', { lambda: validExponentialLambda });
        break;
    }
    
    // 调用数据重新生成函数
    if (onRegenerateData) {
      onRegenerateData();
    }
  };

  return (
    <div className="parameter-controls">
      <h3>Parameter Controls</h3>
      
      {distributionType === 'normal' && (
        <div className="parameter-group">
          <div className="parameter-item">
            <label>Mean: {mean}</label>
            <input 
              type="range" 
              min={-10} 
              max={10} 
              step={0.1} 
              value={mean} 
              onChange={handleMeanChange} 
              className="slider"
            />
            <input 
              type="number" 
              value={mean} 
              onChange={handleMeanChange} 
              min={-10} 
              max={10} 
              step={0.1} 
              className="number-input"
            />
          </div>
          <div className="parameter-item">
            <label>Standard Deviation: {stdDev}</label>
            <input 
              type="range" 
              min={0.1} 
              max={5} 
              step={0.1} 
              value={stdDev} 
              onChange={handleStdDevChange} 
              className="slider"
            />
            <input 
              type="number" 
              value={stdDev} 
              onChange={handleStdDevChange} 
              min={0.1} 
              max={5} 
              step={0.1} 
              className="number-input"
            />
          </div>
        </div>
      )}
      
      {distributionType === 'uniform' && (
        <div className="parameter-group">
          <div className="parameter-item">
            <label>Min: {min}</label>
            <input 
              type="range" 
              min={-10} 
              max={10} 
              step={0.1} 
              value={min} 
              onChange={handleMinChange} 
              className="slider"
            />
            <input 
              type="number" 
              value={min} 
              onChange={handleMinChange} 
              min={-10} 
              max={10} 
              step={0.1} 
              className="number-input"
            />
          </div>
          <div className="parameter-item">
            <label>Max: {max}</label>
            <input 
              type="range" 
              min={-10} 
              max={10} 
              step={0.1} 
              value={max} 
              onChange={handleMaxChange} 
              className="slider"
            />
            <input 
              type="number" 
              value={max} 
              onChange={handleMaxChange} 
              min={-10} 
              max={10} 
              step={0.1} 
              className="number-input"
            />
          </div>
        </div>
      )}
      
      {distributionType === 'binomial' && (
        <div className="parameter-group">
          <div className="parameter-item">
            <label>Number of Trials (n): {n}</label>
            <input 
              type="range" 
              min={1} 
              max={100} 
              step={1} 
              value={n} 
              onChange={handleNChange} 
              className="slider"
            />
            <input 
              type="number" 
              value={n} 
              onChange={handleNChange} 
              min={1} 
              max={100} 
              step={1} 
              className="number-input"
            />
          </div>
          <div className="parameter-item">
            <label>Probability of Success (p): {p.toFixed(2)}</label>
            <input 
              type="range" 
              min={0} 
              max={1} 
              step={0.01} 
              value={p} 
              onChange={handlePChange} 
              className="slider"
            />
            <input 
              type="number" 
              value={p} 
              onChange={handlePChange} 
              min={0} 
              max={1} 
              step={0.01} 
              className="number-input"
            />
          </div>
        </div>
      )}
      
      {distributionType === 'poisson' && (
        <div className="parameter-group">
          <div className="parameter-item">
            <label>Lambda (λ): {poissonLambda}</label>
            <input 
              type="range" 
              min={0.1} 
              max={20} 
              step={0.1} 
              value={poissonLambda} 
              onChange={handleLambdaChange} 
              className="slider"
            />
            <input 
              type="number" 
              value={poissonLambda} 
              onChange={handleLambdaChange} 
              min={0.1} 
              max={20} 
              step={0.1} 
              className="number-input"
            />
          </div>
        </div>
      )}
      
      {distributionType === 'exponential' && (
        <div className="parameter-group">
          <div className="parameter-item">
            <label>Lambda (λ): {exponentialLambda}</label>
            <input 
              type="range" 
              min={0.1} 
              max={10} 
              step={0.1} 
              value={exponentialLambda} 
              onChange={handleExponentialLambdaChange} 
              className="slider"
            />
            <input 
              type="number" 
              value={exponentialLambda} 
              onChange={handleExponentialLambdaChange} 
              min={0.1} 
              max={10} 
              step={0.1} 
              className="number-input"
            />
          </div>
        </div>
      )}
      
      <button onClick={handleApplyChanges} className="apply-button">
        Apply Changes & Regenerate Data
      </button>
    </div>
  );
};

export default ParameterControls;