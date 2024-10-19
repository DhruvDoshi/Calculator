import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import DraggableSlider from '../TaxInputSlider';

ChartJS.register(ArcElement, Tooltip, Legend);

const DEDUCTION_LIMITS = {
  standardDeduction: 50000,
  section80C: 150000,
  section80D: 25000,
  section80E: Infinity,
  section80TTA: 10000,
  section24b: 200000
};


export const IndiaTaxCalculator = () => {
  const [income, setIncome] = useState(500000);
  const [shortTermCapitalGains, setShortTermCapitalGains] = useState(0);
  const [longTermCapitalGains, setLongTermCapitalGains] = useState(0);
  const [ageBracket, setAgeBracket] = useState('below60');
  const [taxRegime, setTaxRegime] = useState('old');
  const [deductions, setDeductions] = useState({
    section80C: 0,
    section80D: 0,
    section80E: 0,
    section80TTA: 0,
    section24b: 0
  });
  const [showDeductions, setShowDeductions] = useState(false);
  const [taxResult, setTaxResult] = useState(null);

  const handleDeductionChange = (name, value) => {
    setDeductions(prev => ({
      ...prev,
      [name]: Math.min(Number(value) || 0, DEDUCTION_LIMITS[name] || Infinity)
    }));
  };

  useEffect(() => {
    // Calculate tax here
    const calculateTax = () => {
      let taxableIncome = income;
      
      // Apply deductions
      if (taxRegime === 'old') {
        taxableIncome -= DEDUCTION_LIMITS.standardDeduction;
        Object.values(deductions).forEach(deduction => {
          taxableIncome -= deduction;
        });
      }
      
      // Simple tax calculation (you may need to adjust this based on actual Indian tax rules)
      let tax = 0;
      if (taxableIncome > 1000000) {
        tax = (taxableIncome - 1000000) * 0.3 + 112500;
      } else if (taxableIncome > 500000) {
        tax = (taxableIncome - 500000) * 0.2 + 12500;
      } else if (taxableIncome > 250000) {
        tax = (taxableIncome - 250000) * 0.05;
      }
      
      // Add tax on short-term capital gains (assuming 15% tax rate)
      tax += shortTermCapitalGains * 0.15;
      
      // Add tax on long-term capital gains (assuming 10% tax rate above ₹1 lakh)
      const taxableLongTermGains = Math.max(0, longTermCapitalGains - 100000);
      tax += taxableLongTermGains * 0.1;
      
      const totalIncome = income + shortTermCapitalGains + longTermCapitalGains;
      const netIncome = totalIncome - tax;
      const effectiveTaxRate = (tax / totalIncome) * 100;

      setTaxResult({
        taxableIncome: Math.max(0, taxableIncome),
        tax: Math.max(0, tax),
        netIncome,
        effectiveTaxRate
      });
    };

    calculateTax();
  }, [income, shortTermCapitalGains, longTermCapitalGains, deductions, ageBracket, taxRegime]);

  const chartData = {
    labels: ['Tax', 'Net Income'],
    datasets: [
      {
        data: [taxResult?.tax || 0, taxResult?.netIncome || income],
        backgroundColor: ['#FF6384', '#36A2EB'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB']
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false
  };

  return (
    <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
      <div className="lg:w-2/3 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Income Details</h2>
          <div className="mb-4">
            <DraggableSlider
              label="Annual Income"
              value={income}
              setValue={setIncome}
              min={0}
              max={10000000}
              step={10000}
              currencySymbol="₹"
              currentYear={new Date().getFullYear()}
              showYear={false}
            />
          </div>
          <div className="mb-4">
            <DraggableSlider
              label="Short-term Capital Gains"
              value={shortTermCapitalGains}
              setValue={setShortTermCapitalGains}
              min={0}
              max={10000000}
              step={10000}
              currencySymbol="₹"
              currentYear={new Date().getFullYear()}
              showYear={false}
            />
          </div>
          <div className="mb-4">
            <DraggableSlider
              label="Long-term Capital Gains"
              value={longTermCapitalGains}
              setValue={setLongTermCapitalGains}
              min={0}
              max={10000000}
              step={10000}
              currencySymbol="₹"
              currentYear={new Date().getFullYear()}
              showYear={false}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-normal text-gray-700 mb-2">Age Bracket</label>
            <div className="flex space-x-2">
              {['Below 60', '60 to 80', 'Above 80'].map((age) => (
                <button
                  key={age}
                  className={`flex-1 px-4 py-2 rounded-md text-sm ${
                    ageBracket === age.toLowerCase().replace(' ', '')
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setAgeBracket(age.toLowerCase().replace(' ', ''))}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">Select Tax Regime</h2>
          <div className="flex space-x-2 mb-4">
            {['Old Regime', 'New Regime'].map((regime) => (
              <button
                key={regime}
                className={`flex-1 px-4 py-2 rounded-md ${
                  taxRegime === regime.toLowerCase().replace(' ', '')
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setTaxRegime(regime.toLowerCase().replace(' ', ''))}
              >
                {regime}
              </button>
            ))}
          </div>
          <button
            className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            onClick={() => setShowDeductions(!showDeductions)}
          >
            {showDeductions ? 'Hide Deductions' : 'Show Deductions'}
          </button>
          {showDeductions && (
            <div className="mt-4">
              <h2 className="text-2xl font-bold mb-4">Deductions</h2>
              {Object.entries(deductions).map(([name, value]) => (
                <div key={name} className="mb-4">
                  <DraggableSlider
                    label={name.replace('section', 'Section ')}
                    value={value}
                    setValue={(newValue) => handleDeductionChange(name, newValue)}
                    min={0}
                    max={DEDUCTION_LIMITS[name] || Infinity}
                    step={1000}
                    currencySymbol="₹"
                    currentYear={new Date().getFullYear()}
                    showYear={false}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {taxResult && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Tax Calculation Results</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Taxable Income</p>
                <p className="text-lg font-medium">₹{taxResult.taxableIncome.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tax Amount</p>
                <p className="text-lg font-medium">₹{taxResult.tax.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Net Income</p>
                <p className="text-lg font-medium">₹{taxResult.netIncome.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Effective Tax Rate</p>
                <p className="text-lg font-medium">{taxResult.effectiveTaxRate.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="lg:w-1/3">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Tax Breakdown</h2>
          <div className="h-64">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};
