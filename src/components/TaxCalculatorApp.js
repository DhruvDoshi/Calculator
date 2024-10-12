import React, { useState } from 'react';
import countries from '../data/countries.json';
import { IndiaTaxCalculator } from './countries/IndiaTaxCalculator';
import { CanadaTaxCalculator } from './countries/CanadaTaxCalculator';
import { USATaxCalculator } from './countries/USATaxCalculator';

const TaxCalculatorApp = () => {
  const [country, setCountry] = useState('India');
  const [income, setIncome] = useState(500000);
  const [region, setRegion] = useState('');
  const [countrySpecificData, setCountrySpecificData] = useState({});
  const [taxResult, setTaxResult] = useState(null);

  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    setRegion('');
    setCountrySpecificData({});
    setTaxResult(null);
  };

  const renderCountryComponent = () => {
    const props = { 
      income, 
      setIncome, 
      region, 
      setRegion, 
      countrySpecificData, 
      setCountrySpecificData, 
      taxResult, 
      setTaxResult 
    };
    switch (country) {
      case 'India':
        return <IndiaTaxCalculator {...props} />;
      case 'Canada':
        return <CanadaTaxCalculator {...props} />;
      case 'United States':
        return <USATaxCalculator {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Income Tax Calculator (2024)</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <select
            className="w-full p-2 border rounded"
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
          >
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {renderCountryComponent()}
      </div>
    </div>
  );
};

export default TaxCalculatorApp;
