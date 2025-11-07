import React, { useRef, useState } from 'react';
import { DataPoint } from '../DataAnalysisApp';

interface EnhancedFileImporterProps {
  onDataImport: (data: DataPoint[], source?: string) => void;
}

type ImportType = 'file' | 'url' | 'paste';
type FileFormat = 'auto' | 'csv' | 'json' | 'txt';

interface ImportStatus {
  status: 'idle' | 'importing' | 'success' | 'error';
  message: string;
}

const EnhancedFileImporter: React.FC<EnhancedFileImporterProps> = ({ onDataImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<ImportType>('file');
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>('auto');
  const [urlInput, setUrlInput] = useState<string>('');
  const [pasteText, setPasteText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<ImportStatus>({
    status: 'idle',
    message: ''
  });

  // Supported file formats
  const supportedFormats = {
    csv: 'CSV (Comma Separated Values)',
    json: 'JSON (JavaScript Object Notation)',
    txt: 'TXT (Plain Text)',
  };

  // Import status handling functions
  const handleImportStart = () => {
    setImportStatus({
      status: 'importing',
      message: 'Importing data...'
    });
  };

  const handleImportSuccess = (dataPoints: DataPoint[], source: string) => {
    onDataImport(dataPoints, source);
    setImportStatus({
      status: 'success',
      message: `Successfully imported ${dataPoints.length} data points from ${source}`
    });
    // 重置表单
    resetForm();
  };

  const handleImportError = (error: Error | string) => {
    setImportStatus({
      status: 'error',
      message: `Import failed: ${error instanceof Error ? error.message : String(error)}`
    });
  };

  const resetForm = () => {
    setUrlInput('');
    setPasteText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // CSV解析函数
  const parseCSV = (content: string): DataPoint[] => {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    // 尝试自动检测CSV格式（是否有标题行）
    let startIndex = 0;
    const firstLine = lines[0].split(',').map(v => v.trim());
    
    // 检查第一行是否可能是标题（非数字）
    if (firstLine.some(val => isNaN(Number(val)))) {
      startIndex = 1;
    }

    const dataPoints: DataPoint[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length >= 1) {
        // 单列数据：将索引作为x，值作为y
        if (values.length === 1) {
          const yValue = parseFloat(values[0]);
          if (!isNaN(yValue)) {
            dataPoints.push({
              x: i - startIndex,
              y: yValue
            });
          }
        } 
        // 多列数据：第一列为x，第二列为y
        else if (values.length >= 2) {
          const xValue = parseFloat(values[0]);
          const yValue = parseFloat(values[1]);
          if (!isNaN(xValue) && !isNaN(yValue)) {
            dataPoints.push({
              x: xValue,
              y: yValue
            });
          }
        }
      }
    }

    return dataPoints;
  };

  // Simple JSON parsing function to ensure valid DataPoint array
  const parseJSON = (content: string): DataPoint[] => {
    try {
      const parsed = JSON.parse(content);
      const result: DataPoint[] = [];
      
      if (Array.isArray(parsed)) {
        parsed.forEach((item, index) => {
          if (typeof item === 'number' && !isNaN(item)) {
            // 数值类型，使用索引作为x值
            result.push({ x: index, y: item });
          } else if (typeof item === 'object' && item !== null) {
            // 对象类型，尝试提取x和y值
            let x: number = 0;
            let y: number = 0;
            let valid = false;
            
            if (typeof item.x === 'number' && !isNaN(item.x) && typeof item.y === 'number' && !isNaN(item.y)) {
              x = item.x;
              y = item.y;
              valid = true;
            } else if (typeof item.value === 'number' && !isNaN(item.value)) {
              x = typeof item.index === 'number' && !isNaN(item.index) ? item.index : index;
              y = item.value;
              valid = true;
            }
            
            if (valid) {
              result.push({ x, y });
            }
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return [];
    }
  };

  // TXT解析函数
  const parseTXT = (content: string): DataPoint[] => {
    // 尝试按行解析
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    
    // 尝试将每行解析为数值（单列数据）
    const singleColumnData = lines
      .map((line, index) => {
        const value = parseFloat(line.trim());
        return isNaN(value) ? null : { x: index, y: value };
      })
      .filter((point): point is DataPoint => point !== null);

    // 如果单列解析成功且数据点足够多，返回单列数据
    if (singleColumnData.length > lines.length * 0.8) {
      return singleColumnData;
    }

    // 尝试将每行按空格/Tab分割为多个数值（多列数据）
    const multiColumnData: DataPoint[] = [];
    for (let i = 0; i < lines.length; i++) {
      const values = lines[i].trim().split(/\s+/).map(v => v.trim());
      if (values.length >= 2) {
        const xValue = parseFloat(values[0]);
        const yValue = parseFloat(values[1]);
        if (!isNaN(xValue) && !isNaN(yValue)) {
          multiColumnData.push({ x: xValue, y: yValue });
        }
      }
    }

    // 返回多列数据或空数组
    return multiColumnData;
  };

  // Auto-detect and parse content
  const autoParseContent = (content: string, filename?: string): DataPoint[] => {
    // 根据文件名提示进行格式推断
    if (filename) {
      const extension = filename.toLowerCase().split('.').pop();
      if (extension === 'json') {
        try {
          return parseJSON(content);
        } catch {}
      } else if (extension === 'csv') {
        try {
          return parseCSV(content);
        } catch {}
      } else if (extension === 'txt') {
        try {
          return parseTXT(content);
        } catch {}
      }
    }

    // 自动尝试不同格式
    try {
      return parseJSON(content);
    } catch {}

    try {
      return parseCSV(content);
    } catch {}

    try {
      return parseTXT(content);
    } catch {}

    throw new Error('Unable to parse content. Please select the correct format.');
  };

  // File upload handling
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleImportStart();
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let dataPoints: DataPoint[] = [];

        // 根据选择的格式进行解析
        if (selectedFormat === 'auto') {
          dataPoints = autoParseContent(content, file.name);
        } else if (selectedFormat === 'csv') {
          dataPoints = parseCSV(content);
        } else if (selectedFormat === 'json') {
          dataPoints = parseJSON(content);
        } else if (selectedFormat === 'txt') {
          dataPoints = parseTXT(content);
        }

        if (dataPoints.length > 0) {
          handleImportSuccess(dataPoints, `file (${file.name})`);
        } else {
          throw new Error('No valid data points found in the file');
        }
      } catch (error) {
        handleImportError(error as string | Error);
      }
    };

    reader.readAsText(file);
  };

  // URL import handling
  const handleUrlImport = async () => {
    const url = urlInput.trim();
    if (!url) {
      handleImportError('Please enter a valid URL');
      return;
    }

    handleImportStart();

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let dataPoints: DataPoint[] = [];

      if (contentType.includes('application/json')) {
        const jsonData = await response.json();
        dataPoints = parseJSON(JSON.stringify(jsonData));
      } else {
        const textContent = await response.text();
        if (selectedFormat === 'auto') {
          dataPoints = autoParseContent(textContent);
        } else if (selectedFormat === 'csv') {
          dataPoints = parseCSV(textContent);
        } else if (selectedFormat === 'txt') {
          dataPoints = parseTXT(textContent);
        }
      }

      if (dataPoints.length > 0) {
        handleImportSuccess(dataPoints, 'URL');
      } else {
        throw new Error('No valid data points found at the URL');
      }
    } catch (error) {
      handleImportError(error as string | Error);
    }
  };

  // Paste import handling
  const handlePasteImport = () => {
    const content = pasteText.trim();
    if (!content) {
      handleImportError('Please paste some data first');
      return;
    }

    handleImportStart();

    try {
      let dataPoints: DataPoint[] = [];

      if (selectedFormat === 'auto') {
        dataPoints = autoParseContent(content);
      } else if (selectedFormat === 'csv') {
        dataPoints = parseCSV(content);
      } else if (selectedFormat === 'json') {
        dataPoints = parseJSON(content);
      } else if (selectedFormat === 'txt') {
        dataPoints = parseTXT(content);
      }

      if (dataPoints.length > 0) {
        handleImportSuccess(dataPoints, 'pasted text');
      } else {
        throw new Error('No valid data points found in the pasted text');
      }
    } catch (error) {
      handleImportError(error as string | Error);
    }
  };

  return (
    <div className="enhanced-file-importer">
      <div className="import-tabs">
        <button 
          type="button"
          className={`tab-button ${importType === 'file' ? 'active' : ''}`}
          onClick={() => setImportType('file')}
        >
          Import from File
        </button>
        <button 
          type="button"
          className={`tab-button ${importType === 'url' ? 'active' : ''}`}
          onClick={() => setImportType('url')}
        >
          Import from URL
        </button>
        <button 
          type="button"
          className={`tab-button ${importType === 'paste' ? 'active' : ''}`}
          onClick={() => setImportType('paste')}
        >
          Paste Data
        </button>
      </div>

      <div className="format-selector">
        <label htmlFor="format-select">Format:</label>
        <select 
          id="format-select" 
          value={selectedFormat} 
          onChange={(e) => setSelectedFormat(e.target.value as FileFormat)}
        >
          <option value="auto">Auto-detect</option>
          {Object.entries(supportedFormats).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="import-content">
        {importType === 'file' && (
          <div className="file-import-section">
            <button
              type="button"
              className="upload-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </button>
            <input
              type="file"
              id="file-upload-input"
              name="file-upload-input"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json,.csv,.txt"
              onChange={handleFileUpload}
            />
            <div className="file-hint">Supported formats: JSON, CSV, TXT</div>
          </div>
        )}

        {importType === 'url' && (
          <div className="url-import-section">
            <label htmlFor="url-input">Data URL:</label>
            <input
              type="text"
              id="url-input"
              name="url-input"
              className="url-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL to JSON/CSV/TXT data"
            />
            <button 
              type="button"
              className="import-button"
              onClick={handleUrlImport}
              disabled={importStatus.status === 'importing'}
            >
              Import from URL
            </button>
          </div>
        )}

        {importType === 'paste' && (
          <div className="paste-import-section">
            <label htmlFor="paste-textarea">Data:</label>
            <textarea
              id="paste-textarea"
              name="paste-textarea"
              className="paste-textarea"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your data here (JSON, CSV, or TXT format)"
              rows={6}
            />
            <button 
              type="button"
              className="import-button"
              onClick={handlePasteImport}
              disabled={importStatus.status === 'importing'}
            >
              Import Pasted Data
            </button>
          </div>
        )}
      </div>

      {importStatus.status !== 'idle' && (
        <div className={`import-status ${importStatus.status}`}>
          {importStatus.status === 'importing' && (
            <span className="loading-indicator">⟳</span>
          )}
          {importStatus.message}
        </div>
      )}
    </div>
  );
};

export default EnhancedFileImporter;