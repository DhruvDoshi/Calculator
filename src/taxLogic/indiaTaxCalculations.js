export const calculateIndiaTax = (income, taxBrackets, countrySpecificData) => {
  if (!taxBrackets || !taxBrackets.brackets) {
    throw new Error('Invalid tax bracket data');
  }

  const { brackets } = taxBrackets;
  let tax = 0;
  let remainingIncome = income;

  // Calculate basic tax
  for (const bracket of brackets) {
    if (remainingIncome > 0) {
      const taxableAmount = Math.min(remainingIncome, bracket.max - bracket.min);
      tax += taxableAmount * bracket.rate;
      remainingIncome -= taxableAmount;
    } else {
      break;
    }
  }

  // Apply deductions
  const deductions = {
    standardDeduction: 50000,
    section80C: Math.min(countrySpecificData.section80C || 0, 150000),
    nps: Math.min(countrySpecificData.nps || 0, 50000),
    healthInsurance: Math.min(countrySpecificData.healthInsurance || 0, 25000),
  };

  const totalDeductions = Object.values(deductions).reduce((sum, value) => sum + value, 0);
  const taxableIncome = Math.max(0, income - totalDeductions);

  // Recalculate tax with deductions
  tax = 0;
  remainingIncome = taxableIncome;
  for (const bracket of brackets) {
    if (remainingIncome > 0) {
      const taxableAmount = Math.min(remainingIncome, bracket.max - bracket.min);
      tax += taxableAmount * bracket.rate;
      remainingIncome -= taxableAmount;
    } else {
      break;
    }
  }

  const netIncome = income - tax;
  const effectiveTaxRate = (tax / income) * 100;

  return {
    deductions,
    taxableIncome,
    tax,
    netIncome,
    effectiveTaxRate,
  };
};

export const getIndiaIncomeRange = () => ({
  min: 0,
  max: 10000000,
  step: 10000,
});

export const getIndiaSpecificFields = () => [
  { name: 'section80C', label: '80C Investments', min: 0, max: 150000, step: 1000 },
  { name: 'nps', label: 'NPS Investment', min: 0, max: 50000, step: 1000 },
  { name: 'healthInsurance', label: 'Health Insurance Premium', min: 0, max: 25000, step: 1000 },
];
