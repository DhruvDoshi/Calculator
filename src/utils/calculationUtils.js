export const calculateSIP = (monthlyInvestment, annualReturn, investmentPeriod, withdrawalAmount, withdrawalStartYear, withdrawalPeriod) => {
  const monthlyRate = annualReturn / 12 / 100;
  const totalMonths = Math.max(investmentPeriod, withdrawalStartYear + withdrawalPeriod) * 12;
  const withdrawalStartMonth = withdrawalStartYear * 12;

  let balance = 0;
  let totalInvested = 0;
  let totalWithdrawn = 0;

  for (let month = 1; month <= totalMonths; month++) {
    if (month <= investmentPeriod * 12) {
      balance += monthlyInvestment;
      totalInvested += monthlyInvestment;
    }
    
    balance *= (1 + monthlyRate);

    if (month > withdrawalStartMonth) {
      balance -= withdrawalAmount;
      totalWithdrawn += withdrawalAmount;
    }
  }

  const totalReturns = balance + totalWithdrawn - totalInvested;

  return {
    invested: Math.round(totalInvested),
    returns: Math.round(totalReturns),
    total: Math.round(totalInvested + totalReturns),
    finalBalance: Math.round(balance),
    totalWithdrawn: Math.round(totalWithdrawn)
  };
};

export const calculateNetWorthOverTime = (monthlyInvestment, annualReturn, investmentPeriod, withdrawalAmount, withdrawalStartYear, withdrawalPeriod) => {
  const monthlyRate = annualReturn / 12 / 100;
  const totalMonths = Math.max(investmentPeriod, withdrawalStartYear + withdrawalPeriod) * 12;
  const withdrawalStartMonth = withdrawalStartYear * 12;

  let balance = 0;
  let netWorthByYear = [];

  for (let month = 1; month <= totalMonths; month++) {
    if (month <= investmentPeriod * 12) {
      balance += monthlyInvestment;
    }
    
    balance *= (1 + monthlyRate);

    if (month > withdrawalStartMonth) {
      balance -= withdrawalAmount;
    }

    if (month % 12 === 0) {
      netWorthByYear.push(Math.round(balance));
    }
  }

  return netWorthByYear;
};
