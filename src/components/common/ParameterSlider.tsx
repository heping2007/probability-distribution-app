import React from 'react';

interface ParameterSliderProps {
  label?: string;
  value: number;
  onChange?: (value: number) => void;
  onValueChange?: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  value,
  onChange,
  onValueChange,
  min,
  max,
  step
}) => {
  // Use onChange or onValueChange, prioritize onValueChange for backward compatibility
  const handleChange = onValueChange || onChange || (() => {});
  return (
    <div className="parameter-slider">
      <label>
        {label}: {value.toFixed(2)}
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
        const newValue = parseFloat(e.target.value);
        handleChange(newValue);
      }}
        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
      />
    </div>
  );
};

export default ParameterSlider;