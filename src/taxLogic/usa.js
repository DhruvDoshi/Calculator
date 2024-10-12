export const calculateUSATax = (income, state, taxData) => {
  if (!taxData || !taxData.federal || !taxData.state || !taxData.state[state]) {
    console.error('Invalid tax data for USA');
    return null;
  }

  const federalTax = calculateTaxForBrackets(income, taxData.federal);
  const stateTax = calculateTaxForBrackets(income, taxData.state[state]);

  const totalTax = federalTax + stateTax;
  const netIncome = income - totalTax;

  return {
    federalTax: federalTax.toFixed(2),
    stateTax: stateTax.toFixed(2),
    totalTax: totalTax.toFixed(2),
    netIncome: netIncome.toFixed(2),
    effectiveTaxRate: ((totalTax / income) * 100).toFixed(2)
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
