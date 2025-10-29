import React, { useState } from 'react';
import './WelcomeGuide.css';

interface WelcomeGuideProps {
  onClose: () => void;
}

const WelcomeGuide: React.FC<WelcomeGuideProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    {
      title: 'Welcome to Probability Distribution App',
      content: (
        <div>
          <p>This application helps you analyze data through various statistical methods.</p>
          <p>Let's get you started with a quick tour of the available features.</p>
        </div>
      )
    },
    {
      title: 'Step 1: Data Input',
      content: (
        <div>
          <p>First, you need to provide your data through one of three methods:</p>
          <ul>
            <li><strong>File Upload:</strong> Upload JSON or CSV files</li>
            <li><strong>Distribution Generator:</strong> Create data from statistical distributions</li>
            <li><strong>AI Data Generation:</strong> Describe patterns for AI-generated data</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Step 2: Analyze Your Data',
      content: (
        <div>
          <p>Once your data is loaded, use the analysis tabs to:</p>
          <ul>
            <li>View basic statistics (mean, median, standard deviation, etc.)</li>
            <li>Perform MLE/MoM parameter estimation</li>
            <li>Calculate confidence intervals</li>
            <li>Run hypothesis tests</li>
          </ul>
        </div>
      )
    },
    {
      title: 'Step 3: Visualize Results',
      content: (
        <div>
          <p>Your data will be automatically visualized in charts that update in real-time as you make changes.</p>
        </div>
      )
    },
    {
      title: 'Ready to Begin',
      content: (
        <div>
          <p>Click the "Start Using App" button to begin exploring the features.</p>
          <p>If you need help later, you can access this guide again from the help menu.</p>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="welcome-guide-overlay">
      <div className="welcome-guide-container">
        <button className="welcome-guide-close" onClick={handleSkip}>
          &times;
        </button>
        
        <div className="welcome-guide-content">
          <h2>{steps[currentStep].title}</h2>
          <div className="welcome-guide-body">
            {steps[currentStep].content}
          </div>
        </div>

        <div className="welcome-guide-navigation">
          <div className="welcome-guide-indicators">
            {steps.map((_, index) => (
              <span 
                key={index} 
                className={`indicator ${index === currentStep ? 'active' : ''}`}
                onClick={() => setCurrentStep(index)}
              />
            ))}
          </div>
          
          <div className="welcome-guide-buttons">
            {currentStep > 0 && (
              <button className="previous-button" onClick={handlePrevious}>
                Previous
              </button>
            )}
            
            <button className="next-button" onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Start Using App' : 'Next'}
            </button>
            
            {currentStep < steps.length - 1 && (
              <button className="skip-button" onClick={handleSkip}>
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeGuide;