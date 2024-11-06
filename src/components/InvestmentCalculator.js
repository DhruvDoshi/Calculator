import React, { useState, useEffect, useCallback } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import DraggableSlider from './InvestmentInputSlider';
import { useLocation } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const currencies = [
  { code: 'USD', symbol: '$', maxInvestment: 10000 },
  { code: 'EUR', symbol: '€', maxInvestment: 10000 },
  { code: 'GBP', symbol: '£', maxInvestment: 10000 },
  { code: 'JPY', symbol: '¥', maxInvestment: 1000000 },
  { code: 'INR', symbol: '₹', maxInvestment: 100000 },
];

const InvestmentCalculator = () => {
  const [calculatorType, setCalculatorType] = useState('sip');
  const location = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get('type');
    if (type === 'sip' || type === 'lumpsum') {
      setCalculatorType(type);
    }
  }, [location]);

  const [calculatorState, setCalculatorState] = useState({
    isSIP: true,
    monthlyInvestment: 2800,
    lumpsumAmount: 100000,
    annualReturn: 5.4,
    investmentPeriod: 10,
    withdrawalStartYear: 18,
    monthlyWithdrawal: 1600,
    withdrawalPeriod: 15,
    currency: currencies[0],
    result: null,
    netWorthData: null,
  });

  const { isSIP, monthlyInvestment, lumpsumAmount, annualReturn, investmentPeriod, withdrawalStartYear, monthlyWithdrawal, withdrawalPeriod, currency, result, netWorthData } = calculatorState;

  const updateState = (key, value) => {
    setCalculatorState(prevState => ({ ...prevState, [key]: value }));
  };

  const handleCurrencyChange = (event) => {
    const selectedCurrency = currencies.find(c => c.code === event.target.value);
    updateState('currency', selectedCurrency);
  };

  const calculateResults = useCallback(() => {
    const monthlyRate = annualReturn / 12 / 100;
    const totalMonths = Math.max(investmentPeriod, withdrawalStartYear + withdrawalPeriod) * 12;
    const withdrawalStartMonth = withdrawalStartYear * 12;
    let balance = isSIP ? 0 : lumpsumAmount;
    let totalInvested = isSIP ? 0 : lumpsumAmount;
    let totalWithdrawn = 0;
    let netWorthByYear = [balance];

    for (let month = 1; month <= totalMonths; month++) {
      if (isSIP && month <= investmentPeriod * 12) {
        balance += monthlyInvestment;
        totalInvested += monthlyInvestment;
      }
      
      balance *= (1 + monthlyRate);

      if (month > withdrawalStartMonth) {
        balance -= monthlyWithdrawal;
        totalWithdrawn += monthlyWithdrawal;
      }

      if (month % 12 === 0) {
        netWorthByYear.push(Math.round(balance));
      }
    }

    const totalReturns = balance + totalWithdrawn - totalInvested;

    return {
      totalInvestment: Math.round(totalInvested),
      totalReturns: Math.round(totalReturns),
      totalValue: Math.round(balance + totalWithdrawn),
      finalBalance: Math.round(balance),
      totalWithdrawn: Math.round(totalWithdrawn),
      netWorthData: netWorthByYear
    };
  }, [isSIP, monthlyInvestment, lumpsumAmount, annualReturn, investmentPeriod, withdrawalStartYear, monthlyWithdrawal, withdrawalPeriod]);

  useEffect(() => {
    const results = calculateResults();
    updateState('result', results);
    updateState('netWorthData', results.netWorthData);
  }, [calculateResults]);

  const renderParameters = () => (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Investment Parameters</h3>
        <DraggableSlider
          label={isSIP ? "Monthly investment" : "Lumpsum amount"}
          value={isSIP ? monthlyInvestment : lumpsumAmount}
          setValue={(value) => updateState(isSIP ? 'monthlyInvestment' : 'lumpsumAmount', value)}
          min={isSIP ? 100 : 1000}
          max={isSIP ? 10000 : 1000000}
          step={isSIP ? 100 : 1000}
          currencySymbol={currency.symbol}
        />
        <DraggableSlider
          label="Expected return rate (p.a)"
          value={annualReturn}
          setValue={(value) => updateState('annualReturn', value)}
          min={1}
          max={30}
          step={0.1}
          currencySymbol=""
        />
        <DraggableSlider
          label="Investment period (years)"
          value={investmentPeriod}
          setValue={(value) => updateState('investmentPeriod', value)}
          min={1}
          max={30}
          step={1}
          currencySymbol=""
        />
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3 text-gray-700">Withdrawal Parameters</h3>
        <DraggableSlider
          label="Withdrawal start year"
          value={withdrawalStartYear}
          setValue={(value) => updateState('withdrawalStartYear', value)}
          min={investmentPeriod}
          max={50}
          step={1}
          currencySymbol=""
          currentYear={new Date().getFullYear()}
          showYear={true}
        />
        <DraggableSlider
          label="Monthly withdrawal amount"
          value={monthlyWithdrawal}
          setValue={(value) => updateState('monthlyWithdrawal', value)}
          min={0}
          max={10000}
          step={100}
          currencySymbol={currency.symbol}
        />
        <DraggableSlider
          label="Withdrawal period (years)"
          value={withdrawalPeriod}
          setValue={(value) => updateState('withdrawalPeriod', value)}
          min={1}
          max={30}
          step={1}
          currencySymbol=""
        />
      </div>
    </div>
  );

  const renderSummaryAndResults = () => {
    if (!result || !netWorthData) return null;

    const doughnutData = {
      labels: ['Invested amount', 'Est. returns'],
      datasets: [
        {
          data: [result.totalInvestment, result.totalReturns],
          backgroundColor: ['#BFDBFE', '#3B82F6'],
          borderColor: ['#BFDBFE', '#3B82F6'],
          borderWidth: 1,
        },
      ],
    };

    const lineChartData = {
      labels: Array.from({ length: netWorthData.length }, (_, i) => new Date().getFullYear() + i),
      datasets: [
        {
          label: 'Net Worth',
          data: netWorthData,
          borderColor: (context) => {
            const index = context.dataIndex;
            const value = context.dataset.data[index];
            return value < 0 ? 'red' : '#3B82F6';
          },
          backgroundColor: (context) => {
            const index = context.dataIndex;
            const value = context.dataset.data[index];
            return value < 0 ? 'rgba(255, 0, 0, 0.5)' : 'rgba(59, 130, 246, 0.5)';
          },
          tension: 0.1,
          segment: {
            borderColor: (context) => {
              const prev = context.p0.parsed.y;
              const curr = context.p1.parsed.y;
              return prev < 0 || curr < 0 ? 'red' : '#3B82F6';
            },
          },
        },
      ],
    };
    
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Investment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col justify-center" style={{ height: '250px' }}>
            <Doughnut data={doughnutData} options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: '60%',
              plugins: {
                legend: {
                  display: true,
                  position: 'bottom',
                  labels: { 
                    font: { size: 12 },
                    padding: 20
                  }
                },
              },
              layout: {
                padding: {
                  bottom: 20
                }
              }
            }} />
          </div>
          <div style={{ height: '250px' }}>
            <Line data={lineChartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { 
                legend: { display: false },
                title: {
                  display: true,
                  text: 'Net Worth Over Time',
                  font: { size: 16, weight: 'bold' }
                }
              },
              scales: {
                x: { 
                  title: { display: true, text: 'Year', font: { size: 12 } },
                  ticks: { font: { size: 10 } }
                },
                y: {
                  title: { display: true, text: `Net Worth (${currency.symbol})`, font: { size: 12 } },
                  ticks: { 
                    callback: (value) => `${value < 0 ? '-' : ''}${currency.symbol}${Math.abs(value).toLocaleString()}`, 
                    font: { size: 10 } 
                  },
                },
              },
            }} />
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!result) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Results</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total invested:</p>
            <p className="text-lg font-bold">{currency.symbol}{result.totalInvestment.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Total withdrawn:</p>
            <p className="text-lg font-bold">{currency.symbol}{result.totalWithdrawn.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Est. returns:</p>
            <p className="text-lg font-bold">{currency.symbol}{result.totalReturns.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Final balance:</p>
            <p className="text-lg font-bold text-blue-600">{currency.symbol}{result.finalBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderInvestmentBreakdown = () => {
    if (!result) return null;

    const currentYear = new Date().getFullYear();
    const withdrawalStartActualYear = currentYear + withdrawalStartYear;
    const withdrawalEndYear = withdrawalStartActualYear + withdrawalPeriod;

    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3 text-white">Investment Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <p className="text-white mb-1">Total Duration</p>
            <p className="text-xl font-bold text-white">{withdrawalStartYear + withdrawalPeriod} years</p>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <p className="text-white mb-1">Investment Phase</p>
            <p className="text-xl font-bold text-white">{investmentPeriod} years</p>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <p className="text-white mb-1">Withdrawal Period</p>
            <p className="text-base font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis">
              {currency.symbol}{monthlyWithdrawal.toLocaleString()} monthly - {withdrawalStartActualYear} to {withdrawalEndYear}
            </p>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-lg">
            <p className="text-white mb-1">Annual Return Rate</p>
            <p className="text-xl font-bold text-white">{annualReturn}%</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="calculator-container bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 text-sm font-semibold rounded-md ${
                calculatorType === 'sip' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setCalculatorType('sip')}
            >
              SIP
            </button>
            <button
              className={`px-4 py-2 text-sm font-semibold rounded-md ${
                calculatorType === 'lumpsum' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setCalculatorType('lumpsum')}
            >
              Lumpsum
            </button>
          </div>
          <select 
            value={currency.code}
            onChange={handleCurrencyChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            {renderParameters()}
          </div>
          <div className="lg:col-span-8 space-y-4">
            {renderSummaryAndResults()}
            {renderResults()}
          </div>
        </div>
        <div className="mt-4">
          {renderInvestmentBreakdown()}
        </div>
      </div>
    </div>
  );
};

export default InvestmentCalculator;