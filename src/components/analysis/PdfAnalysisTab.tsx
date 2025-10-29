import React, { useState } from 'react';
import { DataPoint } from '../DataAnalysisApp';
import './PdfAnalysisTab.css';

interface PdfAnalysisResults {
  filename: string;
  text: string;
  wordCount: number;
  keywords: Array<[string, number]>;
  sections: { title: string; content: string[] }[];
  dataPoints?: DataPoint[];
}

interface PdfAnalysisTabProps {
  onDataExtracted?: (data: DataPoint[]) => void;
}

// 简化的停用词列表
const STOP_WORDS = new Set([
  '的', '了', '和', '是', '在', '有', '我', '他', '她', '它', '们', '这', '那',
  '之', '与', '或', '但', '而', '如果', '因为', '所以', '对于', '关于', '通过',
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'because', 'so', 'for', 'about',
  'with', 'on', 'in', 'at', 'to', 'by', 'of', 'from', 'as', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'this', 'that', 'these', 'those', 'which', 'who', 'whom', 'whose', 'what',
  'when', 'where', 'why', 'how'
]);

const PdfAnalysisTab: React.FC<PdfAnalysisTabProps> = ({ onDataExtracted }) => {
  const [file, setFile] = useState<File | null>(null);
  const [analysisResults, setAnalysisResults] = useState<PdfAnalysisResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setAnalysisResults(null);
      setError(null);
    } else {
      setError('请选择PDF格式的文件');
    }
  };

  const analyzePdf = async () => {
    if (!file) {
      setError('请先选择一个PDF文件');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 这里模拟PDF文本提取和分析
      // 实际应用中，可能需要使用PDF.js或后端服务来提取PDF文本
      const text = await mockExtractTextFromPdf(file);
      
      // 清理文本
      const cleanedText = cleanText(text);
      
      // 提取关键词
      const keywords = extractKeywords(cleanedText, 10);
      
      // 分析内容结构
      const sections = analyzeContentStructure(text);
      
      // 生成数据点（如果文本中包含数值数据）
      const dataPoints = extractDataPoints(text);
      
      const results: PdfAnalysisResults = {
        filename: file.name,
        text: cleanedText,
        wordCount: cleanedText.split(/\s+/).length,
        keywords,
        sections,
        dataPoints
      };
      
      setAnalysisResults(results);
      
      // 如果提取到数据点，通知父组件
      if (dataPoints.length > 0 && onDataExtracted) {
        onDataExtracted(dataPoints);
      }
    } catch (err) {
      setError('分析PDF文件时出错');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 模拟PDF文本提取（实际应用中需要使用PDF.js或后端服务）
  const mockExtractTextFromPdf = (_file: File): Promise<string> => {
    return new Promise((resolve) => {
      // 模拟异步操作
      setTimeout(() => {
        // 这里返回模拟文本，实际应用中需要真正提取PDF文本
        resolve(`LECTURE NOTES: STATISTICAL ANALYSIS\n\n1. INTRODUCTION TO PROBABILITY\nProbability theory is the foundation of statistical analysis.\nKey concepts include:\n- Sample space and events\n- Probability axioms\n- Conditional probability\n\n2. PROBABILITY DISTRIBUTIONS\nCommon distributions:\n- Normal distribution: Mean = 0, StdDev = 1\n- Binomial distribution: n=10, p=0.5\n- Poisson distribution: λ=3\n\n3. DESCRIPTIVE STATISTICS\nMean: 12.5\nMedian: 15.2\nStandard Deviation: 4.7\n\n4. INFERENTIAL STATISTICS\nHypothesis testing\nConfidence intervals\nRegression analysis\n\nSample data:\nX: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10\nY: 2.1, 3.8, 5.9, 8.2, 10.1, 12.3, 14.5, 16.2, 18.7, 20.1`);
      }, 1000);
    });
  };

  const cleanText = (text: string): string => {
    // 移除多余的空白字符
    text = text.replace(/\s+/g, ' ');
    // 移除特殊字符
    text = text.replace(/[^\w\s.,!?;:\-()\[\]{}]/g, '');
    return text.trim();
  };

  const extractKeywords = (text: string, topN: number): Array<[string, number]> => {
    // 分词
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    // 过滤停用词和短词
    const filteredWords = words.filter(word => 
      !STOP_WORDS.has(word) && word.length > 2
    );
    
    // 统计词频
    const wordCounts = new Map<string, number>();
    filteredWords.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
    
    // 转换为数组并排序
    const sortedWords = Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]);
    
    return sortedWords.slice(0, topN);
  };

  const analyzeContentStructure = (text: string): { title: string; content: string[] }[] => {
    const sections: { title: string; content: string[] }[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let currentSection = { title: '未分类内容', content: [] as string[] };
    
    lines.forEach(line => {
      // 简单的标题检测：以数字开头或全部大写且较短
      if (/^\d+\./.test(line) || (/^[A-Z\s]+$/.test(line) && line.length < 50)) {
        if (currentSection.content.length > 0) {
          sections.push({...currentSection});
        }
        currentSection = { title: line, content: [] };
      } else {
        currentSection.content.push(line);
      }
    });
    
    if (currentSection.content.length > 0) {
      sections.push(currentSection);
    }
    
    return sections.slice(0, 5); // 只返回前5个部分
  };

  const extractDataPoints = (text: string): DataPoint[] => {
    const dataPoints: DataPoint[] = [];
    
    // 尝试从文本中提取数据对
    // 这里使用简单的正则表达式，实际应用中可能需要更复杂的解析逻辑
    const xMatch = text.match(/X:\s*([\d\s,]+)/);
    const yMatch = text.match(/Y:\s*([\d\s,.]+)/);
    
    if (xMatch && yMatch) {
      const xValues = xMatch[1].split(',').map(val => parseFloat(val.trim())).filter(val => !isNaN(val));
      const yValues = yMatch[1].split(',').map(val => parseFloat(val.trim())).filter(val => !isNaN(val));
      
      // 取较小的长度，确保索引有效
      const minLength = Math.min(xValues.length, yValues.length);
      for (let i = 0; i < minLength; i++) {
        dataPoints.push({ x: xValues[i], y: yValues[i] });
      }
    }
    
    // 如果没有找到明确的数据对，尝试从其他模式中提取
    if (dataPoints.length === 0) {
      // 尝试提取均值、标准差等统计量作为数据点
      const meanMatch = text.match(/Mean:\s*([\d.]+)/i);
      const stdDevMatch = text.match(/Standard Deviation:\s*([\d.]+)/i);
      const medianMatch = text.match(/Median:\s*([\d.]+)/i);
      
      let index = 0;
      if (meanMatch) {
        dataPoints.push({ x: index++, y: parseFloat(meanMatch[1]) });
      }
      if (stdDevMatch) {
        dataPoints.push({ x: index++, y: parseFloat(stdDevMatch[1]) });
      }
      if (medianMatch) {
        dataPoints.push({ x: index++, y: parseFloat(medianMatch[1]) });
      }
    }
    
    return dataPoints;
  };

  return (
    <div className="pdf-analysis-tab">
      <h2>PDF文档分析</h2>
      
      <div className="file-upload-section">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="file-input"
        />
        {file && <p className="selected-file">已选择: {file.name}</p>}
        {error && <p className="error-message">{error}</p>}
        
        <button
          onClick={analyzePdf}
          disabled={!file || isLoading}
          className="analyze-button"
        >
          {isLoading ? '分析中...' : '分析PDF'}
        </button>
      </div>
      
      {analysisResults && (
        <div className="analysis-results">
          <h3>分析结果</h3>
          
          <div className="stats-card">
            <h4>文档信息</h4>
            <div className="stat-item">
              <span className="stat-label">文件名:</span>
              <span className="stat-value">{analysisResults.filename}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">字数:</span>
              <span className="stat-value">{analysisResults.wordCount}</span>
            </div>
          </div>
          
          <div className="keywords-section">
            <h4>关键词</h4>
            <div className="keyword-cloud">
              {analysisResults.keywords.map(([keyword, count], index) => (
                <span 
                  key={index} 
                  className="keyword-tag"
                  style={{ fontSize: `${Math.min(14 + count * 0.8, 24)}px` }}
                >
                  {keyword} ({count})
                </span>
              ))}
            </div>
          </div>
          
          <div className="sections-section">
            <h4>内容结构</h4>
            <div className="sections-list">
              {analysisResults.sections.map((section, index) => (
                <div key={index} className="section-item">
                  <strong>{section.title}</strong>
                  <p>{section.content.slice(0, 2).join(' ').substring(0, 100)}...</p>
                </div>
              ))}
            </div>
          </div>
          
          {analysisResults.dataPoints && analysisResults.dataPoints.length > 0 && (
            <div className="data-points-section">
              <h4>提取的数据点</h4>
              <p>已从文档中提取 {analysisResults.dataPoints.length} 个数据点，可用于统计分析</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfAnalysisTab;