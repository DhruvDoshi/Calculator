import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const currencies = [
  { code: 'USD', symbol: '$', maxInvestment: 20000 },
  { code: 'EUR', symbol: '€', maxInvestment: 20000 },
  { code: 'GBP', symbol: '£', maxInvestment: 20000 },
  { code: 'JPY', symbol: '¥', maxInvestment: 2000000 },
  { code: 'INR', symbol: '₹', maxInvestment: 2000000 },
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
  const [netWorthData, setNetWorthData] = useState([]);

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

  const calculateNetWorthOverTime = useCallback(() => {
    const monthlyRate = annualReturn / 12 / 100;
    const totalMonths = Math.max(investmentPeriod, withdrawalStartYear + withdrawalPeriod) * 12;
    const withdrawalStartMonth = withdrawalStartYear * 12;

    let balance = 0;
    let netWorthByYear = [];

    for (let month = 1; month <= totalMonths; month++) {
      if (month <= investmentPeriod * 12) {
        balance += monthlyInvestment;
      }
      
      balance *= (1 + monthlyRate);

      if (month > withdrawalStartMonth) {
        balance -= withdrawalAmount;
      }

      if (month % 12 === 0) {
        netWorthByYear.push(Math.round(balance));
      }
    }

    setNetWorthData(netWorthByYear);
  }, [monthlyInvestment, annualReturn, investmentPeriod, withdrawalAmount, withdrawalStartYear, withdrawalPeriod]);

  useEffect(() => {
    calculateSIP();
    calculateNetWorthOverTime();
  }, [calculateSIP, calculateNetWorthOverTime]);

  const doughnutChartData = {
    labels: ['Invested amount', 'Est. returns'],
    datasets: [
      {
        data: [result.invested, result.returns],
        backgroundColor: ['#BFDBFE', '#3B82F6'],
        borderColor: ['#BFDBFE', '#3B82F6'],
        borderWidth: 1,
      },
    ],
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const lineChartData = {
    labels: Array.from({ length: netWorthData.length }, (_, i) => currentYear + i + 1),
    datasets: [
      {
        label: 'Net Worth',
        data: netWorthData,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Net Worth Over Time',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Year',
        },
      },
      y: {
        title: {
          display: true,
          text: `Net Worth (${currency.symbol})`,
        },
        ticks: {
          callback: (value) => `${currency.symbol}${value.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="calculator-container p-4 max-w-7xl mx-auto bg-white rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">SIP Calculator with SWP</h2>
        <select 
          value={currency.code}
          onChange={handleCurrencyChange}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
        >
          {currencies.map((c) => (
            <option key={c.code} value={c.code}>{c.code}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Investment Parameters</h3>
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
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Withdrawal Parameters</h3>
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
              currencySymbol={currency.symbol}
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
        </div>
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Investment Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="h-48">
                  <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                </div>
                <div className="flex justify-center space-x-8 mt-2">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-200 mr-2 rounded-full"></div>
                    <span className="text-xs text-gray-600">Invested amount</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 mr-2 rounded-full"></div>
                    <span className="text-xs text-gray-600">Est. returns</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Results</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-2">
                  <span className="text-sm text-gray-600">Total invested</span>
                  <div className="text-lg font-semibold text-gray-800">{currency.symbol}{result.invested.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Est. returns</span>
                  <div className="text-lg font-semibold text-gray-800">{currency.symbol}{result.returns.toLocaleString()}</div>
                </div>
              </div>
              <div>
                <div className="mb-2">
                  <span className="text-sm text-gray-600">Total withdrawn</span>
                  <div className="text-lg font-semibold text-gray-800">{currency.symbol}{result.totalWithdrawn.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Final balance</span>
                  <div className="text-xl font-bold text-blue-600">{currency.symbol}{result.finalBalance.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SIPCalculator;