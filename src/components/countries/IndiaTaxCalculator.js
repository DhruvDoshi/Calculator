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
  section80D: 25000,
  section80E: Infinity,
  section80TTA: 10000,
  section24b: 200000
};

// Calculate tax
const calculateTax = (income, deductions, ageBracket, taxRegime) => {
  let taxableIncome = income;
  let tax = 0;

  if (taxRegime === 'old') {
    // Apply deductions for old regime
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + val, 0);
    taxableIncome = Math.max(0, income - totalDeductions);

    let brackets = taxBrackets.oldRegime[ageBracket];
    console.log('Selected Brackets:', brackets);

    if (!brackets || !Array.isArray(brackets)) {
      console.error('Invalid brackets for age bracket:', ageBracket);
      return { taxableIncome, tax: 0, netIncome: income, effectiveTaxRate: 0 };
    }

    // Calculate tax
    for (const bracket of brackets) {
      if (taxableIncome > bracket.min) {
        const taxableAmount = Math.min(taxableIncome - bracket.min, (bracket.max || Infinity) - bracket.min);
        tax += taxableAmount * bracket.rate;
      }
    }
  } else {
    // New regime calculation (no deductions)
    let brackets = taxBrackets.newRegime;
    console.log('New Regime Brackets:', brackets);

    // Check if brackets is defined and is an array
    if (!Array.isArray(brackets)) {
      console.error('Invalid brackets:', brackets);
      return { taxableIncome, tax: 0, netIncome: income, effectiveTaxRate: 0 };
    }

    for (const bracket of brackets) {
      if (taxableIncome > bracket.min) {
        const taxableAmount = Math.min(taxableIncome - bracket.min, (bracket.max || Infinity) - bracket.min);
        tax += taxableAmount * bracket.rate;
      }
    }
  }

  // Apply rebate under Section 87A
  if (taxableIncome <= 500000) {
    tax = Math.max(0, tax - 12500);
  }

  // Apply surcharge
  if (taxableIncome > 5000000 && taxableIncome <= 10000000) {
    tax *= 1.10;
  } else if (taxableIncome > 10000000 && taxableIncome <= 20000000) {
    tax *= 1.15;
  } else if (taxableIncome > 20000000 && taxableIncome <= 50000000) {
    tax *= 1.25;
  } else if (taxableIncome > 50000000) {
    tax *= 1.37;
  }

  // Apply health and education cess
  tax *= 1.04;

  return {
    taxableIncome,
    tax,
    netIncome: income - tax,
    effectiveTaxRate: (tax / income) * 100
  };
};

export const IndiaTaxCalculator = () => {
  const [income, setIncome] = useState(500000);
  const [ageBracket, setAgeBracket] = useState('below60');
  const [taxRegime, setTaxRegime] = useState('old');
  const [deductions, setDeductions] = useState({
    section80C: 0,
    section80D: 0,
    section80E: 0,
    section80TTA: 0,
    section24b: 0
  });
  const [taxResult, setTaxResult] = useState(null);

  useEffect(() => {
    const result = calculateTax(income, deductions, ageBracket, taxRegime);
    setTaxResult(result);
  }, [income, deductions, ageBracket, taxRegime]);

  useEffect(() => {
    console.log('Tax Brackets on mount:', taxBrackets);
  }, []);

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

  const chartOptions = {
    cutout: '70%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(context.parsed);
            }
            return label;
          }
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const ageBracketOptions = [
    { label: 'Below 60', value: 'below60' },
    { label: '60 to 80', value: '60to80' },  // Change this line
    { label: 'Above 80', value: 'above80' }
  ];

  return (
    <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
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
              {ageBracketOptions.map((age) => (
                <button
                  key={age.value}
                  className={`flex-1 px-4 py-2 rounded-md text-sm ${
                    ageBracket === age.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setAgeBracket(age.value)}
                >
                  {age.label}
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
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            <h2 className="text-xl font-semibold mb-4">Deductions</h2>
            {Object.entries(deductions).map(([name, value]) => (
              <TaxInputSlider
                key={name}
                label={name.replace('section', 'Section ')}
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

      <div className="lg:w-1/3">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Tax Breakdown</h2>
          <div className="h-64">
            <Doughnut data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};
