import React, { useState, useEffect } from 'react';
import TaxInputSlider from '../TaxInputSlider';
import usaTaxRates from '../../data/taxRates/usaTaxRates.json';
import regions from '../../data/regions.json';

const calculateTaxForBrackets = (income, brackets) => {
  let tax = 0;
  let remainingIncome = income;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    
    const taxableAmount = Math.min(remainingIncome, (bracket.max || Infinity) - bracket.min);
    tax += taxableAmount * bracket.rate;
    remainingIncome -= taxableAmount;
  }

  return tax;
};

const calculateUSATax = (income, state) => {
  if (!usaTaxRates.federal || !usaTaxRates.state || !usaTaxRates.state[state]) {
    console.error('Invalid tax data for USA');
    return null;
  }

  const federalTax = calculateTaxForBrackets(income, usaTaxRates.federal);
  const stateTax = calculateTaxForBrackets(income, usaTaxRates.state[state]);

  const totalTax = federalTax + stateTax;
  const netIncome = income - totalTax;
  const effectiveTaxRate = (totalTax / income) * 100;

  return {
    federalTax: federalTax.toFixed(2),
    stateTax: stateTax.toFixed(2),
    totalTax: totalTax.toFixed(2),
    netIncome: netIncome.toFixed(2),
    effectiveTaxRate: effectiveTaxRate.toFixed(2)
  };
};

export const USATaxCalculator = () => {
  const [income, setIncome] = useState(50000);
  const [state, setState] = useState('');
  const [taxResult, setTaxResult] = useState(null);

  useEffect(() => {
    if (state) {
      const result = calculateUSATax(income, state);
      setTaxResult(result);
    }
  }, [income, state]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">USA Tax Calculator</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
        <select
          className="w-full p-2 border rounded"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="">Select a state</option>
          {regions['United States'].map(state => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </div>

      <TaxInputSlider
        label="Annual Income"
        value={income}
        setValue={setIncome}
        min={0}
        max={1000000}
        step={1000}
        currencySymbol="$"
      />

      {taxResult && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Tax Calculation Results</h2>
          <p>Federal Tax: ${taxResult.federalTax}</p>
          <p>State Tax: ${taxResult.stateTax}</p>
          <p>Total Tax: ${taxResult.totalTax}</p>
          <p>Net Income: ${taxResult.netIncome}</p>
          <p>Effective Tax Rate: {taxResult.effectiveTaxRate}%</p>
        </div>
      )}
    </div>
  );
};