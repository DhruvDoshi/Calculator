import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const currencies = [
  { code: 'USD', symbol: '$', maxInvestment: 10000 },
  { code: 'EUR', symbol: '€', maxInvestment: 10000 },
  { code: 'GBP', symbol: '£', maxInvestment: 10000 },
  { code: 'JPY', symbol: '¥', maxInvestment: 1000000 },
  { code: 'INR', symbol: '₹', maxInvestment: 100000 },
];

const DraggableSlider = ({ label, value, setValue, min, max, step, currencySymbol, currentYear, showYear }) => {
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditingYears, setIsEditingYears] = useState(false);
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const updateValue = useCallback((clientX) => {
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = (clientX - rect.left) / rect.width;
    const newValue = Math.min(max, Math.max(min, min + Math.round((max - min) * percentage / step) * step));
    setValue(newValue);
    setInputValue(newValue);
  }, [min, max, step, setValue]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    updateValue(e.clientX);
  }, [updateValue]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      updateValue(e.clientX);
    }
  }, [isDragging, updateValue]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleYearsInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleYearInputChange = (e) => {
    const inputYear = parseInt(e.target.value);
    if (!isNaN(inputYear)) {
      setInputValue(inputYear - currentYear);
    }
  };

  const handleInputBlur = () => {
    let newValue = Math.min(max, Math.max(min, parseInt(inputValue) || min));
    setInputValue(newValue);
    setValue(newValue);
    setIsEditingYears(false);
    setIsEditingYear(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-gray-600">{label}</label>
        {showYear ? (
          <div className="flex space-x-2">
            <div 
              className="bg-blue-50 px-3 py-1 rounded-full cursor-pointer transition duration-300 hover:bg-blue-100"
              onClick={() => setIsEditingYears(true)}
            >
              {isEditingYears ? (
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleYearsInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  className="w-16 text-right bg-transparent border-none focus:outline-none"
                  autoFocus
                />
              ) : (
                <span className="text-blue-600 font-semibold">{value} Yr</span>
              )}
            </div>
            <div 
              className="bg-green-50 px-3 py-1 rounded-full cursor-pointer transition duration-300 hover:bg-green-100"
              onClick={() => setIsEditingYear(true)}
            >
              {isEditingYear ? (
                <input
                  type="text"
                  value={currentYear + value}
                  onChange={handleYearInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={handleKeyDown}
                  className="w-20 text-right bg-transparent border-none focus:outline-none"
                  autoFocus
                />
              ) : (
                <span className="text-green-600 font-semibold">{currentYear + value}</span>
              )}
            </div>
          </div>
        ) : (
          <div 
            className="bg-blue-50 px-3 py-1 rounded-full cursor-pointer transition duration-300 hover:bg-blue-100"
            onClick={() => setIsEditingYears(true)}
          >
            {isEditingYears ? (
              <input
                type="text"
                value={inputValue}
                onChange={handleYearsInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                className="w-24 text-right bg-transparent border-none focus:outline-none"
                autoFocus
              />
            ) : (
              <span className="text-blue-600 font-semibold">
                {currencySymbol && `${currencySymbol} `}{value.toLocaleString()}
                {label.includes('rate') ? '%' : label.includes('period') ? ' Yr' : ''}
              </span>
            )}
          </div>
        )}
      </div>
      <div 
        ref={sliderRef}
        className="relative h-2 bg-gray-200 rounded-full cursor-pointer"
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          setIsDragging(true);
          updateValue(e.touches[0].clientX);
        }}
        onTouchMove={(e) => {
          if (isDragging) {
            updateValue(e.touches[0].clientX);
          }
        }}
        onTouchEnd={() => setIsDragging(false)}
      >
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md transition-transform duration-300 hover:scale-110"
          style={{ left: `calc(${percentage}% - 10px)` }}
        ></div>
      </div>
    </div>
  );
};

