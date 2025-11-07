import React, { useState } from 'react';
import { DataPoint } from '../DataAnalysisApp';

// Define Dataset interface locally
interface Dataset {
  id: string;
  name: string;
  data: DataPoint[];
  color?: string;
}

// 获取Y轴标签，根据分布类型动态设置
const getYAxisLabel = (distributionType?: string) => {
  switch (distributionType?.toLowerCase()) {
    case 'normal':
    case 'gaussian':
      return "Probability density";
    case 'uniform':
      return "Probability density";
    case 'exponential':
      return "Probability density";
    case 'binomial':
      return "Probability";
    case 'poisson':
      return "Probability";
    case 'geometric':
      return "Probability";
    case 'chi-square':
      return "Probability density";
    case 't-distribution':
      return "Probability density";
    case 'f-distribution':
      return "Probability density";
    default:
      return "Value";
  }
};

// 获取X轴标签，根据分布类型动态设置
const getXAxisLabel = (distributionType?: string) => {
  switch (distributionType?.toLowerCase()) {
    case 'normal':
    case 'gaussian':
      return "Standard deviations";
    case 'uniform':
      return "Value";
    case 'exponential':
      return "Value";
    case 'binomial':
      return "Number of successes";
    case 'poisson':
      return "Number of events";
    case 'geometric':
      return "Trials until success";
    case 'chi-square':
      return "Test statistic";
    case 't-distribution':
      return "t-value";
    case 'f-distribution':
      return "F-statistic";
    default:
      return "X Value";
  }
};
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Scatter, ScatterChart, BarChart, Bar } from 'recharts';
import './DataVisualization.css';

type ChartType = 'scatter' | 'line' | 'bar';

