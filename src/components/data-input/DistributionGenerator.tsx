import { useState } from 'react';
import { DataPoint } from '../DataAnalysisApp';
import ParameterSlider from '../common/ParameterSlider';
import { poissonDistribution, exponentialDistribution } from '../../utils/mathUtils';
import './DistributionGenerator.css';

interface DistributionGeneratorProps {
  onDataGenerated: (data: DataPoint[]) => void;
}

type DistributionType = 'normal' | 'binomial' | 'poisson' | 'uniform' | 'exponential';

const DistributionGenerator = ({
  onDataGenerated
}: DistributionGeneratorProps) => {
  const [distributionType, setDistributionType] = useState<DistributionType>('normal');
  const [sampleSize, setSampleSize] = useState<number>(1000);
  
  // Distribution parameters
  const [mean, setMean] = useState<number>(0);
  const [stdDev, setStdDev] = useState<number>(1);
  const [n, setN] = useState<number>(10);
  const [p, setP] = useState<number>(0.5);
  const [lambda, setLambda] = useState<number>(3);
  const [min, setMin] = useState<number>(0);
  const [max, setMax] = useState<number>(1);
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastGenerated, setLastGenerated] = useState<string>('');

  const generateNormalData = (): DataPoint[] => {
    // Generate random data points
    const randomData: number[] = [];
    const xMin = mean - 4 * stdDev;
    const xMax = mean + 4 * stdDev;
    
    for (let i = 0; i < sampleSize; i++) {
      // Box-Muller transform to generate normal distribution random numbers
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const y = mean + stdDev * z0;
      // Only keep data points within the specified range
      if (y >= xMin && y <= xMax) {
        randomData.push(y);
      }
    }
    
    // Calculate frequency distribution
    const binCount = Math.min(20, Math.ceil(Math.sqrt(randomData.length)));
    const binWidth = (xMax - xMin) / binCount;
    const bins: DataPoint[] = Array(binCount).fill(0).map((_, i) => ({
      x: xMin + i * binWidth + binWidth / 2, // Use bin midpoint as x value
      y: 0
    }));
    
    // Count points in each bin
    randomData.forEach(value => {
      const binIndex = Math.min(
        binCount - 1,
        Math.floor((value - xMin) / binWidth)
      );
      if (binIndex >= 0 && binIndex < binCount) {
        bins[binIndex].y++;
      }
    });
    
    return bins;
  };

  const generateBinomialData = (): DataPoint[] => {
    // 生成随机数据点
    const randomData: number[] = [];
    
    for (let i = 0; i < sampleSize; i++) {
      let successes = 0;
      // 进行n次伯努利试验
      for (let j = 0; j < n; j++) {
        if (Math.random() < p) {
          successes++;
        }
      }
      randomData.push(successes);
    }
    
    // 统计每个可能结果的频率
    const counts = Array(n + 1).fill(0);
    randomData.forEach(value => {
      if (value >= 0 && value <= n) {
        counts[value]++;
      }
    });
    
    // 生成结果数据，y值表示每个x值出现的次数
    return counts.map((count, x) => ({ x, y: count }));
  };

  const generatePoissonData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    // For Poisson distribution, generate enough k values to cover main probability mass
    const maxK = Math.min(Math.ceil(lambda * 3), sampleSize);
    
    for (let k = 0; k <= maxK; k++) {
      // Calculate y values using Poisson distribution probability mass function
      const y = poissonDistribution(k, lambda);
      data.push({ x: k, y });
    }
    return data;
  };

  const generateUniformData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    // Generate equally spaced x values
    const step = (max - min) / (sampleSize - 1);
    // Uniform distribution probability density function value
    const uniformPDF = 1 / (max - min);
    
    for (let i = 0; i < sampleSize; i++) {
      const x = min + i * step;
      data.push({ x, y: uniformPDF });
    }
    return data;
  };

  const generateExponentialData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    // Generate x values from 0 to reasonable range for exponential distribution
    const xMax = Math.min(10 / lambda, 20); // Limit to reasonable range
    
    for (let i = 0; i < sampleSize; i++) {
      const x = (i / (sampleSize - 1)) * xMax;
      const y = exponentialDistribution(x, lambda);
      data.push({ x, y });
    }
    return data;
  };

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      
      // Simulate processing time for better user experience
      await new Promise(resolve => setTimeout(resolve, 300));
      
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
        case 'exponential':
          data = generateExponentialData();
          break;
      }
      
      onDataGenerated(data);
      
      // Update last generated timestamp
      const now = new Date();
      setLastGenerated(`${now.toLocaleDateString()} ${now.toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error generating distribution data:', error);
      alert('生成数据时发生错误，请检查参数设置。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="distribution-generator">
      <div className="distribution-selector">
        <label>Distribution Type: </label>
        <select 
          value={distributionType} 
          onChange={(e) => {
            console.log('Distribution type changed to:', e.target.value);
            setDistributionType(e.target.value as DistributionType);
          }}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
          className="distribution-select"
          title="Select distribution type"
        >
          <option value="normal">Normal Distribution</option>
          <option value="binomial">Binomial Distribution</option>
          <option value="poisson">Poisson Distribution</option>
          <option value="uniform">Uniform Distribution</option>
          <option value="exponential">Exponential Distribution</option>
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
            <label>Lambda (λ): {lambda.toFixed(2)}</label>
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

      {distributionType === 'exponential' && (
        <div className="distribution-params">
          <div className="param-group">
            <label>Lambda (λ): {lambda.toFixed(2)}</label>
            <ParameterSlider
            min={0.1}
            max={5}
            value={lambda}
            onValueChange={setLambda}
            step={0.1}

          />
          </div>
        </div>
      )}

      <button 
        type="button"
        className={`generate-button ${isLoading ? 'loading' : ''}`}
        onClick={handleGenerate}
        disabled={isLoading}
        data-tooltip="Generate data based on selected distribution type and parameters"
      >
        {isLoading ? 'Generating...' : 'Generate Data'}
      </button>
      
      {lastGenerated && (
        <div className="last-generated-info" style={{ marginTop: '10px', fontSize: '12px', color: '#666', textAlign: 'center' }}>
          Last generated: {lastGenerated}
        </div>
      )}
    </div>
  );
};

export default DistributionGenerator;