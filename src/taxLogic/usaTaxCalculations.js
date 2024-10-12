export const calculateUSATax = (income, state, taxData) => {
  if (!taxData || !taxData.federal || !taxData.state || !taxData.state[state]) {
    console.error('Invalid tax data for USA');
    return null;
  }

  const federalTax = calculateTaxForBrackets(income, taxData.federal);
  const stateTax = calculateTaxForBrackets(income, taxData.state[state]);

  const totalTax = federalTax + stateTax;
  const netIncome = income - totalTax;
  const effectiveTaxRate = (totalTax / income) * 100;

  return {
    federalTax: federalTax.toFixed(2),
    stateTax: stateTax.toFixed(2),
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

export const getUSASpecificFields = () => [
  // USA doesn't have additional fields in this example, but you can add them here if needed
];

export const getUSAIncomeRange = () => ({
  min: 0,
  max: 1000000,
  step: 1000
});
