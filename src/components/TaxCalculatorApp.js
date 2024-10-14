import React, { useState } from 'react';
import countries from '../data/countries.json';
import { IndiaTaxCalculator } from './countries/IndiaTaxCalculator';
import { CanadaTaxCalculator } from './countries/CanadaTaxCalculator';
import { USATaxCalculator } from './countries/USATaxCalculator';

const TaxCalculatorApp = () => {
  const [country, setCountry] = useState('');
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
    <div className="max-w-10xl mx-auto p-2">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="mb-6 flex flex-wrap gap-2">
          {countries.map(c => (
            <button
              key={c}
              className={`px-4 py-2 rounded-md transition-colors ${
                country === c
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => handleCountryChange(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {country && renderCountryComponent()}
      </div>
    </div>
  );
};

export default TaxCalculatorApp;
