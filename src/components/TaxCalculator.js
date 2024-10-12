import React, { useState, useEffect, useCallback } from 'react';
import DraggableSlider from './DraggableSlider';
import countries from '../data/countries.json';
import regions from '../data/regions.json';
import { getTaxCalculator } from '../taxLogic';

const TaxCalculator = () => {
  const [country, setCountry] = useState('Canada');
  const [region, setRegion] = useState('');
  const [income, setIncome] = useState(167000);
  const [taxResult, setTaxResult] = useState(null);
  const [taxData, setTaxData] = useState(null);

  useEffect(() => {
    const loadTaxData = async () => {
      if (country) {
        try {
          const module = await import(`../data/taxBrackets/${country.toLowerCase().replace(' ', '')}.json`);
          setTaxData(module.default);
          setRegion('');
        } catch (error) {
          console.error(`Failed to load data for ${country}`, error);
          setTaxData(null);
        }
      }
    };

    loadTaxData();
  }, [country]);

  const calculateTax = useCallback(() => {
    if (!taxData || !country || (regions[country] && regions[country].length > 0 && !region)) {
      setTaxResult(null);
      return;
    }

    const taxCalculator = getTaxCalculator(country);
    if (taxCalculator) {
      const result = taxCalculator(income, region, taxData);
      setTaxResult(result);
    } else {
      setTaxResult(null);
    }
  }, [country, region, income, taxData]);

  useEffect(() => {
    calculateTax();
  }, [calculateTax]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Income Tax Calculator (2024)</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <select
            className="w-full p-2 border rounded"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {regions[country] && regions[country].length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {country === 'Canada' ? 'Province' : 'State'}
            </label>
            <select
              className="w-full p-2 border rounded"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">Select a {country === 'Canada' ? 'province' : 'state'}</option>
              {regions[country].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        )}

        <DraggableSlider
          label="Annual Income"
          value={income}
          setValue={setIncome}
          min={0}
          max={500000}
          step={1000}
          currencySymbol="$"
        />

        {taxResult && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold">Deductions</h2>
              <p>Federal Tax: ${taxResult.federalTax}</p>
              {country === 'Canada' ? (
                <>
                  <p>Provincial Tax: ${taxResult.provincialTax}</p>
                  <p>CPP: ${taxResult.cpp}</p>
                  <p>EI: ${taxResult.ei}</p>
                </>
              ) : (
                <p>State Tax: ${taxResult.stateTax}</p>
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold">Results</h2>
              <p>Total Tax: ${taxResult.totalTax}</p>
              <p>Net Income: ${taxResult.netIncome}</p>
              <p>Effective Tax Rate: {taxResult.effectiveTaxRate}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaxCalculator;
