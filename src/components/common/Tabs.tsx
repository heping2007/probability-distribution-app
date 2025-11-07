import React from 'react';
import './Tabs.css';

interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
}

interface TabsProps {
  tabs?: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

  const defaultTabs: Tab[] = [
    { id: 'data-input', label: 'Data Input' },
    { id: 'basic-stats', label: 'Basic Statistics' },
    { id: 'mlemom-analysis', label: 'MLE/MoM Analysis' },
    { id: 'confidence-interval', label: 'Confidence Intervals' },
    { id: 'hypothesis-testing', label: 'Hypothesis Testing' },
  ];

const Tabs: React.FC<TabsProps> = ({ tabs = defaultTabs, activeTab, onTabChange }) => {
  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${tab?.disabled ? 'disabled' : ''}`}
            onClick={() => !tab?.disabled && onTabChange(tab.id)}
            disabled={tab?.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;