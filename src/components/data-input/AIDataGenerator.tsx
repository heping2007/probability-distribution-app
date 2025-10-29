import { useState } from 'react';
import { generateDataWithAI } from '../../services/aiService';
import './AIDataGenerator.css';

interface AIDataGeneratorProps {
  onDataGenerated: (data: number[]) => void;
}

const AIDataGenerator: React.FC<AIDataGeneratorProps> = ({ onDataGenerated }) => {
  const [description, setDescription] = useState('');
  const [sampleCount, setSampleCount] = useState(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please enter data description');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsGenerating(true);

    try {
      console.log('Starting data generation via proxy API...');
      // Call AI service to generate data (via local proxy API)
      const data = await generateDataWithAI(description, sampleCount);
      
      // Pass the generated data to the parent component
      onDataGenerated(data);
      
      // Show success message
      setSuccessMessage(`Successfully generated ${data.length} data points!`);
      
    } catch (err) {
      console.error('Failed to generate data:', err);
      setError('Failed to generate data. Please check if the proxy service is running properly');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="ai-data-generator">
      <h3>AI Data Generator (via Proxy API)</h3>
      <div className="form-group">
        <label htmlFor="description">Data Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Please describe the data you want to generate, e.g., 'Generate temperature data in Guangdong changing with seasons'"
          rows={3}
        />
        <small className="hint">Hint: More detailed descriptions will yield more accurate data</small>
      </div>
      
      <div className="form-group">
        <label htmlFor="sampleCount">Sample Count:</label>
        <input
          type="number"
          id="sampleCount"
          min="10"
          max="1000"
          value={sampleCount}
          onChange={(e) => setSampleCount(parseInt(e.target.value))}
        />
      </div>

      <button 
        onClick={handleGenerate} 
        disabled={isGenerating}
        className="generate-button"
      >
        {isGenerating ? 'Generating...' : 'Generate Data'}
      </button>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="status-info">
        <p>Status: Proxy API Service Running</p>
      </div>
    </div>
  );
};

export default AIDataGenerator;