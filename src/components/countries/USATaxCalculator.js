import React, { useEffect, useState } from 'react';
import TaxInputSlider from '../TaxInputSlider';
import { getUSASpecificFields, getUSAIncomeRange, calculateUSATax } from '../../taxLogic/usaTaxCalculations';
import regions from '../../data/regions.json';

export const USATaxCalculator = ({ income, setIncome, region, setRegion, countrySpecificData, setCountrySpecificData }) => {
  const [taxResult, setTaxResult] = useState(null);
  const incomeRange = getUSAIncomeRange();
  const countrySpecificFields = getUSASpecificFields();

  useEffect(() => {
    const loadTaxData = async () => {
      try {
        const taxRates = await import('../../data/taxRates/usaTaxRates.json');
        const result = calculateUSATax(income, region, taxRates.default, countrySpecificData);
        setTaxResult(result);
      } catch (error) {
        console.error('Failed to calculate USA tax:', error);
        setTaxResult(null);
      }
    };

    if (region) {
      loadTaxData();
    }
  }, [income, region, countrySpecificData]);

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
        <select
          className="w-full p-2 border rounded"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
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
        min={incomeRange.min}
        max={incomeRange.max}
        step={incomeRange.step}
        currencySymbol="$"
        currentYear={new Date().getFullYear()}
        showYear={false}
      />

      {countrySpecificFields.map(field => (
        <TaxInputSlider
          key={field.name}
          label={field.label}
          value={countrySpecificData[field.name] || 0}
          setValue={(value) => setCountrySpecificData(prev => ({ ...prev, [field.name]: value }))}
          min={field.min}
          max={field.max}
          step={field.step}
          currencySymbol="$"
          currentYear={new Date().getFullYear()}
          showYear={false}
        />
      ))}

      {taxResult && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold">Deductions</h2>
            {Object.entries(taxResult)
              .filter(([key]) => !['netIncome', 'effectiveTaxRate'].includes(key))
              .map(([key, value]) => (
                <p key={key}>{key}: ${value}</p>
              ))}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Results</h2>
            <p>Net Income: ${taxResult.netIncome}</p>
            <p>Effective Tax Rate: {taxResult.effectiveTaxRate}%</p>
          </div>
        </div>
      )}
    </>
  );
};
