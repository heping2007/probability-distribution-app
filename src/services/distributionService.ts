import { Distribution, DistributionDataPoint } from '../types';
import { normalDistribution, binomialDistribution, poissonDistribution } from '../utils/mathUtils'

export const getDistributions = (): Distribution[] => {
  return [
    {
      id: 'normal',
      name: 'Normal Distribution',
      formula: 'f(x) = (1/σ√(2π)) e^(-(x-μ)²/(2σ²))',
      parameters: { mean: 0, stdDev: 1 },
      description: 'A continuous probability distribution that is bell-shaped, determined by its mean(μ) and standard deviation(σ).',
      generateData: (params, range, points) => {
        const { mean, stdDev } = params;
        const data: DistributionDataPoint[] = [];
        const step = (range[1] - range[0]) / points;
        
        for (let x = range[0]; x <= range[1]; x += step) {
          const y = normalDistribution(x, mean, stdDev);
          data.push({ x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(6)) });
        }
        
        return data;
      }
    },
    {
      id: 'binomial',
      name: 'Binomial Distribution',
      formula: 'P(k) = C(n,k) p^k (1-p)^(n-k)',
      parameters: { n: 10, p: 0.5 },
      description: 'Represents the probability of k successes in n independent yes/no trials, with each trial having probability p of success.',
      generateData: (params, _, points) => {
        const { n, p } = params;
        const data: DistributionDataPoint[] = [];
        
        for (let k = 0; k <= Math.min(n, points); k++) {
          const y = binomialDistribution(k, n, p);
          data.push({ x: k, y: parseFloat(y.toFixed(6)) });
        }
        
        return data;
      }
    },
    {
      id: 'poisson',
      name: 'Poisson Distribution',
      formula: 'P(k) = (λ^k e^(-λ)) / k!',
      parameters: { lambda: 2 },
      description: 'Represents the probability of k events occurring in a fixed interval of time or space, with events happening at a known constant rate λ.',
      generateData: (params, _, points) => {
        const { lambda } = params;
        const data: DistributionDataPoint[] = [];
        
        for (let k = 0; k <= points; k++) {
          const y = poissonDistribution(k, lambda);
          data.push({ x: k, y: parseFloat(y.toFixed(6)) });
        }
        
        return data;
      }
    }
  ];
};

export const getDistributionById = (id: string): Distribution | undefined => {
  return getDistributions().find(dist => dist.id === id);
};