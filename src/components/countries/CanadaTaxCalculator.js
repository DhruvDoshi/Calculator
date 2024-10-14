import React, { useState, useEffect } from 'react';
import TaxInputSlider from '../TaxInputSlider';
import canadaTaxRates from '../../data/taxRates/canadaTaxRates.json';
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

const calculateCanadianTax = (income, province) => {
  if (!canadaTaxRates.federal || !canadaTaxRates.provincial || !canadaTaxRates.provincial[province]) {
    console.error('Invalid tax data for Canada');
    return null;
  }

  const federalTax = calculateTaxForBrackets(income, canadaTaxRates.federal);
  const provincialTax = calculateTaxForBrackets(income, canadaTaxRates.provincial[province]);
  
  const { maxContributionIncome, basicExemptionAmount, contributionRate } = canadaTaxRates.cpp;
  const contributableIncome = Math.min(Math.max(income - basicExemptionAmount, 0), maxContributionIncome - basicExemptionAmount);
  const cpp = contributableIncome * contributionRate;

  const { maxInsurableEarnings, contributionRate: eiRate } = canadaTaxRates.ei;
  const ei = Math.min(income, maxInsurableEarnings) * eiRate;

  const totalTax = federalTax + provincialTax + cpp + ei;
  const netIncome = income - totalTax;
  const effectiveTaxRate = (totalTax / income) * 100;

  return {
    federalTax: federalTax.toFixed(2),
    provincialTax: provincialTax.toFixed(2),
    cpp: cpp.toFixed(2),
    ei: ei.toFixed(2),
    totalTax: totalTax.toFixed(2),
    netIncome: netIncome.toFixed(2),
    effectiveTaxRate: effectiveTaxRate.toFixed(2)
  };
};

export const CanadaTaxCalculator = () => {
  const [income, setIncome] = useState(50000);
  const [province, setProvince] = useState('');
  const [taxResult, setTaxResult] = useState(null);

  useEffect(() => {
    if (province) {
      const result = calculateCanadianTax(income, province);
      setTaxResult(result);
    }
  }, [income, province]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Canada Tax Calculator</h1>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
        <select
          className="w-full p-2 border rounded"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        >
          <option value="">Select a province</option>
          {regions['Canada'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <TaxInputSlider
        label="Annual Income"
        value={income}
        setValue={setIncome}
        min={0}
        max={500000}
        step={1000}
        currencySymbol="$"
      />

      {taxResult && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">Tax Calculation Results</h2>
          <p>Federal Tax: ${taxResult.federalTax}</p>
          <p>Provincial Tax: ${taxResult.provincialTax}</p>
          <p>Canada Pension Plan (CPP): ${taxResult.cpp}</p>
          <p>Employment Insurance (EI): ${taxResult.ei}</p>
          <p>Total Tax: ${taxResult.totalTax}</p>
          <p>Net Income: ${taxResult.netIncome}</p>
          <p>Effective Tax Rate: {taxResult.effectiveTaxRate}%</p>
        </div>
      )}
    </div>
  );
};