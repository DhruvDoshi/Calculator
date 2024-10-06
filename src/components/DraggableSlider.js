import React, { useState, useRef } from 'react';

const DraggableSlider = ({ label, value, setValue, min, max, step, currencySymbol, currentYear, showYear }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const sliderRef = useRef(null);

  const updateValue = (clientX) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = (clientX - rect.left) / rect.width;
    const newValue = Math.round((percentage * (max - min) + min) / step) * step;
    setValue(Math.min(max, Math.max(min, newValue)));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateValue(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateValue(e.clientX);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let newValue = Math.min(max, Math.max(min, parseFloat(inputValue) || min));
    setInputValue(newValue);
    setValue(newValue);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
        <label className="text-sm font-medium text-gray-600 mb-1 sm:mb-0">{label}</label>
        <div 
          className="bg-blue-50 px-3 py-1 rounded-full cursor-pointer transition duration-300 hover:bg-blue-100 w-full sm:w-auto text-center sm:text-left"
          onClick={() => setIsEditing(true)}
        >
          {isEditing ? (
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              className="w-full sm:w-24 text-center sm:text-right bg-transparent border-none focus:outline-none"
              autoFocus
            />
          ) : (
            <span className="text-blue-600 font-semibold">
              {currencySymbol && `${currencySymbol} `}
              {showYear ? `${value} Yr (${currentYear + value})` : value.toLocaleString()}
              {!showYear && (label.includes('rate') ? '%' : label.includes('period') ? ' Yr' : '')}
            </span>
          )}
        </div>
      </div>
      <div 
        ref={sliderRef}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md"
          style={{ left: `calc(${percentage}% - 8px)` }}
        ></div>
      </div>
    </div>
  );
};

export default DraggableSlider;