interface DataVisualizationProps {
  data: DataPoint[];
  comparisonDatasets?: Dataset[];
  onDataChange?: (data: DataPoint[]) => void;
  distributionType?: string;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ data: propData = [], comparisonDatasets = [], onDataChange, distributionType }) => {
  const [chartType, setChartType] = useState<ChartType>('scatter');
  const [showRegression, setShowRegression] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const [isInteractiveEditMode, setIsInteractiveEditMode] = useState<boolean>(false);
  // Chart container reference removed
  
  // 确保数据始终是有效的数组，重命名以避免与其他变量冲突
  const safeData = Array.isArray(propData) ? propData : [];
  const safeComparisonDatasets = Array.isArray(comparisonDatasets) ? comparisonDatasets : [];
  
  // 排序数据点的辅助函数
  const sortDataByX = (dataPoints: DataPoint[] | undefined | null): DataPoint[] => {
    if (!Array.isArray(dataPoints)) return [];
    return [...dataPoints].filter(point => point && typeof point.x === 'number' && typeof point.y === 'number')
      .sort((a, b) => (a.x || 0) - (b.x || 0));
  };
  
  // 处理图表类型切换，添加加载状态和错误边界
  const handleChartTypeChange = (type: ChartType, event?: React.MouseEvent) => {
    // 确保阻止所有默认行为和事件传播
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.nativeEvent.stopImmediatePropagation();
    }
    
    // 确保组件状态不会丢失
    try {
      setIsLoading(true);
      
      // 使用setTimeout确保UI响应
      setTimeout(() => {
        try {
          // 更新图表类型前确保数据有效性
          const validData = safeComparisonDatasets.length > 0 
            ? safeComparisonDatasets.every(dataset => Array.isArray(dataset?.data) && dataset.data.length > 0)
            : Array.isArray(safeData) && safeData.length > 0;
          
          if (!validData) {
            console.warn('No valid data available for chart rendering');
          }
          
          setChartType(type);
        } catch (error) {
          console.error('Error updating chart type:', error);
          // 即使出错也要确保加载状态被重置
          setChartType('scatter'); // 回退到安全的图表类型
        } finally {
          setIsLoading(false);
        }
      }, 100);
    } catch (error) {
      console.error('Fatal error in chart type change handler:', error);
      setIsLoading(false);
    }
  };
  
  // Point drag handler removed
  
  // 切换交互式编辑模式
  const toggleInteractiveEditMode = () => {
    setIsInteractiveEditMode(!isInteractiveEditMode);
    setIsDragging(false);
    setDraggedPointIndex(null);
  };
  
  // 处理鼠标按下事件
  const handleMouseDown = (index: number) => {
    if (!isInteractiveEditMode) return;
    
    setIsDragging(true);
    setDraggedPointIndex(index);
  };
  
  // Interactive editing functionality removed
  
  // 处理鼠标抬起事件
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedPointIndex(null);
  };
  
  // 添加全局鼠标事件监听器
  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => handleMouseUp();
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);
  
  // 处理回归线切换
  const handleRegressionToggle = (checked: boolean) => {
    setIsLoading(true);
    
    setTimeout(() => {
      setShowRegression(checked);
      setIsLoading(false);
    }, 100);
  };
  
  // 获取数据集的颜色（为比较视图生成不同颜色）
  const getDatasetColor = (index: number): string => {
    const colors = [
      '#10b981', // 绿色
      '#3b82f6', // 蓝色
      '#f59e0b', // 橙色
      '#ef4444', // 红色
      '#8b5cf6', // 紫色
      '#06b6d4', // 青色
      '#ec4899', // 粉色
    ];
    return colors[index % colors.length];
  };
  
  // 获取排序后的比较数据集
  const sortedComparisonData: { dataset: Dataset, sortedData: DataPoint[] }[] = React.useMemo(() => {
    return safeComparisonDatasets.map(dataset => ({
      dataset,
      sortedData: chartType === 'line' ? sortDataByX(dataset.data || []) : dataset.data || []
    }));
  }, [safeComparisonDatasets, chartType]);

  // Calculate linear regression for a specific dataset
  const getRegressionData = (dataPoints: DataPoint[] = []) => {
    try {
      // 使用传入的数据点而不是safeData，确保安全访问
      const inputPoints = Array.isArray(dataPoints) ? dataPoints : [];
      const points = inputPoints.length > 0 ? inputPoints : safeData;
      if (!Array.isArray(points) || points.length < 2) return null;

      // Filter out invalid data points
      const validPoints = points.filter(point => 
        point && typeof point === 'object' && 
        typeof point.x === 'number' && !isNaN(point.x) &&
        typeof point.y === 'number' && !isNaN(point.y)
      );
      
      if (validPoints.length < 2) return null;

      const n = validPoints.length; // 使用validPoints的长度
      const sumX = validPoints.reduce((sum, point) => sum + point.x, 0);
      const sumY = validPoints.reduce((sum, point) => sum + point.y, 0);
      const sumXY = validPoints.reduce((sum, point) => sum + point.x * point.y, 0);
      const sumX2 = validPoints.reduce((sum, point) => sum + point.x * point.x, 0);

      // Avoid division by zero error
      const denominator = n * sumX2 - sumX * sumX;
      if (denominator === 0 || !isFinite(denominator)) return null;

      // 计算斜率和截距，确保正确初始化
      const slopeValue = (n * sumXY - sumX * sumY) / denominator;
      const interceptValue = (sumY - slopeValue * sumX) / n;
      
      // Calculate R-squared
      const yMean = sumY / n;
      let ssRes = 0, ssTot = 0;
      
      validPoints.forEach(point => {
        const predicted = slopeValue * point.x + interceptValue;
        ssRes += Math.pow(point.y - predicted, 2);
        ssTot += Math.pow(point.y - yMean, 2);
      });
      
      // 防止除以零
      const rSquaredValue = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);

      // Find X range to draw regression line
      const xValues = validPoints.map(p => p.x);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      
      return {
        slope: Number.isFinite(slopeValue) ? slopeValue : 0,
        intercept: Number.isFinite(interceptValue) ? interceptValue : 0,
        rSquared: Number.isFinite(rSquaredValue) ? rSquaredValue : 0,
        lineData: [
          { x: minX, y: Number.isFinite(slopeValue * minX + interceptValue) ? slopeValue * minX + interceptValue : 0 },
          { x: maxX, y: Number.isFinite(slopeValue * maxX + interceptValue) ? slopeValue * maxX + interceptValue : 0 }
        ],
        equation: `y = ${(Number.isFinite(slopeValue) ? slopeValue : 0).toFixed(4)}x + ${(Number.isFinite(interceptValue) ? interceptValue : 0).toFixed(4)} (R²: ${(Number.isFinite(rSquaredValue) ? rSquaredValue : 0).toFixed(4)})`
      };
    } catch (error) {
      console.error('Error calculating regression line:', error);
      return null;
    }
  };

  const regression = showRegression ? getRegressionData(safeData) : null;

  // Prepare data for histogram - bin the data
  const prepareBarData = (inputData?: DataPoint[]) => {
    try {
      // 使用传入的数据或默认的safeData
      const targetData = inputData && Array.isArray(inputData) ? inputData : safeData;
      if (!targetData || targetData.length === 0) return [];
      
      // Filter out valid x values
      const validPoints = targetData.filter(point => 
        point && typeof point.x === 'number'
      );
      
      if (validPoints.length === 0) return [];
      
      const xValues = validPoints.map(p => p.x);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      
      // Handle case where minX equals maxX
      if (minX === maxX) {
        return [{
          bin: minX,
          count: validPoints.length,
          label: `${minX.toFixed(2)}`
        }];
      }
      
      const binCount = Math.min(20, Math.ceil(Math.sqrt(validPoints.length))); // Using Sturges' formula or maximum 20 bins
      const binWidth = (maxX - minX) / binCount;
      
      // Create bins
      const bins = Array(binCount).fill(0).map((_, i) => ({
        bin: minX + i * binWidth,
        count: 0,
        label: `${(minX + i * binWidth).toFixed(2)}-${(minX + (i + 1) * binWidth).toFixed(2)}`
      }));
      
      // Calculate number of data points in each bin
      validPoints.forEach(point => {
        if (point && typeof point.x === 'number') {
          const binIndex = Math.min(
            binCount - 1, 
            Math.floor((point.x - minX) / binWidth)
          );
          if (bins[binIndex]) {
            bins[binIndex].count++;
          }
        }
      });
      
      return bins;
    } catch (error) {
      console.error('Error preparing bar chart data:', error);
      return [];
    }
  };

  const barData = chartType === 'bar' ? prepareBarData(safeData) : [];

  // sortDataByX function moved to the top of the component

  // 根据图表类型获取适当的数据
  const getChartData = (): DataPoint[] => {
    // 确保返回的数据都是有效的DataPoint对象
    const validData = safeData.filter(point => point && typeof point.x === 'number' && typeof point.y === 'number');
    // 对于线性图，数据必须按x值排序以避免连线混乱
    if (chartType === 'line') {
      return sortDataByX(validData);
    }
    return validData;
  };

  return (
    <div className="data-visualization">
      <div className="visualization-controls">
        <div className="chart-type-selector">
          <label>Chart Type:</label>
          <div className="chart-type-buttons">
            <button
              className={`chart-type-btn ${chartType === 'scatter' ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
              onClick={(e) => handleChartTypeChange('scatter', e)}
              type="button"
              disabled={isLoading}
              data-tooltip="Scatter plot view"
              title="Scatter Plot"
            >
              Scatter Plot
            </button>
            <button
              className={`chart-type-btn ${chartType === 'line' ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
              onClick={(e) => handleChartTypeChange('line', e)}
              type="button"
              disabled={isLoading}
              data-tooltip="Line chart view"
              title="Line Chart"
            >
              Line Chart
            </button>
            <button
              className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
              onClick={(e) => handleChartTypeChange('bar', e)}
              type="button"
              disabled={isLoading}
              data-tooltip="Bar chart view"
              title="Bar Chart"
            >
              Bar Chart
            </button>
          </div>
        </div>
        
        {/* 交互式编辑模式切换 */}
        {onDataChange && (chartType === 'scatter' || chartType === 'line') && (
          <div className="interactive-edit-toggle">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isInteractiveEditMode}
                onChange={toggleInteractiveEditMode}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                disabled={isLoading}
              />
              <span className="checkbox-text">
                {isInteractiveEditMode ? 'Disable Interactive Edit' : 'Enable Interactive Edit'}
              </span>
            </label>
            {isInteractiveEditMode && (
              <span className="edit-mode-tooltip">
                💡 Drag points to edit values
              </span>
            )}
          </div>
        )}
        
        {(chartType === 'scatter' || chartType === 'line') && (
          <div className="regression-toggle">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showRegression}
                onChange={(e) => handleRegressionToggle(e.target.checked)}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                disabled={isLoading || safeData.length < 2}
              />
              <span className="checkbox-text">Show Regression Line</span>
            </label>
          </div>
        )}
      </div>

      <div className="chart-container">
          <ResponsiveContainer 
            width="100%" 
            height={400}

          >
            {/* Using functional component instead of conditional rendering to ensure always returning a valid chart component */}
            {(() => {
              // 如果有比较数据集，使用比较视图
              if (safeComparisonDatasets.length > 0) {
                if (chartType === 'scatter') {
                  return (
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="X" 
                        label={{ value: getXAxisLabel(distributionType), position: 'insideBottomRight', offset: -10 }} 
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        name={getYAxisLabel(distributionType)} 
                        label={{ value: getYAxisLabel(distributionType), angle: -90, position: 'insideLeft' }} 
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value) => {
                          try {
                            return typeof value === 'number' && value?.toFixed ? value.toFixed(4) : '0.0000';
                          } catch {
                            return '0.0000';
                          }
                        }}
                        labelFormatter={(value) => {
                          try {
                            return `X: ${typeof value === 'number' ? value.toFixed(4) : (parseFloat(String(value)) || 0).toFixed(4)}`;
                          } catch {
                            return `X: 0.0000`;
                          }
                        }}
                      />
                      <Legend />
                      {/* 渲染每个数据集的点 */}
                      {sortedComparisonData.map(({ dataset, sortedData }, index) => (
                        <Scatter 
                          key={dataset.id} 
                          name={dataset.name} 
                          data={sortedData} 
                          fill={getDatasetColor(index)} 
                          shape={(props: any) => {
                            if (!props || typeof props !== 'object' || props.cx === undefined || props.cy === undefined) {
                              return React.createElement('circle', { cx: 0, cy: 0, r: 0 });
                            }
                            const pointIndex = sortedComparisonData[index]?.sortedData?.findIndex(
                              p => p.x === props.payload?.x && p.y === props.payload?.y
                            ) ?? -1;
                            
                            return (
                              <circle 
                                cx={props.cx} 
                                cy={props.cy} 
                                r={pointIndex >= 0 && isInteractiveEditMode && draggedPointIndex === pointIndex ? 6 : 4} 
                                fill={getDatasetColor(index)} 
                                fillOpacity={0.6} 
                                stroke="#333" 
                                strokeWidth={pointIndex >= 0 && isInteractiveEditMode ? 2 : 1} 
                                style={{ cursor: isInteractiveEditMode ? 'grab' : 'default' }}
                                onMouseDown={() => pointIndex >= 0 && handleMouseDown(pointIndex)}
                              />
                            );
                          }}
                        />
                      ))}
                      {showRegression && sortedComparisonData[0] && (() => {
                        const regression = getRegressionData(sortedComparisonData[0].sortedData);
                        return regression && regression.lineData ? (
                          <Line 
                            type="monotone" 
                            data={regression.lineData} 
                            dataKey="y" 
                            stroke="#000" 
                            strokeWidth={2} 
                            name="Regression Line"
                            dot={false}
                            strokeDasharray="5 5"
                          />
                        ) : null;
                      })()}
                    </ScatterChart>
                  );
                } else if (chartType === 'line') {
                  return (
                    <LineChart 
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="X" 
                        label={{ value: getXAxisLabel(distributionType), position: 'insideBottomRight', offset: -10 }} 
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        name={getYAxisLabel(distributionType)} 
                        label={{ value: getYAxisLabel(distributionType), angle: -90, position: 'insideLeft' }} 
                      />
                      <Tooltip 
                        formatter={(value) => {
                          try {
                            return typeof value === 'number' && value?.toFixed ? value.toFixed(4) : '0.0000';
                          } catch {
                            return '0.0000';
                          }
                        }}
                        labelFormatter={(value) => {
                          try {
                            return `X: ${typeof value === 'number' ? value.toFixed(4) : (parseFloat(String(value)) || 0).toFixed(4)}`;
                          } catch {
                            return `X: 0.0000`;
                          }
                        }}
                      />
                      <Legend />
                      {/* 渲染每个数据集的线 */}
                      {sortedComparisonData.map(({ dataset, sortedData }, index) => (
                        <Line 
                          key={dataset.id}
                          type="monotone" 
                          data={sortedData}
                          dataKey="y" 
                          stroke={getDatasetColor(index)} 
                          strokeWidth={2} 
                          name={dataset.name}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                      {showRegression && sortedComparisonData[0] && (() => {
                        const regression = getRegressionData(sortedComparisonData[0].sortedData);
                        return regression && regression.lineData ? (
                          <Line 
                            type="monotone" 
                            data={regression.lineData} 
                            dataKey="y" 
                            stroke="#000" 
                            strokeWidth={2} 
                            name="Regression Line"
                            dot={false}
                            strokeDasharray="5 5"
                          />
                        ) : null;
                      })()}
                    </LineChart>
                  );
                } else if (chartType === 'bar') {
                  // 对于柱状图，我们只显示第一个数据集的直方图
                  if (sortedComparisonData.length > 0) {
                    const firstDataset = sortedComparisonData[0];
                    const barData = prepareBarData(firstDataset.sortedData);
                    return (
                      <BarChart 
                        data={Array.isArray(barData) ? barData : []} 
                        margin={{ top: 20, right: 20, bottom: 50, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="label" 
                          name="X Range" 
                          angle={-45} 
                          textAnchor="end" 
                          height={70}
                          label={{ value: getXAxisLabel(distributionType) + ' Range', position: 'insideBottom', offset: -10 }} 
                        />
                        <YAxis 
                        type="number" 
                        name={getYAxisLabel(distributionType)} 
                        label={{ value: getYAxisLabel(distributionType), angle: -90, position: 'insideLeft' }} 
                      />
                        <Tooltip 
                          formatter={(value) => [`Frequency: ${typeof value === 'number' ? value : 0}`, '']}
                          labelFormatter={(value) => `Range: ${value || 'N/A'}`}
                        />
                        <Legend />
                        <Bar 
                          dataKey="count" 
                          fill={getDatasetColor(0)} 
                          name={`${firstDataset.dataset.name} - Frequency`}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    );
                  }
                }
              }
              
              // 原始的单数据集视图
              if (chartType === 'scatter') {
              return (
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="X" 
                        label={{ value: getXAxisLabel(distributionType), position: 'insideBottomRight', offset: -10 }} 
                      />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={getYAxisLabel(distributionType)} 
                    label={{ value: getYAxisLabel(distributionType), angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value) => {
                      try {
                        return typeof value === 'number' ? `${Math.round(value)}` : '0';
                      } catch {
                        return '0';
                      }
                    }}
                    labelFormatter={(value) => {
                      try {
                        return `X: ${typeof value === 'number' ? value.toFixed(4) : (parseFloat(String(value)) || 0).toFixed(4)}`;
                      } catch {
                        return `X: 0.0000`;
                      }
                    }}
                    content={({ active, payload, label }) => {
                      // Ensure payload exists and is valid
                      if (active && payload && payload.length && payload[0]) {
                        return (
                          <div className="custom-tooltip">
                            <p className="label">X: {label}</p>
                            <p className="value">Y: {payload[0].value ?? '0.0000'}</p>
                          </div>
                        );
                      }
                      return <div className="custom-tooltip">No Data</div>;
                    }}
                  />
                  <Legend />
                  <Scatter 
                    name="Data Points" 
                    data={safeData} 
                    fill="#4a90e2" 
                    shape={(props: any) => {
                      // Completely rewrite shape function to ensure safe rendering
                      if (!props || typeof props !== 'object' || props.cx === undefined || props.cy === undefined) {
                        return React.createElement('circle', { cx: 0, cy: 0, r: 0 });
                      }
                      
                      // 尝试找到数据点的索引
                      const pointIndex = safeData.findIndex(
                        p => p.x === props.payload?.x && p.y === props.payload?.y
                      );
                      
                      return (
                        <circle 
                          cx={props.cx} 
                          cy={props.cy} 
                          r={pointIndex >= 0 && isInteractiveEditMode && draggedPointIndex === pointIndex ? 6 : 4} 
                          fill="#4a90e2" 
                          fillOpacity={0.6} 
                          stroke={pointIndex >= 0 && isInteractiveEditMode ? '#ff6b6b' : '#333'} 
                          strokeWidth={pointIndex >= 0 && isInteractiveEditMode ? 2 : 1} 
                          style={{ 
                            cursor: isInteractiveEditMode ? 'grab' : 'default',
                            transform: isDragging && draggedPointIndex === pointIndex ? 'scale(1.2)' : 'scale(1)'
                          }}
                          onMouseDown={() => pointIndex >= 0 && handleMouseDown(pointIndex)}
                        />
                      );
                    }}
                  />
                  {regression && regression.lineData && Array.isArray(regression.lineData) && regression.lineData.length > 0 && (
                    <Line 
                      type="monotone" 
                      data={regression.lineData} 
                      dataKey="y" 
                      stroke="#f44336" 
                      strokeWidth={2} 
                      name={`Regression Line: ${regression.equation || 'N/A'}`}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  )}
                </ScatterChart>
              );
            } else if (chartType === 'line') {
              return (
                <LineChart 
                  data={getChartData()} 
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="X" 
                        label={{ value: getXAxisLabel(distributionType), position: 'insideBottomRight', offset: -10 }} 
                      />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    name={getYAxisLabel(distributionType)} 
                    label={{ value: getYAxisLabel(distributionType), angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    formatter={(value) => {
                      try {
                        return typeof value === 'number' ? `${Math.round(value)}` : '0';
                      } catch {
                        return '0';
                      }
                    }}
                    labelFormatter={(value) => {
                      try {
                        return `X: ${typeof value === 'number' ? value.toFixed(4) : (parseFloat(String(value)) || 0).toFixed(4)}`;
                      } catch {
                        return `X: 0.0000`;
                      }
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="y" 
                    stroke="#4a90e2" 
                    strokeWidth={2} 
                    name="Frequency"
                    dot={{ 
                      r: 3,
                      strokeWidth: isInteractiveEditMode ? 2 : 1,
                      stroke: isInteractiveEditMode ? '#ff6b6b' : '#333',
                      cursor: isInteractiveEditMode ? 'grab' : 'default'
                    }}
                    activeDot={{ r: 5 }}
                  />
                  {regression && Array.isArray(regression.lineData) && regression.lineData.length > 0 && (
                    <Line 
                      type="monotone" 
                      data={regression.lineData} 
                      dataKey="y" 
                      stroke="#f44336" 
                      strokeWidth={2} 
                      name={`Regression Line: ${regression.equation || 'N/A'}`}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  )}
                </LineChart>
              );
            } else if (chartType === 'bar') {
              const safeBarData = Array.isArray(barData) ? barData : [];
              return (
                <BarChart 
                  data={safeBarData} 
                  margin={{ top: 20, right: 20, bottom: 50, left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="label" 
                    name="X Range" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                    label={{ value: getXAxisLabel(distributionType) + ' Range', position: 'insideBottom', offset: -10 }} 
                  />
                  <YAxis 
                    type="number" 
                    name={getYAxisLabel(distributionType)} 
                    label={{ value: getYAxisLabel(distributionType), angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    formatter={(value) => [`Frequency: ${typeof value === 'number' ? value : 0}`, '']}
                    labelFormatter={(value) => `Range: ${value || 'N/A'}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="count" 
                    fill="#4a90e2" 
                    name="Frequency"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              );
            }
            // Ensure always returning a valid chart component as default
            return (
              <LineChart 
                data={[]} 
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip />
                <Legend />
              </LineChart>
            );
          })()}
        </ResponsiveContainer>
      </div>

      {regression && regression.equation && (
        <div className="regression-info">
          <p>Regression Equation: {regression.equation}</p>
        </div>
      )}
    </div>
  );
};

export default DataVisualization;