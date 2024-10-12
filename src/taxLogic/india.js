export const calculateIndiaTax = (income, state, taxData, deductions) => {
  if (!taxData || !taxData.federal) {
    console.error('Invalid tax data for India');
    return null;
  }

  const { investment80C, npsInvestment, healthInsurance } = deductions;

  // Calculate total deductions
  const totalDeductions = Math.min(investment80C, 150000) + 
                          Math.min(npsInvestment, 50000) + 
                          Math.min(healthInsurance, 25000);

  // Calculate taxable income
  const taxableIncome = Math.max(income - totalDeductions, 0);

  const incomeTax = calculateTaxForBrackets(taxableIncome, taxData.federal);
  
  // India has a cess of 4% on the income tax
  const cess = incomeTax * 0.04;
  
  const totalTax = incomeTax + cess;
  const netIncome = income - totalTax;
  const effectiveTaxRate = (totalTax / income) * 100;

  return {
    incomeTax: incomeTax.toFixed(2),
    cess: cess.toFixed(2),
    totalDeductions: totalDeductions.toFixed(2),
    totalTax: totalTax.toFixed(2),
    netIncome: netIncome.toFixed(2),
    effectiveTaxRate: effectiveTaxRate.toFixed(2)
  };
};

const calculateTaxForBrackets = (income, brackets) => {
  let tax = 0;
  let remainingIncome = income;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;
    
    const taxableAmount = Math.min(remainingIncome, (bracket.max || Infinity) - bracket.min);
    tax += taxableAmount * bracket.rate;
    remainingIncome -= taxableAmount;
  }

  return tax;
};

export const getIndiaSpecificFields = () => [
  {
    name: 'investment80C',
    label: '80C Investments',
    min: 0,
    max: 150000,
    step: 1000,
  },
  {
    name: 'npsInvestment',
    label: 'NPS Investment',
    min: 0,
    max: 50000,
    step: 1000,
  },
  {
    name: 'healthInsurance',
    label: 'Health Insurance Premium',
    min: 0,
    max: 25000,
    step: 1000,
  }
];

export const getIndiaIncomeRange = () => ({
  min: 0,
  max: 10000000,
  step: 10000
});
