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

// Simplified stop words list
const STOP_WORDS = new Set([
  // Chinese stop words removed to maintain English-only interface
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
      setError('Please select a PDF format file');
    }
  };

  const analyzePdf = async () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Simulate PDF text extraction and analysis
      // In a real application, you might need to use PDF.js or a backend service to extract PDF text
      const text = await mockExtractTextFromPdf(file);
      
      // Clean text
      const cleanedText = cleanText(text);
      
      // Extract keywords
      const keywords = extractKeywords(cleanedText, 10);
      
      // Analyze content structure
      const sections = analyzeContentStructure(text);
      
      // Generate data points (if text contains numerical data)
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
      
      // Notify parent component if data points are extracted
      if (dataPoints.length > 0 && onDataExtracted) {
        onDataExtracted(dataPoints);
      }
    } catch (err) {
      setError('Error analyzing PDF file');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate PDF text extraction (in real application, use PDF.js or backend service)
  const mockExtractTextFromPdf = (_file: File): Promise<string> => {
    return new Promise((resolve) => {
      // Simulate asynchronous operation
      setTimeout(() => {
        // Return mock text, in a real app you would extract actual PDF text
        resolve(`LECTURE NOTES: STATISTICAL ANALYSIS\n\n1. INTRODUCTION TO PROBABILITY\nProbability theory is the foundation of statistical analysis.\nKey concepts include:\n- Sample space and events\n- Probability axioms\n- Conditional probability\n\n2. PROBABILITY DISTRIBUTIONS\nCommon distributions:\n- Normal distribution: Mean = 0, StdDev = 1\n- Binomial distribution: n=10, p=0.5\n- Poisson distribution: λ=3\n\n3. DESCRIPTIVE STATISTICS\nMean: 12.5\nMedian: 15.2\nStandard Deviation: 4.7\n\n4. INFERENTIAL STATISTICS\nHypothesis testing\nConfidence intervals\nRegression analysis\n\nSample data:\nX: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10\nY: 2.1, 3.8, 5.9, 8.2, 10.1, 12.3, 14.5, 16.2, 18.7, 20.1`);
      }, 1000);
    });
  };

  const cleanText = (text: string): string => {
    // Remove extra whitespace
    text = text.replace(/\s+/g, ' ');
    // Remove special characters
    text = text.replace(/[^\w\s.,!?;:\-()\[\]{}]/g, '');
    return text.trim();
  };

  const extractKeywords = (text: string, topN: number): Array<[string, number]> => {
    // Tokenize
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    // Filter stop words and short words
    const filteredWords = words.filter(word => 
      !STOP_WORDS.has(word) && word.length > 2
    );
    
    // Count word frequencies
    const wordCounts = new Map<string, number>();
    filteredWords.forEach(word => {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    });
    
    // Convert to array and sort
    const sortedWords = Array.from(wordCounts.entries()).sort((a, b) => b[1] - a[1]);
    
    return sortedWords.slice(0, topN);
  };

  const analyzeContentStructure = (text: string): { title: string; content: string[] }[] => {
    const sections: { title: string; content: string[] }[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    let currentSection = { title: 'Uncategorized Content', content: [] as string[] };
    
    lines.forEach(line => {
      // Simple title detection: starts with number or all uppercase and short
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
    
    return sections.slice(0, 5); // Return only first 5 sections
  };

  const extractDataPoints = (text: string): DataPoint[] => {
    const dataPoints: DataPoint[] = [];
    
    // Try to extract data pairs from text
    // Using simple regex here, more complex parsing logic might be needed in real application
    const xMatch = text.match(/X:\s*([\d\s,]+)/);
    const yMatch = text.match(/Y:\s*([\d\s,.]+)/);
    
    if (xMatch && yMatch) {
      const xValues = xMatch[1].split(',').map(val => parseFloat(val.trim())).filter(val => !isNaN(val));
      const yValues = yMatch[1].split(',').map(val => parseFloat(val.trim())).filter(val => !isNaN(val));
      
      // Take smaller length to ensure index is valid
      const minLength = Math.min(xValues.length, yValues.length);
      for (let i = 0; i < minLength; i++) {
        dataPoints.push({ x: xValues[i], y: yValues[i] });
      }
    }
    
    // If no clear data pairs found, try extracting from other patterns
    if (dataPoints.length === 0) {
      // Try extracting statistics like mean, standard deviation as data points
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
      <h2>PDF Document Analysis</h2>
      
      <div className="file-upload-section">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="file-input"
        />
        {file && <p className="selected-file">Selected: {file.name}</p>}
        {error && <p className="error-message">{error}</p>}
        
        <button
          onClick={analyzePdf}
          disabled={!file || isLoading}
          className="analyze-button"
        >
          {isLoading ? 'Analyzing...' : 'Analyze PDF'}
        </button>
      </div>
      
      {analysisResults && (
        <div className="analysis-results">
          <h3>Analysis Results</h3>
          
          <div className="stats-card">
            <h4>Document Information</h4>
            <div className="stat-item">
              <span className="stat-label">Filename:</span>
              <span className="stat-value">{analysisResults.filename}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Word Count:</span>
              <span className="stat-value">{analysisResults.wordCount}</span>
            </div>
          </div>
          
          <div className="keywords-section">
            <h4>Keywords</h4>
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
            <h4>Content Structure</h4>
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
              <h4>Extracted Data Points</h4>
              <p>Extracted {analysisResults.dataPoints.length} data points from the document, available for statistical analysis</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PdfAnalysisTab;