import { calculateCanadianTax } from './canada';
import { calculateUSATax } from './usa';
import { calculateIndiaTax } from './india';

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
