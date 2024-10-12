import { calculateCanadianTax } from './canada';
import { calculateUSATax } from './usa';

export const getTaxCalculator = (country) => {
  switch (country) {
    case 'Canada':
      return calculateCanadianTax;
    case 'United States':
      return calculateUSATax;
    default:
      return null;
  }
};
