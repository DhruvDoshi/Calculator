export const calculateCanadianTax = (income, province, taxData) => {
  if (!taxData || !taxData.federal || !taxData.provincial || !taxData.provincial[province]) {
    console.error('Invalid tax data for Canada');
    return null;
  }

  const federalTax = calculateTaxForBrackets(income, taxData.federal);
  const provincialTax = calculateTaxForBrackets(income, taxData.provincial[province]);
  
  const { maxContributionIncome, basicExemptionAmount, contributionRate } = taxData.cpp;
  const contributableIncome = Math.min(Math.max(income - basicExemptionAmount, 0), maxContributionIncome - basicExemptionAmount);
  const cpp = contributableIncome * contributionRate;

  const { maxInsurableEarnings, contributionRate: eiRate } = taxData.ei;
  const ei = Math.min(income, maxInsurableEarnings) * eiRate;

  const totalTax = federalTax + provincialTax + cpp + ei;
  const netIncome = income - totalTax;
  const effectiveTaxRate = (totalTax / income) * 100;

  return {
    federalTax: federalTax.toFixed(2),
    provincialTax: provincialTax.toFixed(2),
    cpp: cpp.toFixed(2),
    ei: ei.toFixed(2),
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

export const getCanadaSpecificFields = () => [
  // Canada doesn't have additional fields in this example, but you can add them here if needed
];

export const getCanadaIncomeRange = () => ({
  min: 0,
  max: 500000,
  step: 1000
});
