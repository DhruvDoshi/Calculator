import React, { useEffect, useState } from 'react';
import TaxInputSlider from '../TaxInputSlider';
import IndiaTaxSavingsSuggestions from '../IndiaTaxSavingsSuggestions';
import { calculateIndiaTax, getIndiaSpecificFields, getIndiaIncomeRange } from '../../taxLogic/indiaTaxCalculations';

export const IndiaTaxCalculator = ({ income, setIncome, countrySpecificData, setCountrySpecificData }) => {
  const [taxResult, setTaxResult] = useState(null);
  const incomeRange = getIndiaIncomeRange();
  const countrySpecificFields = getIndiaSpecificFields();

  useEffect(() => {
    const calculateTax = async () => {
      try {
        const taxRates = await import('../../data/taxRates/indiaTaxRates.json');
        const result = calculateIndiaTax(income, taxRates.default, countrySpecificData);
        setTaxResult(result);
      } catch (error) {
        console.error('Failed to calculate Indian tax:', error);
        setTaxResult(null);
      }
    };

    calculateTax();
  }, [income, countrySpecificData]);

  return (
    <>
      <TaxInputSlider
        label="Annual Income"
        value={income}
        setValue={setIncome}
        min={incomeRange.min}
        max={incomeRange.max}
        step={incomeRange.step}
        currencySymbol="₹"
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
          currencySymbol="₹"
          currentYear={new Date().getFullYear()}
          showYear={false}
        />
      ))}

      {taxResult && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold">Deductions</h2>
            {Object.entries(taxResult.deductions).map(([key, value]) => (
              <p key={key}>{key}: ₹{value.toLocaleString()}</p>
            ))}
          </div>
          <div>
            <h2 className="text-lg font-semibold">Results</h2>
            <p>Net Income: ₹{taxResult.netIncome.toLocaleString()}</p>
            <p>Effective Tax Rate: {taxResult.effectiveTaxRate.toFixed(2)}%</p>
          </div>
        </div>
      )}

      <IndiaTaxSavingsSuggestions income={income} />
    </>
  );
};
