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
const calculateTax = (income, deductions) => {
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
    });
    setTaxResult(result);
  }, [income, deductions]);

  const handleDeductionChange = (name, value) => {
    setDeductions(prev => ({
      ...prev,
      [name]: Math.min(value, DEDUCTION_LIMITS[name])
    }));
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">India Tax Calculator</h1>
      
      <TaxInputSlider
        label="Annual Income"
        value={income}
        setValue={setIncome}
        min={0}
        max={10000000}
        step={10000}
        currencySymbol="₹"
      />

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

      {taxResult && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Tax Calculation Results</h2>
          <p>Taxable Income: ₹{taxResult.taxableIncome.toLocaleString()}</p>
          <p>Tax Amount: ₹{taxResult.tax.toLocaleString()}</p>
          <p>Net Income: ₹{taxResult.netIncome.toLocaleString()}</p>
          <p>Effective Tax Rate: {taxResult.effectiveTaxRate.toFixed(2)}%</p>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-3">Tax Saving Suggestions</h2>
        <ul className="space-y-2">
          {TAX_SAVING_SUGGESTIONS.filter(s => s.applicable(income)).map((suggestion, index) => (
            <li key={index} className="bg-blue-50 p-3 rounded">
              <h3 className="font-medium">{suggestion.name}</h3>
              <p className="text-sm text-gray-600">{suggestion.description}</p>
              <p className="text-sm text-gray-600">
                Limit: {typeof suggestion.limit === 'number' ? `₹${suggestion.limit.toLocaleString()}` : suggestion.limit}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-gray-500">
          Note: These are general suggestions. Please consult a tax professional for personalized advice.
        </p>
      </div>
    </div>
  );
};