const SIPCalculator = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState(1000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [investmentPeriod, setInvestmentPeriod] = useState(10);
  const [withdrawalStartYear, setWithdrawalStartYear] = useState(11);
  const [withdrawalAmount, setWithdrawalAmount] = useState(500);
  const [withdrawalPeriod, setWithdrawalPeriod] = useState(15);
  const [result, setResult] = useState({
    invested: 0,
    returns: 0,
    total: 0,
    finalBalance: 0,
    totalWithdrawn: 0
  });
  const [currency, setCurrency] = useState(currencies[0]);
  const currentYear = new Date().getFullYear();

  const handleCurrencyChange = (e) => {
    const newCurrency = currencies.find(c => c.code === e.target.value);
    setCurrency(newCurrency);
    if (monthlyInvestment > newCurrency.maxInvestment) {
      setMonthlyInvestment(newCurrency.maxInvestment);
    }
    if (withdrawalAmount > newCurrency.maxInvestment) {
      setWithdrawalAmount(newCurrency.maxInvestment);
    }
  };

  const calculateSIP = useCallback(() => {
    const monthlyRate = annualReturn / 12 / 100;
    const investmentMonths = investmentPeriod * 12;
    const totalMonths = Math.max(investmentPeriod, withdrawalStartYear + withdrawalPeriod) * 12;
    const withdrawalStartMonth = withdrawalStartYear * 12;

    let balance = 0;
    let totalInvested = 0;
    let totalWithdrawn = 0;

    for (let month = 1; month <= totalMonths; month++) {
      if (month <= investmentMonths) {
        balance += monthlyInvestment;
        totalInvested += monthlyInvestment;
      }
      
      balance *= (1 + monthlyRate);

      if (month > withdrawalStartMonth && month <= withdrawalStartMonth + withdrawalPeriod * 12) {
        balance -= withdrawalAmount;
        totalWithdrawn += withdrawalAmount;
      }
    }

    const totalReturns = balance + totalWithdrawn - totalInvested;

    setResult({
      invested: Math.round(totalInvested),
      returns: Math.round(totalReturns),
      total: Math.round(totalInvested + totalReturns),
      finalBalance: Math.round(balance),
      totalWithdrawn: Math.round(totalWithdrawn)
    });
  }, [monthlyInvestment, annualReturn, investmentPeriod, withdrawalAmount, withdrawalStartYear, withdrawalPeriod]);

  useEffect(() => {
    calculateSIP();
  }, [calculateSIP]);

  const chartData = {
    labels: ['Invested amount', 'Est. returns'],
    datasets: [
      {
        data: [result.invested, result.returns],
        backgroundColor: ['#E0E7FF', '#5367FF'],
        borderColor: ['#E0E7FF', '#5367FF'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  return (
    <div className="calculator-container p-8 max-w-6xl mx-auto bg-white rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800">SIP Calculator with SWP</h2>
        <select 
          value={currency.code}
          onChange={handleCurrencyChange}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>{c.code}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <DraggableSlider
            label="Monthly investment"
            value={monthlyInvestment}
            setValue={setMonthlyInvestment}
            min={100}
            max={currency.maxInvestment}
            step={currency.code === 'INR' ? 500 : 100}
            currencySymbol={currency.symbol}
          />
          <DraggableSlider
            label="Expected return rate (p.a)"
            value={annualReturn}
            setValue={setAnnualReturn}
            min={1}
            max={30}
            step={0.1}
            currencySymbol=""
          />
          <DraggableSlider
            label="Investment period (years)"
            value={investmentPeriod}
            setValue={setInvestmentPeriod}
            min={1}
            max={30}
            step={1}
            currencySymbol=""
          />
          <DraggableSlider
            label="Withdrawal start year"
            value={withdrawalStartYear}
            setValue={setWithdrawalStartYear}
            min={investmentPeriod + 1}
            max={40}
            step={1}
            currencySymbol=""
            currentYear={currentYear}
            showYear={true}
          />
          <DraggableSlider
            label="Monthly withdrawal amount"
            value={withdrawalAmount}
            setValue={setWithdrawalAmount}
            min={0}
            max={currency.maxInvestment}
            step={currency.code === 'INR' ? 500 : 100}
            currencySymbol={currency.symbol}  // This line is updated to use the selected currency symbol
          />
          <DraggableSlider
            label="Withdrawal period (years)"
            value={withdrawalPeriod}
            setValue={setWithdrawalPeriod}
            min={1}
            max={30}
            step={1}
            currencySymbol=""
          />
        </div>
        <div>
          <div className="h-64 mb-8">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
          <div className="mb-6 flex justify-center space-x-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-200 mr-2 rounded-full"></div>
              <span className="text-sm text-gray-600">Invested amount</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 mr-2 rounded-full"></div>
              <span className="text-sm text-gray-600">Est. returns</span>
            </div>
          </div>
          <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-600">Total invested</span>
              <span className="font-semibold text-gray-800">{currency.symbol}{result.invested.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Est. returns</span>
              <span className="font-semibold text-gray-800">{currency.symbol}{result.returns.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total withdrawn</span>
              <span className="font-semibold text-gray-800">{currency.symbol}{result.totalWithdrawn.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-4 border-t">
              <span className="text-gray-600">Final balance</span>
              <span className="font-bold text-xl text-blue-600">{currency.symbol}{result.finalBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SIPCalculator;