import { calculateCanadianTax, getCanadaSpecificFields, getCanadaIncomeRange } from './canadaTaxCalculations';
import { calculateUSATax, getUSASpecificFields, getUSAIncomeRange } from './usaTaxCalculations';
import { calculateIndiaTax, getIndiaSpecificFields, getIndiaIncomeRange } from './indiaTaxCalculations';

export const getTaxCalculator = (country) => {
  switch (country) {
    case 'Canada':
      return calculateCanadianTax;
    case 'United States':
      return calculateUSATax;
    case 'India':
      return calculateIndiaTax;
    default:
      return null;
  }
};

export const getCountrySpecificFields = (country) => {
  switch (country) {
    case 'Canada':
      return getCanadaSpecificFields();
    case 'United States':
      return getUSASpecificFields();
    case 'India':
      return getIndiaSpecificFields();
    default:
      return [];
  }
};

export const getIncomeRange = (country) => {
  switch (country) {
    case 'Canada':
      return getCanadaIncomeRange();
    case 'United States':
      return getUSAIncomeRange();
    case 'India':
      return getIndiaIncomeRange();
    default:
      return { min: 0, max: 500000, step: 1000 };
  }
};
