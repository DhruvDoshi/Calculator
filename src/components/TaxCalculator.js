import React, { useState, useEffect, useCallback } from 'react';
import DraggableSlider from './DraggableSlider';
import IndiaTaxSavings from './IndiaTaxSavings';
import countries from '../data/countries.json';
import regions from '../data/regions.json';
import { getTaxCalculator, getCountrySpecificFields, getIncomeRange } from '../taxLogic';

const TaxCalculator = () => {
  const [country, setCountry] = useState('India');
  const [region, setRegion] = useState('');
  const [income, setIncome] = useState(500000);
  const [taxResult, setTaxResult] = useState(null);
  const [taxData, setTaxData] = useState(null);
  const [countrySpecificData, setCountrySpecificData] = useState({});

  useEffect(() => {
    const loadTaxData = async () => {
      if (country) {
        try {
          const module = await import(`../data/taxBrackets/${country.toLowerCase().replace(' ', '')}.json`);
          setTaxData(module.default);
          setRegion(''); // Reset region when country changes
          setCountrySpecificData({});
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
      const result = taxCalculator(income, region, taxData, countrySpecificData);
      setTaxResult(result);
    } else {
      setTaxResult(null);
    }
  }, [country, region, income, taxData, countrySpecificData]);

  useEffect(() => {
    calculateTax();
  }, [calculateTax]);

  const incomeRange = getIncomeRange(country);
  const countrySpecificFields = getCountrySpecificFields(country);

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
          min={incomeRange.min}
          max={incomeRange.max}
          step={incomeRange.step}
          currencySymbol={country === 'India' ? '₹' : '$'}
          currentYear={new Date().getFullYear()}
          showYear={false}
        />

        {countrySpecificFields.map(field => (
          <DraggableSlider
            key={field.name}
            label={field.label}
            value={countrySpecificData[field.name] || 0}
            setValue={(value) => setCountrySpecificData(prev => ({ ...prev, [field.name]: value }))}
            min={field.min}
            max={field.max}
            step={field.step}
            currencySymbol={country === 'India' ? '₹' : '$'}
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
                  <p key={key}>{key}: {country === 'India' ? '₹' : '$'}{value}</p>
                ))}
            </div>
            <div>
              <h2 className="text-lg font-semibold">Results</h2>
              <p>Net Income: {country === 'India' ? '₹' : '$'}{taxResult.netIncome}</p>
              <p>Effective Tax Rate: {taxResult.effectiveTaxRate}%</p>
            </div>
          </div>
        )}

        {country === 'India' && <IndiaTaxSavings income={income} />}
      </div>
    </div>
  );
};

export default TaxCalculator;