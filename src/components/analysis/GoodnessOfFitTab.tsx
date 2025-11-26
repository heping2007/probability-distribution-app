import React, { useState, useEffect } from 'react';
import { DataPoint, Dataset } from '../DataAnalysisApp';
import './GoodnessOfFitTab.css';

export interface GoodnessOfFitResult {
  distribution: string;
  parameters: { [key: string]: number };
  pValue: number;
  statistic: number;
  degreesOfFreedom: number;
  isRecommended: boolean;
}

export interface QQPlotData {
  data: DataPoint[];
  theoreticalQuantiles: number[];
  sampleQuantiles: number[];
  distribution: string;
  parameters: { [key: string]: number };
}

interface GoodnessOfFitTabProps {
  data: DataPoint[];
  dataset: Dataset | null;
  datasets: Dataset[];
}

const GoodnessOfFitTab: React.FC<GoodnessOfFitTabProps> = ({ data, dataset, datasets }) => {
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [testResults, setTestResults] = useState<GoodnessOfFitResult[]>([]);
  const [recommendedDistribution, setRecommendedDistribution] = useState<string>('');
  const [qqPlotData, setQQPlotData] = useState<QQPlotData | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [currentDataForAnalysis, setCurrentDataForAnalysis] = useState<DataPoint[]>(data);

  // 处理数据集选择
  const handleDatasetChange = (datasetId: string) => {
    setSelectedDatasetId(datasetId);
    if (datasetId) {
      const selectedDataset = datasets.find(d => d.id === datasetId);
      if (selectedDataset) {
        setCurrentDataForAnalysis(selectedDataset.data);
        setError('');
        // 自动运行检验
        runGoodnessOfFitTest(selectedDataset.data);
      }
    } else {
      setCurrentDataForAnalysis([]);
      setTestResults([]);
      setRecommendedDistribution('');
      setQQPlotData(null);
    }
  };

  // 当当前数据集变化时自动选择
  useEffect(() => {
    if (dataset && dataset.id !== selectedDatasetId) {
      setSelectedDatasetId(dataset.id);
      setCurrentDataForAnalysis(data);
      if (data.length > 0) {
        runGoodnessOfFitTest(data);
      }
    }
  }, [dataset, data]);

  // 运行拟合优度检验
  const runGoodnessOfFitTest = async (dataPoints: DataPoint[]) => {
    setIsRunning(true);
    setError('');

    try {
      const yValues = dataPoints.map(point => point.y);
      
      // 对数据进行排序
      const sortedData = [...yValues].sort((a, b) => a - b);
      const n = sortedData.length;

      if (n < 3) {
        throw new Error('数据点数量不足，至少需要3个数据点');
      }

      // 计算样本统计量
      const sampleMean = sortedData.reduce((sum, val) => sum + val, 0) / n;
      const sampleVariance = sortedData.reduce((sum, val) => sum + Math.pow(val - sampleMean, 2), 0) / n;
      const sampleStd = Math.sqrt(sampleVariance);
      const sampleMin = sortedData[0];
      const sampleMax = sortedData[n - 1];

      // 定义分布类型和对应的参数估计
      const distributions = [
        {
          name: 'Uniform',
          test: () => testUniformDistribution(sortedData, sampleMin, sampleMax)
        },
        {
          name: 'Normal',
          test: () => testNormalDistribution(sortedData, sampleMean, sampleStd)
        },
        {
          name: 'Exponential',
          test: () => testExponentialDistribution(sortedData, sampleMean)
        },
        {
          name: 'Binomial',
          test: () => testBinomialDistribution(sortedData, sampleMean, sampleStd)
        },
        {
          name: 'Poisson',
          test: () => testPoissonDistribution(sortedData, sampleMean)
        }
      ];

      // 对每种分布进行检验
      const results: GoodnessOfFitResult[] = [];
      
      for (const dist of distributions) {
        try {
          const result = await dist.test();
          results.push(result);
        } catch (err) {
          console.warn(`Error testing ${dist.name}:`, err);
          // 添加错误结果
          results.push({
            distribution: dist.name,
            parameters: {},
            pValue: 0,
            statistic: 0,
            degreesOfFreedom: 0,
            isRecommended: false
          });
        }
      }

      // 找到p值最大的分布
      const maxPValueResult = results.reduce((max, current) => 
        current.pValue > max.pValue ? current : max
      );

      // 设置推荐分布
      const resultsWithRecommendation = results.map(result => ({
        ...result,
        isRecommended: result.distribution === maxPValueResult.distribution
      }));

      setTestResults(resultsWithRecommendation);
      setRecommendedDistribution(maxPValueResult.distribution);

      // 生成Q-Q图数据
      generateQQPlotData(sortedData, maxPValueResult);

    } catch (err) {
      setError(err instanceof Error ? err.message : '检验过程中出现错误');
    } finally {
      setIsRunning(false);
    }
  };

  // 检验均匀分布
  const testUniformDistribution = (data: number[], min: number, max: number): GoodnessOfFitResult => {
    const n = data.length;
    const k = Math.ceil(Math.sqrt(n)); // 分组数
    
    // 计算每个区间的期望频数
    const binWidth = (max - min) / k;
    const expectedFreq = n / k;
    
    // 计算实际频数
    const observedFreq = new Array(k).fill(0);
    data.forEach(value => {
      let binIndex = Math.floor((value - min) / binWidth);
      if (binIndex >= k) binIndex = k - 1; // 确保最后一个值在最后一个bin中
      observedFreq[binIndex]++;
    });
    
    // 计算卡方统计量
    let chiSquare = 0;
    for (let i = 0; i < k; i++) {
      const diff = observedFreq[i] - expectedFreq;
      chiSquare += (diff * diff) / expectedFreq;
    }
    
    // df = k - 1 (对于离散均匀分布)
    const df = k - 1;
    const pValue = 1 - chiSquareCDF(chiSquare, df);
    
    return {
      distribution: 'Uniform',
      parameters: { min, max },
      pValue,
      statistic: chiSquare,
      degreesOfFreedom: df,
      isRecommended: false
    };
  };

  // 检验正态分布
  const testNormalDistribution = (data: number[], mean: number, std: number): GoodnessOfFitResult => {
    const n = data.length;
    const k = Math.ceil(Math.sqrt(n));
    
    // 计算分位数
    const quantiles = [];
    for (let i = 1; i <= k; i++) {
      const p = i / (k + 1);
      quantiles.push(normalQuantile(p));
    }
    
    // 计算期望频数
    const expectedFreq = n / k;
    let chiSquare = 0;
    
    // 计算实际频数
    let prevQuantile = -Infinity;
    for (let i = 0; i < k; i++) {
      const currentQuantile = i === k - 1 ? Infinity : quantiles[i + 1];
      const observedFreq = data.filter(val => val > prevQuantile && val <= currentQuantile).length;
      
      chiSquare += Math.pow(observedFreq - expectedFreq, 2) / expectedFreq;
      prevQuantile = currentQuantile;
    }
    
    // df = k - 3 (估计了均值和方差)
    const df = k - 3;
    const pValue = 1 - chiSquareCDF(chiSquare, df);
    
    return {
      distribution: 'Normal',
      parameters: { mean, std },
      pValue,
      statistic: chiSquare,
      degreesOfFreedom: df,
      isRecommended: false
    };
  };

  // 检验指数分布
  const testExponentialDistribution = (data: number[], lambda: number): GoodnessOfFitResult => {
    const n = data.length;
    const k = Math.ceil(Math.sqrt(n));
    const expectedFreq = n / k;
    
    let chiSquare = 0;
    let prevQuantile = 0;
    
    for (let i = 1; i <= k; i++) {
      const p = i / (k + 1);
      const quantile = -Math.log(1 - p) / lambda;
      const observedFreq = data.filter(val => val > prevQuantile && val <= quantile).length;
      
      chiSquare += Math.pow(observedFreq - expectedFreq, 2) / expectedFreq;
      prevQuantile = quantile;
    }
    
    // df = k - 2 (估计了lambda参数)
    const df = k - 2;
    const pValue = 1 - chiSquareCDF(chiSquare, df);
    
    return {
      distribution: 'Exponential',
      parameters: { lambda },
      pValue,
      statistic: chiSquare,
      degreesOfFreedom: df,
      isRecommended: false
    };
  };

  // 检验二项分布
  const testBinomialDistribution = (data: number[], mean: number, std: number): GoodnessOfFitResult => {
    // 对于二项分布，我们假设n已知或估计
    const n = Math.max(...data.map(x => Math.round(x)));
    const p = mean / n;
    
    // 如果p不合理，使用替代方法
    if (p <= 0 || p >= 1 || n === 0) {
      return {
        distribution: 'Binomial',
        parameters: { n: 0, p: 0 },
        pValue: 0,
        statistic: 0,
        degreesOfFreedom: 0,
        isRecommended: false
      };
    }
    
    const k = Math.min(Math.ceil(Math.sqrt(n)), Math.max(...data.map(x => Math.round(x))) + 1);
    const expectedFreq = new Array(k).fill(n / k);
    const observedFreq = new Array(k).fill(0);
    
    data.forEach(value => {
      const roundedValue = Math.min(Math.round(value), k - 1);
      observedFreq[roundedValue]++;
    });
    
    let chiSquare = 0;
    for (let i = 0; i < k; i++) {
      if (expectedFreq[i] > 0) {
        chiSquare += Math.pow(observedFreq[i] - expectedFreq[i], 2) / expectedFreq[i];
      }
    }
    
    // df = k - 3 (估计了n和p)
    const df = k - 3;
    const pValue = 1 - chiSquareCDF(chiSquare, df);
    
    return {
      distribution: 'Binomial',
      parameters: { n, p },
      pValue,
      statistic: chiSquare,
      degreesOfFreedom: df,
      isRecommended: false
    };
  };

  // 检验泊松分布
  const testPoissonDistribution = (data: number[], lambda: number): GoodnessOfFitResult => {
    const n = data.length;
    const k = Math.ceil(Math.sqrt(n));
    const expectedFreq = new Array(k).fill(n / k);
    const observedFreq = new Array(k).fill(0);
    
    data.forEach(value => {
      const roundedValue = Math.min(Math.round(value), k - 1);
      observedFreq[roundedValue]++;
    });
    
    let chiSquare = 0;
    for (let i = 0; i < k; i++) {
      if (expectedFreq[i] > 0) {
        chiSquare += Math.pow(observedFreq[i] - expectedFreq[i], 2) / expectedFreq[i];
      }
    }
    
    // df = k - 2 (估计了lambda参数)
    const df = k - 2;
    const pValue = 1 - chiSquareCDF(chiSquare, df);
    
    return {
      distribution: 'Poisson',
      parameters: { lambda },
      pValue,
      statistic: chiSquare,
      degreesOfFreedom: df,
      isRecommended: false
    };
  };

  // 生成Q-Q图数据
  const generateQQPlotData = (sortedData: number[], bestFit: GoodnessOfFitResult) => {
    const n = sortedData.length;
    const sampleQuantiles = [];
    const theoreticalQuantiles = [];
    
    // 计算样本分位数
    for (let i = 0; i < n; i++) {
      const p = (i + 0.5) / n;
      sampleQuantiles.push(sortedData[i]);
      
      // 根据分布计算理论分位数
      let theoreticalQuantile = 0;
      switch (bestFit.distribution) {
        case 'Normal':
          theoreticalQuantile = bestFit.parameters.mean + bestFit.parameters.std * normalQuantile(p);
          break;
        case 'Exponential':
          theoreticalQuantile = -Math.log(1 - p) / bestFit.parameters.lambda;
          break;
        case 'Uniform':
          theoreticalQuantile = bestFit.parameters.min + p * (bestFit.parameters.max - bestFit.parameters.min);
          break;
        default:
          theoreticalQuantile = p * (Math.max(...sortedData) - Math.min(...sortedData)) + Math.min(...sortedData);
      }
      
      theoreticalQuantiles.push(theoreticalQuantile);
    }
    
    const qqData: QQPlotData = {
      data: sortedData.map((value, index) => ({ x: index, y: value })),
      theoreticalQuantiles,
      sampleQuantiles,
      distribution: bestFit.distribution,
      parameters: bestFit.parameters
    };
    
    setQQPlotData(qqData);
  };

  // 伽马函数更精确的近似（使用Lanczos近似）
  const gammaFunction = (x: number): number => {
    // Lanczos近似参数
    const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
               771.32342877765313, -176.61502916214059, 12.507343278686905,
               -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    
    if (x < 0.5) {
      return Math.PI / (Math.sin(Math.PI * x) * gammaFunction(1 - x));
    }
    
    x -= 1;
    let a = p[0];
    const t = x + 7.5;
    const tPower = Math.pow(t, x + 0.5);
    
    for (let i = 1; i < p.length; i++) {
      a += p[i] / (x + i);
    }
    
    return Math.sqrt(2 * Math.PI) * tPower * Math.exp(-t) * a;
  };

  // 不完全伽马函数的正则化版本
  const regularizedGammaP = (s: number, z: number): number => {
    if (z <= 0) return 0;
    
    // 级数展开方法（适合z较小的情况）
    if (z < s + 1) {
      let sum = 1 / gammaFunction(s);
      let term = sum;
      let n = 0;
      
      while (Math.abs(term) > 1e-12) {
        n++;
        term *= z / (s + n - 1);
        sum += term;
        if (n > 200) break; // 防止无限循环
      }
      
      return Math.pow(z, s) * Math.exp(-z) * sum;
    } else {
      // 连分数方法（适合z较大的情况）
      const maxIterations = 200;
      const tolerance = 1e-12;
      
      let b = z + 1 - s;
      let c = 1 / Number.EPSILON; // 一个很大的数
      let d = 1 / b;
      let h = d;
      
      for (let i = 1; i <= maxIterations; i++) {
        const a = -i * (i - s);
        b += 2;
        d = a * d + b;
        if (Math.abs(d) < Number.EPSILON) d = Number.EPSILON;
        c = b + a / c;
        if (Math.abs(c) < Number.EPSILON) c = Number.EPSILON;
        d = 1 / d;
        const delta = d * c;
        h *= delta;
        if (Math.abs(delta - 1) < tolerance) break;
      }
      
      return 1 - Math.pow(z, s) * Math.exp(-z) * h / gammaFunction(s);
    }
  };

  // 卡方分布累积分布函数
  const chiSquareCDF = (x: number, df: number): number => {
    if (df <= 0 || x <= 0) return 0;
    
    const k = df / 2;
    const theta = x / 2;
    
    return regularizedGammaP(k, theta);
  };

  // 格式化p值的函数，根据值的大小选择合适的显示方式
  const formatPValue = (pValue: number): string => {
    if (pValue === 0) return '0';
    if (pValue >= 0.001) {
      return pValue.toFixed(6); // 对于较大的p值，显示到小数点后6位
    } else if (pValue >= 1e-10) {
      return pValue.toExponential(6); // 对于中间大小的p值，使用科学计数法
    } else {
      return '< 1e-10'; // 对于非常小的p值，显示下限
    }
  };

  // 正态分布分位数近似
  const normalQuantile = (p: number): number => {
    // 使用Beasley-Springer-Moro算法
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    
    const a = [0, -39.6968302866538, 220.946098424521, -275.928510446969,
               138.357751867269, -30.6647980661472, 2.50662827745924];
    const b = [0, -54.4760987982241, 161.585836858041, -155.698979859887,
               66.8013118877197, -13.2806815528857];
    const c = [0, -0.00778489400243029, -0.322396458041136, -2.40075827716184,
               -2.54973253934373, 4.37466414146497, 2.93816398269878];
    const d = [0, 0.00778469570904146, 0.32246712907004, 2.445134137143,
               3.75440866190742];
    
    let q, r;
    
    if (p < 0.02425) {
        q = Math.sqrt(-2 * Math.log(p));
        return (((((c[1]*q + c[2])*q + c[3])*q + c[4])*q + c[5])*q + c[6]) /
               ((((d[1]*q + d[2])*q + d[3])*q + d[4])*q + 1);
    } else if (p > 1 - 0.02425) {
        q = Math.sqrt(-2 * Math.log(1 - p));
        return -(((((c[1]*q + c[2])*q + c[3])*q + c[4])*q + c[5])*q + c[6]) /
                 ((((d[1]*q + d[2])*q + d[3])*q + d[4])*q + 1);
    } else {
        q = p - 0.5;
        r = q * q;
        return (((((a[1]*r + a[2])*r + a[3])*r + a[4])*r + a[5])*r + a[6]) * q /
               (((((b[1]*r + b[2])*r + b[3])*r + b[4])*r + b[5])*r + 1);
    }
  };

  // 处理文件导入
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        handleDataInput(content);
      };
      reader.readAsText(file);
    }
  };

  // 渲染Q-Q图
  const renderQQPlot = () => {
    if (!qqPlotData) return null;

    const width = 500;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const xExtent = [Math.min(...qqPlotData.theoreticalQuantiles), Math.max(...qqPlotData.theoreticalQuantiles)];
    const yExtent = [Math.min(...qqPlotData.sampleQuantiles), Math.max(...qqPlotData.sampleQuantiles)];

    const xScale = (value: number) => margin.left + 
      ((value - xExtent[0]) / (xExtent[1] - xExtent[0])) * (width - margin.left - margin.right);
    
    const yScale = (value: number) => height - margin.bottom - 
      ((value - yExtent[0]) / (yExtent[1] - yExtent[0])) * (height - margin.top - margin.bottom);

    return (
      <div className="qq-plot-container">
        <h3>Q-Q图: {qqPlotData.distribution} 分布</h3>
        <svg width={width} height={height}>
          {/* 坐标轴 */}
          <line 
            x1={margin.left} y1={height - margin.bottom} 
            x2={width - margin.right} y2={height - margin.bottom} 
            stroke="black" 
          />
          <line 
            x1={margin.left} y1={margin.top} 
            x2={margin.left} y2={height - margin.bottom} 
            stroke="black" 
          />
          
          {/* 参考线 */}
          <line 
            x1={xScale(xExtent[0])} y1={yScale(yExtent[0])}
            x2={xScale(xExtent[1])} y2={yScale(yExtent[1])}
            stroke="red" 
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          
          {/* 数据点 */}
          {qqPlotData.theoreticalQuantiles.map((theoretical, index) => {
            const sample = qqPlotData.sampleQuantiles[index];
            return (
              <circle
                key={index}
                cx={xScale(theoretical)}
                cy={yScale(sample)}
                r="3"
                fill="blue"
                opacity="0.6"
              />
            );
          })}
          
          {/* 坐标轴标签 */}
          <text 
            x={width / 2} 
            y={height - 5} 
            textAnchor="middle"
            fontSize="12"
          >
            理论分位数 ({qqPlotData.distribution})
          </text>
          <text 
            transform={`translate(15, ${height / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize="12"
          >
            样本分位数
          </text>
        </svg>
        
        {/* 参数显示 */}
        <div className="qq-plot-parameters">
          <h4>分布参数:</h4>
          {Object.entries(qqPlotData.parameters).map(([key, value]) => (
            <div key={key}>
              {key}: {value.toFixed(4)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="goodness-of-fit-tab">
      <h2>Goodness of Fit Test</h2>
      <p>测试数据是否符合特定分布，并推荐最佳拟合分布</p>
      
      {/* 历史数据选择区域 */}
      <div className="data-selection-section">
        <h3>选择历史数据集</h3>
        <div className="dataset-selector">
          <label htmlFor="dataset-select">选择要分析的数据集:</label>
          <select
            id="dataset-select"
            value={selectedDatasetId}
            onChange={(e) => handleDatasetChange(e.target.value)}
            style={{ width: '100%', padding: '8px', margin: '10px 0' }}
          >
            <option value="">请选择数据集</option>
            {datasets.map(dataset => (
              <option key={dataset.id} value={dataset.id}>
                {dataset.name} ({dataset.data.length} 个数据点) - {dataset.created.toLocaleDateString()}
              </option>
            ))}
          </select>
          
          {selectedDatasetId && (
            <div className="selected-dataset-info">
              <p>已选择数据集: <strong>{datasets.find(d => d.id === selectedDatasetId)?.name}</strong></p>
              <p>数据点数量: {currentDataForAnalysis.length}</p>
              {currentDataForAnalysis.length > 0 && (
                <div className="data-preview">
                  <p>数据预览 (前10个值):</p>
                  <div className="data-values">
                    {currentDataForAnalysis.slice(0, 10).map((point, index) => (
                      <span key={index} className="data-value">{point.y.toFixed(3)}</span>
                    ))}
                    {currentDataForAnalysis.length > 10 && <span>...</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {error && (
          <div className="error-message">
            错误: {error}
          </div>
        )}
        
        {isRunning && (
          <div className="loading-message">
            正在运行拟合优度检验...
          </div>
        )}
      </div>
      
      {/* 检验结果 */}
      {testResults.length > 0 && (
        <div className="results-section">
          <h3>拟合优度检验结果</h3>
          
          {/* 推荐结果 */}
          <div className="recommendation">
            <h4>推荐分布: {recommendedDistribution}</h4>
            <p>推荐基于最高 p-value: {formatPValue(testResults.find(r => r.isRecommended)?.pValue || 0)}</p>
          </div>
          
          {/* 详细结果表格 */}
          <div className="results-table">
            <table>
              <thead>
                <tr>
                  <th>分布</th>
                  <th>参数</th>
                  <th>p-value</th>
                  <th>统计量</th>
                  <th>自由度</th>
                  <th>推荐</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((result, index) => (
                  <tr key={index} className={result.isRecommended ? 'recommended' : ''}>
                    <td>{result.distribution}</td>
                    <td>
                      {Object.entries(result.parameters).map(([key, value]) => (
                        <span key={key}>
                          {key}: {value.toFixed(4)}<br />
                        </span>
                      ))}
                    </td>
                    <td>{formatPValue(result.pValue)}</td>
                    <td>{result.statistic.toFixed(4)}</td>
                    <td>{result.degreesOfFreedom}</td>
                    <td>
                      {result.isRecommended ? (
                        <span className="recommended-badge">✓ 推荐</span>
                      ) : (
                        ''
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Q-Q图 */}
      {qqPlotData && (
        <div className="qq-plot-section">
          <h3>Q-Q图分析</h3>
          {renderQQPlot()}
        </div>
      )}
      
      {/* 解释说明 */}
      <div className="explanation-section">
        <h3>结果解释</h3>
        <ul>
          <li><strong>p-value:</strong> 检验的显著性水平。p-value &gt; 0.05 通常表示数据符合该分布</li>
          <li><strong>卡方统计量:</strong> 衡量观测频数与期望频数之间的差异</li>
          <li><strong>自由度:</strong> 检验中独立参数的数量</li>
          <li><strong>Q-Q图:</strong> 用于可视化评估分布拟合程度，点越接近红色参考线，拟合越好</li>
        </ul>
      </div>
    </div>
  );
};

export default GoodnessOfFitTab;