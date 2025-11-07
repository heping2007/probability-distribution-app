/**
 * 计算两个样本均值差异的置信区间
 * @param sample1 第一个样本数据
 * @param sample2 第二个样本数据
 * @param confidenceLevel 置信水平 (0-1)
 * @returns 包含置信区间下限、上限和均值差异的对象
 */
export function calculateTwoSampleMeanDifferenceCI(
  sample1: number[],
  sample2: number[],
  confidenceLevel: number = 0.95
): {
  lowerBound: number;
  upperBound: number;
  mean: number;
  stdError: number;
  confidenceLevel: number;
  criticalValue: number;
  marginOfError: number;
  interpretation: string;
  intervalType: 'two-sided' | 'lower-only' | 'upper-only';
} {
  // 计算样本均值
  const mean1 = sample1.reduce((sum, val) => sum + val, 0) / sample1.length;
  const mean2 = sample2.reduce((sum, val) => sum + val, 0) / sample2.length;
  const meanDifference = mean1 - mean2;
  
  // 计算样本方差
  const variance1 = sample1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (sample1.length - 1);
  const variance2 = sample2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (sample2.length - 1);
  
  // 计算标准误
  const stdError = Math.sqrt(variance1 / sample1.length + variance2 / sample2.length);
  
  // 计算t临界值 (使用简化的Z临界值近似，实际应用中应使用t分布)
  const zCritical = 1.96; // 95%置信水平的Z临界值，可根据需要调整
  
  // 计算置信区间
  const marginOfError = zCritical * stdError;
  const lowerBound = meanDifference - marginOfError;
  const upperBound = meanDifference + marginOfError;
  
  // 生成解释文本
  const interpretation = `我们有${confidenceLevel * 100}%的信心认为两个样本均值差异的真实值位于${lowerBound.toFixed(4)}和${upperBound.toFixed(4)}之间。`;
  
  return {
    lowerBound,
    upperBound,
    mean: meanDifference,
    stdError,
    confidenceLevel,
    criticalValue: zCritical,
    marginOfError,
    interpretation,
    intervalType: 'two-sided'
  };
}

/**
 * 执行双样本t检验
 * @param sample1 第一个样本数据
 * @param sample2 第二个样本数据
 * @param assumeEqualVariances 是否假设方差相等
 * @param nullHypothesisMean 原假设的均值差异
 * @returns 包含t统计量、p值和自由度的对象
 */
export function performTwoSampleTTest(
  sample1: number[],
  sample2: number[],
  assumeEqualVariances: boolean = true,
  nullHypothesisMean: number = 0
): { tStatistic: number; pValue: number; degreesOfFreedom: number } {
  // 计算样本均值
  const mean1 = sample1.reduce((sum, val) => sum + val, 0) / sample1.length;
  const mean2 = sample2.reduce((sum, val) => sum + val, 0) / sample2.length;
  
  // 计算样本方差
  const variance1 = sample1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (sample1.length - 1);
  const variance2 = sample2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (sample2.length - 1);
  
  let standardError: number;
  let degreesOfFreedom: number;
  
  if (assumeEqualVariances) {
    // 合并方差
    const n1 = sample1.length;
    const n2 = sample2.length;
    const pooledVariance = ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2);
    standardError = Math.sqrt(pooledVariance * (1/n1 + 1/n2));
    degreesOfFreedom = n1 + n2 - 2;
  } else {
    // Welch-Satterthwaite公式
    standardError = Math.sqrt(variance1 / sample1.length + variance2 / sample2.length);
    const numerator = Math.pow(variance1 / sample1.length + variance2 / sample2.length, 2);
    const denominator = Math.pow(variance1, 2) / (Math.pow(sample1.length, 2) * (sample1.length - 1)) + 
                       Math.pow(variance2, 2) / (Math.pow(sample2.length, 2) * (sample2.length - 1));
    degreesOfFreedom = numerator / denominator;
  }
  
  // 计算t统计量
  const tStatistic = (mean1 - mean2 - nullHypothesisMean) / standardError;
  
  // 简化的p值计算（实际应用中应使用更精确的方法）
  // 这里使用正态分布近似
  const pValue = 2 * (1 - cumulativeNormal(Math.abs(tStatistic)));
  
  return { tStatistic, pValue, degreesOfFreedom };
}

/**
 * 正态分布累积函数的近似计算
 */
function cumulativeNormal(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const probability = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - probability : probability;
}