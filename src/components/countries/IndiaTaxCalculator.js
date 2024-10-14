import React, { useState, useEffect } from 'react';
import TaxInputSlider from '../TaxInputSlider';
import taxBrackets from '../../data/taxRates/indiaTaxRates.json';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Deduction limits
const DEDUCTION_LIMITS = {
  standardDeduction: 50000,
  section80C: 150000,
  nps: 50000,
  healthInsurance: 25000
};

// Calculate tax
const calculateTax = (income, deductions, ageBracket, taxRegime) => {
  const taxableIncome = Math.max(0, income - Object.values(deductions).reduce((sum, val) => sum + val, 0));
  let tax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of taxBrackets.brackets) {
    if (remainingIncome > 0) {
      const taxableAmount = Math.min(remainingIncome, (bracket.max || Infinity) - bracket.min);
      tax += taxableAmount * bracket.rate;
      remainingIncome -= taxableAmount;
    } else break;
  }

  return {
    taxableIncome,
    tax,
    netIncome: income - tax,
    effectiveTaxRate: (tax / income) * 100
  };
};

// Tax saving suggestions
const TAX_SAVING_SUGGESTIONS = [
  {
    name: "Section 80C investments",
    description: "Invest in PPF, ELSS, or pay LIC premiums",
    limit: 150000,
    applicable: () => true
  },
  {
    name: "National Pension System (NPS)",
    description: "Additional deduction under Section 80CCD(1B)",
    limit: 50000,
    applicable: () => true
  },
  {
    name: "Health Insurance Premium",
    description: "Deduction under Section 80D",
    limit: 25000,
    applicable: () => true
  },
  {
    name: "Home Loan Interest",
    description: "Deduction under Section 24",
    limit: 200000,
    applicable: (income) => income > 500000
  },
  {
    name: "Education Loan Interest",
    description: "Deduction under Section 80E",
    limit: "No limit",
    applicable: (income) => income > 400000
  }
];

export const IndiaTaxCalculator = () => {
  const [income, setIncome] = useState(500000);
  const [ageBracket, setAgeBracket] = useState('below60');
  const [taxRegime, setTaxRegime] = useState('old');
  const [deductions, setDeductions] = useState({
    section80C: 0,
    nps: 0,
    healthInsurance: 0
  });
  const [taxResult, setTaxResult] = useState(null);

  useEffect(() => {
    const result = calculateTax(income, { 
      ...deductions, 
      standardDeduction: DEDUCTION_LIMITS.standardDeduction 
    }, ageBracket, taxRegime);
    setTaxResult(result);
  }, [income, deductions, ageBracket, taxRegime]);

  const handleDeductionChange = (name, value) => {
    setDeductions(prev => ({
      ...prev,
      [name]: Math.min(value, DEDUCTION_LIMITS[name])
    }));
  };

  const chartData = {
    labels: ['Tax', 'Net Income'],
    datasets: [
      {
        data: taxResult ? [taxResult.tax, taxResult.netIncome] : [0, 100],
        backgroundColor: ['#FF6384', '#36A2EB'],
        hoverBackgroundColor: ['#FF6384', '#36A2EB']
      }
    ]
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100 p-4 space-y-4 lg:space-y-0 lg:space-x-4">
      <div className="lg:w-2/3 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Income Details</h2>
          <TaxInputSlider
            label="Annual Income"
            value={income}
            setValue={setIncome}
            min={0}
            max={10000000}
            step={10000}
            currencySymbol="₹"
          />
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Age Bracket</label>
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
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Tax Regime</label>
            <div className="flex space-x-2">
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
          </div>
        </div>

        {taxRegime === 'old' && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Deductions</h2>
            {Object.entries(deductions).map(([name, value]) => (
              <TaxInputSlider
                key={name}
                label={name.charAt(0).toUpperCase() + name.slice(1)}
                value={value}
                setValue={(newValue) => handleDeductionChange(name, newValue)}
                min={0}
                max={DEDUCTION_LIMITS[name]}
                step={1000}
                currencySymbol="₹"
              />
            ))}
          </div>
        )}

        {taxResult && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Tax Calculation Results</h2>
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

      <div className="lg:w-1/3 space-y-4">
        {taxResult && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Tax Breakdown</h2>
            <Doughnut data={chartData} />
          </div>
        )}

        {taxRegime === 'old' && (
          <div className="bg-white p-4 rounded-lg shadow overflow-y-auto" style={{maxHeight: "calc(100vh - 450px)"}}>
            <h2 className="text-xl font-semibold mb-4">Tax Saving Suggestions</h2>
            <div className="space-y-4">
              {TAX_SAVING_SUGGESTIONS.filter(s => s.applicable(income)).map((suggestion, index) => (
                <div key={index} className="bg-blue-50 p-3 rounded">
                  <h3 className="font-medium">{suggestion.name}</h3>
                  <p className="text-sm text-gray-600">{suggestion.description}</p>
                  <p className="text-sm text-gray-600">
                    Limit: {typeof suggestion.limit === 'number' ? `₹${suggestion.limit.toLocaleString()}` : suggestion.limit}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Note: These are general suggestions. Please consult a tax professional for personalized advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};