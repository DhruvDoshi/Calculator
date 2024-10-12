import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DraggableSlider from './DraggableSlider';

const TaxCalculator = () => {
  const [income, setIncome] = useState(52000);
  const [province, setProvince] = useState('Ontario');
  const [taxResult, setTaxResult] = useState(null);

  const provinces = useMemo(() => [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
    'Newfoundland and Labrador', 'Nova Scotia', 'Ontario',
    'Prince Edward Island', 'Quebec', 'Saskatchewan',
    'Yukon', 'Northwest Territories', 'Nunavut'
  ], []);

  // Federal tax brackets for 2024
  const federalBrackets = useMemo(() => [
    { min: 0, max: 55867, rate: 0.15 },
    { min: 55867, max: 111733, rate: 0.205 },
    { min: 111733, max: 173205, rate: 0.26 },
    { min: 173205, max: 246752, rate: 0.29 },
    { min: 246752, max: Infinity, rate: 0.33 }
  ], []);

  // Provincial tax brackets for 2024
  const provincialBrackets = useMemo(() => ({
    'Ontario': [
      { min: 0, max: 51446, rate: 0.0505 },
      { min: 51446, max: 102894, rate: 0.0915 },
      { min: 102894, max: 150000, rate: 0.1116 },
      { min: 150000, max: 220000, rate: 0.1216 },
      { min: 220000, max: Infinity, rate: 0.1316 }
    ],
    'British Columbia': [
      { min: 0, max: 47937, rate: 0.0506 },
      { min: 47937, max: 95875, rate: 0.077 },
      { min: 95875, max: 110076, rate: 0.105 },
      { min: 110076, max: 133664, rate: 0.1229 },
      { min: 133664, max: 181232, rate: 0.147 },
      { min: 181232, max: 252752, rate: 0.168 },
      { min: 252752, max: Infinity, rate: 0.205 }
    ],
    'Alberta': [
      { min: 0, max: 148269, rate: 0.10 },
      { min: 148269, max: 177922, rate: 0.12 },
      { min: 177922, max: 237230, rate: 0.13 },
      { min: 237230, max: 355845, rate: 0.14 },
      { min: 355845, max: Infinity, rate: 0.15 }
    ],
    'Saskatchewan': [
      { min: 0, max: 52057, rate: 0.105 },
      { min: 52057, max: 148734, rate: 0.125 },
      { min: 148734, max: Infinity, rate: 0.145 }
    ],
    'Manitoba': [
      { min: 0, max: 47000, rate: 0.108 },
      { min: 47000, max: 100000, rate: 0.1275 },
      { min: 100000, max: Infinity, rate: 0.174 }
    ],
    'Quebec': [
      { min: 0, max: 51780, rate: 0.14 },
      { min: 51780, max: 103545, rate: 0.19 },
      { min: 103545, max: 126000, rate: 0.24 },
      { min: 126000, max: Infinity, rate: 0.2575 }
    ],
    'New Brunswick': [
      { min: 0, max: 49958, rate: 0.094 },
      { min: 49958, max: 99916, rate: 0.14 },
      { min: 99916, max: 185064, rate: 0.16 },
      { min: 185064, max: Infinity, rate: 0.195 }
    ],
    'Nova Scotia': [
      { min: 0, max: 29590, rate: 0.0879 },
      { min: 29590, max: 59180, rate: 0.1495 },
      { min: 59180, max: 93000, rate: 0.1667 },
      { min: 93000, max: 150000, rate: 0.175 },
      { min: 150000, max: Infinity, rate: 0.21 }
    ],
    'Prince Edward Island': [
      { min: 0, max: 32656, rate: 0.0965 },
      { min: 32656, max: 64313, rate: 0.1363 },
      { min: 64313, max: 105000, rate: 0.1665 },
      { min: 105000, max: 140000, rate: 0.18 },
      { min: 140000, max: Infinity, rate: 0.1875 }
    ],
    'Newfoundland and Labrador': [
      { min: 0, max: 43198, rate: 0.087 },
      { min: 43198, max: 86395, rate: 0.145 },
      { min: 86395, max: 154244, rate: 0.158 },
      { min: 154244, max: 215943, rate: 0.178 },
      { min: 215943, max: 275870, rate: 0.198 },
      { min: 275870, max: 551739, rate: 0.208 },
      { min: 551739, max: 1103478, rate: 0.213 },
      { min: 1103478, max: Infinity, rate: 0.218 }
    ],
    'Yukon': [
      { min: 0, max: 55867, rate: 0.064 },
      { min: 55867, max: 111733, rate: 0.09 },
      { min: 111733, max: 173205, rate: 0.109 },
      { min: 173205, max: 500000, rate: 0.128 },
      { min: 500000, max: Infinity, rate: 0.15 }
    ],
    'Northwest Territories': [
      { min: 0, max: 50597, rate: 0.059 },
      { min: 50597, max: 101198, rate: 0.086 },
      { min: 101198, max: 164525, rate: 0.122 },
      { min: 164525, max: Infinity, rate: 0.1405 }
    ],
    'Nunavut': [
      { min: 0, max: 53268, rate: 0.04 },
      { min: 53268, max: 106537, rate: 0.07 },
      { min: 106537, max: 173205, rate: 0.09 },
      { min: 173205, max: Infinity, rate: 0.115 }
    ]
  }), []);

  const calculateTaxForBrackets = useCallback((income, brackets) => {
    let tax = 0;
    let remainingIncome = income;

    for (const bracket of brackets) {
      if (remainingIncome > 0) {
        const taxableAmount = Math.min(remainingIncome, bracket.max - bracket.min);
        tax += taxableAmount * bracket.rate;
        remainingIncome -= taxableAmount;
      } else {
        break;
      }
    }

    return tax;
  }, []);

  const calculateCPP = useCallback((income) => {
    const maxContributionIncome = 68500; // 2024 maximum pensionable earnings
    const basicExemptionAmount = 3500;
    const contributionRate = 0.0595; // 5.95% for 2024
    const contributableIncome = Math.min(Math.max(income - basicExemptionAmount, 0), maxContributionIncome - basicExemptionAmount);
    return contributableIncome * contributionRate;
  }, []);

  const calculateEI = useCallback((income) => {
    const maxInsurableEarnings = 63200; // 2024 maximum insurable earnings
    const contributionRate = 0.0163; // 1.63% for 2024
    return Math.min(income, maxInsurableEarnings) * contributionRate;
  }, []);

  const calculateTax = useCallback(() => {
    const federalTax = calculateTaxForBrackets(income, federalBrackets);
    const provincialTax = calculateTaxForBrackets(income, provincialBrackets[province] || []);
    const cpp = calculateCPP(income);
    const ei = calculateEI(income);

    const totalDeductions = federalTax + provincialTax + cpp + ei;
    const netIncome = income - totalDeductions;

    const marginalFederalRate = federalBrackets.find(bracket => income <= bracket.max)?.rate || federalBrackets[federalBrackets.length - 1].rate;
    const marginalProvincialRate = provincialBrackets[province]?.find(bracket => income <= bracket.max)?.rate || provincialBrackets[province]?.[provincialBrackets[province].length - 1].rate || 0;
    const marginalTaxRate = (marginalFederalRate + marginalProvincialRate) * 100;

    setTaxResult({
      federalTax: federalTax.toFixed(2),
      provincialTax: provincialTax.toFixed(2),
      cpp: cpp.toFixed(2),
      ei: ei.toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
      netIncome: netIncome.toFixed(2),
      averageTaxRate: ((totalDeductions / income) * 100).toFixed(2),
      marginalTaxRate: marginalTaxRate.toFixed(2)
    });
  }, [income, province, calculateTaxForBrackets, calculateCPP, calculateEI, federalBrackets, provincialBrackets]);

  useEffect(() => {
    calculateTax();
  }, [calculateTax]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Income Tax Calculator (2024)</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <DraggableSlider
          label="Annual Income"
          value={income}
          setValue={setIncome}
          min={0}
          max={500000}
          step={1000}
          currencySymbol="$"
        />
        <select
          className="mt-4 w-full p-2 border rounded"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
        >
          {provinces.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {taxResult && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold">Deductions</h2>
              <p>Federal Tax: ${taxResult.federalTax}</p>
              <p>Provincial Tax: ${taxResult.provincialTax}</p>
              <p>CPP: ${taxResult.cpp}</p>
              <p>EI: ${taxResult.ei}</p>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Results</h2>
              <p>Total Deductions: ${taxResult.totalDeductions}</p>
              <p>Net Income: ${taxResult.netIncome}</p>
              <p>Average Tax Rate: {taxResult.averageTaxRate}%</p>
              <p>Marginal Tax Rate: {taxResult.marginalTaxRate}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxCalculator;