import React, { useState, useEffect, useCallback } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import DraggableSlider from './DraggableSlider';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const currencies = [
  { code: 'USD', symbol: '$', maxInvestment: 10000 },
  { code: 'EUR', symbol: '€', maxInvestment: 10000 },
  { code: 'GBP', symbol: '£', maxInvestment: 10000 },
  { code: 'JPY', symbol: '¥', maxInvestment: 1000000 },
  { code: 'INR', symbol: '₹', maxInvestment: 100000 },
];

const SIPCalculator = () => {
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
    <div className="space-y-6">
      <div className="bg-gray-50 p-3 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Investment Parameters</h3>
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
      <div className="bg-gray-50 p-3 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-700">Withdrawal Parameters</h3>
        <DraggableSlider
          label="Withdrawal start year"
          value={withdrawalStartYear}
          setValue={(value) => updateState('withdrawalStartYear', value)}
          min={investmentPeriod}
          max={50}
          step={1}
          currencySymbol=""
        />
        <DraggableSlider
          label="Monthly withdrawal amount"
          value={monthlyWithdrawal}
          setValue={(value) => updateState('monthlyWithdrawal', value)}
          min={100}
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
      labels: Array.from({ length: netWorthData.length }, (_, i) => i),
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
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Investment Summary</h3>
            <div className="bg-white p-4 rounded-lg shadow">
              <Doughnut data={doughnutData} options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom',
                  },
                },
              }} />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2 text-gray-700">Net Worth Over Time</h3>
            <div className="bg-white p-4 rounded-lg shadow">
              <Line data={lineChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
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
              }} />
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-700">Results</h3>
          <div className="bg-white p-4 rounded-lg shadow grid grid-cols-2 gap-4">
            <div>
              <p><strong>Total invested:</strong></p>
              <p className="text-xl font-bold">{currency.symbol}{result.totalInvestment.toLocaleString()}</p>
            </div>
            <div>
              <p><strong>Total withdrawn:</strong></p>
              <p className="text-xl font-bold">{currency.symbol}{result.totalWithdrawn.toLocaleString()}</p>
            </div>
            <div>
              <p><strong>Est. returns:</strong></p>
              <p className="text-xl font-bold">{currency.symbol}{result.totalReturns.toLocaleString()}</p>
            </div>
            <div>
              <p><strong>Final balance:</strong></p>
              <p className="text-xl font-bold text-blue-600">{currency.symbol}{result.finalBalance.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInvestmentBreakdown = () => {
    if (!result) return null;

    return (
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Investment Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Duration", value: `${withdrawalStartYear + withdrawalPeriod} years` },
            { label: "Investment Phase", value: `${investmentPeriod} years` },
            { label: "Withdrawal Phase", value: `${withdrawalPeriod} years` },
            { label: "Annual Return Rate", value: `${annualReturn}%` },
          ].map((item, index) => (
            <div key={index} className="breakdown-card">
              <div className="breakdown-content">
                <h4 className="text-sm font-semibold text-gray-600 mb-1">{item.label}</h4>
                <p className="text-2xl font-bold text-blue-600">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="calculator-container bg-white">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-md ${
                isSIP ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => updateState('isSIP', true)}
            >
              SIP
            </button>
            <button
              className={`px-4 py-2 rounded-md ${
                !isSIP ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => updateState('isSIP', false)}
            >
              Lumpsum
            </button>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div>{renderParameters()}</div>
          <div>{renderSummaryAndResults()}</div>
        </div>
        {renderInvestmentBreakdown()}
      </div>
    </div>
  );
};

export default SIPCalculator;