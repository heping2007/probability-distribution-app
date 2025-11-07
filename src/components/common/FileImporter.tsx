import React, { useRef, useState } from 'react';

interface FileImporterProps {
  onFileImport: (data: {x: number, y: number}[]) => void;
}

const FileImporter: React.FC<FileImporterProps> = ({ onFileImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{status: 'idle' | 'success' | 'error', message: string}>({
    status: 'idle',
    message: ''
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let data: {x: number, y: number}[] = [];

        // Try to parse as JSON
        try {
          data = JSON.parse(content);
        } catch (jsonError) {
          // If not JSON, try to parse as CSV
          const lines = content.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length > 0) {
            // Assume first row is header
            const headers = lines[0].split(',').map(header => header.trim());
            
            if (headers.length >= 2) {
              data = lines.slice(1).map(line => {
                const values = line.split(',').map(value => value.trim());
                return {
                  x: parseFloat(values[0]) || 0,
                  y: parseFloat(values[1]) || 0
                };
              }).filter(point => !isNaN(point.x) && !isNaN(point.y));
            } else {
              throw new Error('CSV format is incorrect, at least two columns of data are required');
            }
          }
        }

        if (data.length > 0) {
          onFileImport(data);
          setImportStatus({
            status: 'success',
            message: `Successfully imported ${data.length} data points`
          });
        } else {
          throw new Error('No valid data points in file');
        }
      } catch (error) {
        setImportStatus({
          status: 'error',
          message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    };

    reader.readAsText(file);
    
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="file-importer">
      <button
        type="button"
        className="import-button"
        onClick={() => fileInputRef.current?.click()}
      >
        Import Data File
      </button>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json,.csv"
        onChange={handleFileUpload}
      />
      {importStatus.status === 'success' && (
        <div className="import-status success">{importStatus.message}</div>
      )}
      {importStatus.status === 'error' && (
        <div className="import-status error">{importStatus.message}</div>
      )}
      <div className="import-hint">Supports JSON and CSV format files</div>
    </div>
  );
};

export default FileImporter;