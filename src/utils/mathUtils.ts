// import { evaluate } from 'mathjs'; // 暂时注释，需要时启用

export const factorial = (n: number): number => {
  if (n < 0) return 0;
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
};

export const combination = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  return factorial(n) / (factorial(k) * factorial(n - k));
};

export const normalDistribution = (
  x: number,
  mean: number,
  stdDev: number
): number => {
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
  return coefficient * Math.exp(exponent);
};

export const binomialDistribution = (
  k: number,
  n: number,
  p: number
): number => {
  if (k < 0 || k > n || p < 0 || p > 1) return 0;
  return combination(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
};

export const poissonDistribution = (
  k: number,
  lambda: number
): number => {
  if (k < 0 || lambda <= 0) return 0;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};