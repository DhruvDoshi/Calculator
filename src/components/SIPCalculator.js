import React, { useState, useEffect, useCallback } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import DraggableSlider from './DraggableSlider';
import { calculateSIP, calculateNetWorthOverTime } from '../utils/calculationUtils';
import { getDoughnutChartConfig, getLineChartConfig } from '../utils/chartConfig';
import { currencies } from '../utils/constants';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

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
  const [netWorthData, setNetWorthData] = useState([]);
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

  const updateCalculations = useCallback(() => {
    const sipResult = calculateSIP(monthlyInvestment, annualReturn, investmentPeriod, withdrawalAmount, withdrawalStartYear, withdrawalPeriod);
    setResult(sipResult);

    const netWorthResult = calculateNetWorthOverTime(monthlyInvestment, annualReturn, investmentPeriod, withdrawalAmount, withdrawalStartYear, withdrawalPeriod);
    setNetWorthData(netWorthResult);
  }, [monthlyInvestment, annualReturn, investmentPeriod, withdrawalAmount, withdrawalStartYear, withdrawalPeriod]);

  useEffect(() => {
    updateCalculations();
  }, [updateCalculations]);

  const doughnutChartConfig = getDoughnutChartConfig(result.invested, result.returns);
  const lineChartConfig = getLineChartConfig(netWorthData, currentYear, currency.symbol);

  return (
    <div className="calculator-container bg-white">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">SIP Calculator with SWP</h2>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Investment Parameters</h3>
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
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Withdrawal Parameters</h3>
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
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Investment Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="h-48">
                    <Doughnut {...doughnutChartConfig} />
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
                <div className="h-48">
                  <Line {...lineChartConfig} />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Results</h3>
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
        <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4 text-white">Investment Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <h4 className="text-md font-semibold mb-1 text-white">Total Duration</h4>
              <p className="text-2xl font-bold text-white">{Math.max(investmentPeriod, withdrawalStartYear + withdrawalPeriod)} years</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <h4 className="text-md font-semibold mb-1 text-white">Investment Phase</h4>
              <p className="text-2xl font-bold text-white">{investmentPeriod} years</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <h4 className="text-md font-semibold mb-1 text-white">Withdrawal Phase</h4>
              <p className="text-2xl font-bold text-white">{withdrawalPeriod} years</p>
            </div>
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <h4 className="text-md font-semibold mb-1 text-white">Annual Return Rate</h4>
              <p className="text-2xl font-bold text-white">{annualReturn}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SIPCalculator;