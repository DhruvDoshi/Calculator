import React, { useState, useEffect } from 'react';
import TaxInputSlider from '../TaxInputSlider';
import taxBrackets from '../../data/taxRates/indiaTaxRates.json';

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
  const [ageBracket, setAgeBracket] = useState('');
  const [taxRegime, setTaxRegime] = useState('');
  const [deductions, setDeductions] = useState({
    section80C: 0,
    nps: 0,
    healthInsurance: 0
  });
  const [taxResult, setTaxResult] = useState(null);

  useEffect(() => {
    if (income && ageBracket && taxRegime) {
      const result = calculateTax(income, { 
        ...deductions, 
        standardDeduction: DEDUCTION_LIMITS.standardDeduction 
      }, ageBracket, taxRegime);
      setTaxResult(result);
    }
  }, [income, deductions, ageBracket, taxRegime]);

  const handleDeductionChange = (name, value) => {
    setDeductions(prev => ({
      ...prev,
      [name]: Math.min(value, DEDUCTION_LIMITS[name])
    }));
  };

  const ButtonGroup = ({ label, options, selectedValue, onChange }) => (
    <div className="flex-1">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex space-x-2">
        {options.map((option) => (
          <button
            key={option.value}
            className={`px-4 py-2 rounded-md text-sm ${
              selectedValue === option.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      {/* Income Input */}
      <div className="flex flex-col">
        <TaxInputSlider
          label="Annual Income"
          value={income}
          setValue={setIncome}
          min={0}
          max={10000000}
          step={10000}
          currencySymbol="₹"
        />
      </div>

      {/* Age Bracket and Tax Regime Selection */}
      <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
        <ButtonGroup
          label="Age Bracket"
          options={[
            { value: 'below60', label: 'Below 60' },
            { value: '60to80', label: '60 to 80' },
            { value: 'above80', label: 'Above 80' },
          ]}
          selectedValue={ageBracket}
          onChange={setAgeBracket}
        />
        <ButtonGroup
          label="Tax Regime"
          options={[
            { value: 'old', label: 'Old Regime' },
            { value: 'new', label: 'New Regime' },
          ]}
          selectedValue={taxRegime}
          onChange={setTaxRegime}
        />
      </div>

      {/* Deductions (only show if Old Regime is selected) */}
      {taxRegime === 'old' && (
        <div className="flex flex-col md:flex-row md:space-x-4">
          {Object.entries(deductions).map(([name, value]) => (
            <div key={name} className="flex-1 mb-4 md:mb-0">
              <TaxInputSlider
                label={name.charAt(0).toUpperCase() + name.slice(1)}
                value={value}
                setValue={(newValue) => handleDeductionChange(name, newValue)}
                min={0}
                max={DEDUCTION_LIMITS[name]}
                step={1000}
                currencySymbol="₹"
              />
            </div>
          ))}
        </div>
      )}

      {/* Tax Calculation Results */}
      {taxResult && (
        <div className="flex flex-col bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Tax Calculation Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p>Taxable Income: <span className="font-medium">₹{taxResult.taxableIncome.toLocaleString()}</span></p>
            <p>Tax Amount: <span className="font-medium">₹{taxResult.tax.toLocaleString()}</span></p>
            <p>Net Income: <span className="font-medium">₹{taxResult.netIncome.toLocaleString()}</span></p>
            <p>Effective Tax Rate: <span className="font-medium">{taxResult.effectiveTaxRate.toFixed(2)}%</span></p>
          </div>
        </div>
      )}

      {/* Tax Saving Suggestions (only show if Old Regime is selected) */}
      {taxRegime === 'old' && (
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold mb-3">Tax Saving Suggestions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <p className="mt-3 text-sm text-gray-500">
            Note: These are general suggestions. Please consult a tax professional for personalized advice.
          </p>
        </div>
      )}
    </div>
  );
};
