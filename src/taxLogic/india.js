export const calculateIndiaTax = (income, state, taxData) => {
  if (!taxData || !taxData.federal) {
    console.error('Invalid tax data for India');
    return null;
  }

  const federalTax = calculateTaxForBrackets(income, taxData.federal);
  
  // India has a cess of 4% on the income tax
  const cess = federalTax * 0.04;
  
  const totalTax = federalTax + cess;
  const netIncome = income - totalTax;
  const effectiveTaxRate = (totalTax / income) * 100;

  return {
    federalTax: federalTax.toFixed(2),
    cess: cess.toFixed(2),
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
