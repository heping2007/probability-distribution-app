import React, { useState } from 'react';
import { DataPoint } from '../DataAnalysisApp';
import ParameterSlider from '../common/ParameterSlider';
import './DistributionGenerator.css';

interface DistributionGeneratorProps {
  onDataGenerated: (data: DataPoint[]) => void;
}

type DistributionType = 'normal' | 'binomial' | 'poisson' | 'uniform';

const DistributionGenerator: React.FC<DistributionGeneratorProps> = ({ onDataGenerated }) => {
  const [distributionType, setDistributionType] = useState<DistributionType>('normal');
  const [sampleSize, setSampleSize] = useState<number>(1000);
  
  // 分布参数
  const [mean, setMean] = useState<number>(0);
  const [stdDev, setStdDev] = useState<number>(1);
  const [n, setN] = useState<number>(10);
  const [p, setP] = useState<number>(0.5);
  const [lambda, setLambda] = useState<number>(3);
  const [min, setMin] = useState<number>(0);
  const [max, setMax] = useState<number>(1);

  const generateNormalData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    for (let i = 0; i < sampleSize; i++) {
      // Box-Muller变换生成正态分布
      let u1 = 0, u2 = 0;
      while(u1 === 0) u1 = Math.random();
      while(u2 === 0) u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const x = mean + stdDev * z0;
      data.push({ x, y: Math.random() }); // y值用于点的位置，这里随机生成
    }
    return data;
  };

  const generateBinomialData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    for (let i = 0; i < sampleSize; i++) {
      let count = 0;
      for (let j = 0; j < n; j++) {
        if (Math.random() < p) count++;
      }
      data.push({ x: count, y: Math.random() });
    }
    return data;
  };

  const generatePoissonData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    for (let i = 0; i < sampleSize; i++) {
      let k = 0;
      let p = 1.0;
      const L = Math.exp(-lambda);
      while (p > L) {
        k++;
        p *= Math.random();
      }
      data.push({ x: k - 1, y: Math.random() });
    }
    return data;
  };

  const generateUniformData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    for (let i = 0; i < sampleSize; i++) {
      const x = min + Math.random() * (max - min);
      data.push({ x, y: Math.random() });
    }
    return data;
  };

  const handleGenerate = () => {
    let data: DataPoint[] = [];
    
    switch (distributionType) {
      case 'normal':
        data = generateNormalData();
        break;
      case 'binomial':
        data = generateBinomialData();
        break;
      case 'poisson':
        data = generatePoissonData();
        break;
      case 'uniform':
        data = generateUniformData();
        break;
    }
    
    onDataGenerated(data);
  };

  return (
    <div className="distribution-generator">
      <div className="distribution-selector">
        <label>Distribution Type:</label>
        <select 
          value={distributionType} 
          onChange={(e) => setDistributionType(e.target.value as DistributionType)}
          className="distribution-select"
        >
          <option value="normal">Normal Distribution</option>
          <option value="binomial">Binomial Distribution</option>
          <option value="poisson">Poisson Distribution</option>
          <option value="uniform">Uniform Distribution</option>
        </select>
      </div>

      <div className="sample-size-control">
        <label>Sample Size: {sampleSize}</label>
        <ParameterSlider
          min={10}
          max={10000}
          value={sampleSize}
          onValueChange={setSampleSize}
          step={10}
        />
      </div>

      {distributionType === 'normal' && (
        <div className="distribution-params">
          <div className="param-group">
            <label>Mean: {mean.toFixed(2)}</label>
            <ParameterSlider
              min={-10}
              max={10}
              value={mean}
              onValueChange={setMean}
              step={0.1}
            />
          </div>
          <div className="param-group">
            <label>Standard Deviation: {stdDev.toFixed(2)}</label>
            <ParameterSlider
              min={0.1}
              max={10}
              value={stdDev}
              onValueChange={setStdDev}
              step={0.1}
            />
          </div>
        </div>
      )}

      {distributionType === 'binomial' && (
        <div className="distribution-params">
          <div className="param-group">
            <label>Number of Trials: {n}</label>
            <ParameterSlider
              min={1}
              max={100}
              value={n}
              onValueChange={setN}
              step={1}
            />
          </div>
          <div className="param-group">
            <label>Success Probability: {p.toFixed(2)}</label>
            <ParameterSlider
              min={0}
              max={1}
              value={p}
              onValueChange={setP}
              step={0.01}
            />
          </div>
        </div>
      )}

      {distributionType === 'poisson' && (
        <div className="distribution-params">
          <div className="param-group">
            <label>λ Value: {lambda.toFixed(2)}</label>
            <ParameterSlider
              min={0.1}
              max={20}
              value={lambda}
              onValueChange={setLambda}
              step={0.1}
            />
          </div>
        </div>
      )}

      {distributionType === 'uniform' && (
        <div className="distribution-params">
          <div className="param-group">
            <label>Minimum: {min.toFixed(2)}</label>
            <ParameterSlider
              min={-10}
              max={10}
              value={min}
              onValueChange={setMin}
              step={0.1}
            />
          </div>
          <div className="param-group">
            <label>Maximum: {max.toFixed(2)}</label>
            <ParameterSlider
              min={min + 0.1}
              max={20}
              value={max}
              onValueChange={setMax}
              step={0.1}
            />
          </div>
        </div>
      )}

      <button className="generate-button" onClick={handleGenerate}>
        Generate Data
      </button>
    </div>
  );
};

export default DistributionGenerator;