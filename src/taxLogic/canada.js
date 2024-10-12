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
  if (!Array.isArray(brackets)) {
    console.error('Invalid tax brackets:', brackets);
    return 0;
  }

  let tax = 0;
  let remainingIncome = income;

  for (const bracket of brackets) {
    if (remainingIncome > 0) {
      const taxableAmount = Math.min(remainingIncome, (bracket.max || Infinity) - bracket.min);
      tax += taxableAmount * bracket.rate;
      remainingIncome -= taxableAmount;
    } else {
      break;
    }
  }

  return tax;
};
