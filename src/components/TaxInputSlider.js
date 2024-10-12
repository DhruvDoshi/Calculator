import React, { useState, useRef, useCallback } from 'react';

const DraggableSlider = ({ label, value, setValue, min, max, step, currencySymbol, currentYear, showYear }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const sliderRef = useRef(null);

  const updateValue = useCallback((clientX) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const padding = rect.width * 0.05; // 5% padding on each side
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left - padding) / (rect.width - 2 * padding)));
    const newValue = Math.round((percentage * (max - min) + min) / step) * step;
    setValue(Math.min(max, Math.max(min, newValue)));
  }, [min, max, step, setValue]);

  const handleStart = useCallback((e) => {
    e.preventDefault();
    const handleMove = (moveEvent) => {
      moveEvent.preventDefault();
      const clientX = moveEvent.type.includes('mouse') ? moveEvent.clientX : moveEvent.touches[0].clientX;
      updateValue(clientX);
    };
    const handleEnd = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchend', handleEnd);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);
    updateValue(e.type.includes('mouse') ? e.clientX : e.touches[0].clientX);
  }, [updateValue]);

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
    <div className="mb-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
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
      <div className="relative px-[5%]">
        <div 
          ref={sliderRef}
          className="relative h-4 sm:h-2 bg-gray-200 rounded-full cursor-pointer"
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
            style={{ width: `${percentage}%` }}
          ></div>
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 sm:w-4 sm:h-4 bg-white border-2 border-blue-500 rounded-full shadow-md"
            style={{ left: `calc(${percentage}% - 12px)` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default DraggableSlider;
