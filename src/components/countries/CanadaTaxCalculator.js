import React, { useState, useEffect, useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import DraggableSlider from '../TaxInputSlider';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import canadaTaxRates from '../../data/taxRates/canadaTaxRates.json';
import regions from '../../data/regions.json';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const TaxResultCard = ({ label, value }) => (
  <div className="bg-blue-500 bg-opacity-20 rounded-lg p-3">
    <div className="text-xs text-blue-100">{label}</div>
    <div className="text-white text-lg font-semibold">{value}</div>
  </div>
);

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

const calculateCanadianTax = (incomes, province, itemizedDeductions) => {
  if (!canadaTaxRates.federal || !canadaTaxRates.provincial || !canadaTaxRates.provincial[province]) {
    console.error('Invalid tax data for Canada');
    return null;
  }

  // Calculate total income
  const totalIncome = 
    incomes.employmentIncome + 
    incomes.selfEmploymentIncome + 
    incomes.otherIncome + 
    (incomes.capitalGains * 0.5) + // Only 50% of capital gains are taxable
    (incomes.eligibleDividends * 1.38); // Gross-up eligible dividends by 38%

  // Calculate total deductions
  const totalDeductions = itemizedDeductions ? Object.values(itemizedDeductions).reduce((sum, val) => sum + val, 0) : 0;

  // Calculate taxable income
  const taxableIncome = Math.max(0, totalIncome - incomes.rrspContribution - totalDeductions);

  // Calculate federal tax
  const federalTax = calculateTaxForBrackets(taxableIncome, canadaTaxRates.federal);
  
  // Calculate provincial tax
  const provincialTax = calculateTaxForBrackets(taxableIncome, canadaTaxRates.provincial[province]);

  // Calculate CPP contributions
  const { maxContributionIncome, basicExemptionAmount, contributionRate } = canadaTaxRates.cpp;
  const contributableIncome = Math.min(
    Math.max(incomes.employmentIncome + incomes.selfEmploymentIncome - basicExemptionAmount, 0),
    maxContributionIncome - basicExemptionAmount
  );
  const cpp = contributableIncome * contributionRate;

  // Calculate EI premiums
  const { maxInsurableEarnings, contributionRate: eiRate } = canadaTaxRates.ei;
  const ei = Math.min(incomes.employmentIncome, maxInsurableEarnings) * eiRate;

  // Calculate total tax and net income
  const totalTax = federalTax + provincialTax + cpp + ei;
  const netIncome = totalIncome - totalTax;
  const effectiveTaxRate = (totalTax / totalIncome) * 100;

  return {
    totalIncome: totalIncome.toFixed(2),
    taxableIncome: taxableIncome.toFixed(2),
    federalTax: federalTax.toFixed(2),
    provincialTax: provincialTax.toFixed(2),
    cpp: cpp.toFixed(2),
    ei: ei.toFixed(2),
    totalTax: totalTax.toFixed(2),
    netIncome: netIncome.toFixed(2),
    effectiveTaxRate: effectiveTaxRate.toFixed(2)
  };
};

export const CanadaTaxCalculator = () => {
  const [incomes, setIncomes] = useState({
    employmentIncome: 0,
    selfEmploymentIncome: 0,
    otherIncome: 0,
    rrspContribution: 0,
    capitalGains: 0,
    eligibleDividends: 0
  });
  const [province, setProvince] = useState('');
  const [deductionType, setDeductionType] = useState('standard');
  const [selectedDeductionCategories, setSelectedDeductionCategories] = useState([]);
  const [taxResult, setTaxResult] = useState(null);
  const [itemizedDeductions, setItemizedDeductions] = useState({
    // General Deductions
    unionDues: 0,
    movingExpenses: 0,
    childcareExpenses: 0,
    supportPayments: 0,
    studentLoanInterest: 0,
    employmentExpenses: 0,

    // Health Related
    medicalExpenses: 0,
    disabilitySupports: 0,
    disabilityTaxCredit: 0,
    caregiverCredit: 0,

    // Education Related
    tuitionCredit: 0,
    trainingCredit: 0,

    // Property & Investment
    homeBuyersAmount: 0,
    homeAccessibility: 0,
    investmentExpenses: 0,

    // Other Credits
    charitableDonations: 0,
    politicalContributions: 0,
    digitalNewsCredit: 0,
    northernDeduction: 0
  });

  // Define deduction categories
  const deductionCategories = [
    { id: 'general', label: 'General Deductions', icon: '📋' },
    { id: 'health', label: 'Health Related', icon: '🏥' },
    { id: 'education', label: 'Education', icon: '📚' },
    { id: 'property', label: 'Property & Investment', icon: '🏠' },
    { id: 'other', label: 'Other Credits', icon: '✨' },
  ];

  useEffect(() => {
    if (province) {
      const result = calculateCanadianTax(incomes, province, 
        deductionType === 'itemized' ? itemizedDeductions : null);
      setTaxResult(result);
    }
  }, [incomes, province, itemizedDeductions, deductionType]);

  const chartData = {
    labels: ['Net Income', 'Federal Tax', 'Provincial Tax', 'CPP', 'EI'],
    datasets: [{
      data: taxResult ? [
        parseFloat(taxResult.netIncome),
        parseFloat(taxResult.federalTax),
        parseFloat(taxResult.provincialTax),
        parseFloat(taxResult.cpp),
        parseFloat(taxResult.ei)
      ] : [],
      backgroundColor: [
        '#60A5FA', // blue-400
        '#F87171', // red-400
        '#34D399', // green-400
        '#FBBF24', // yellow-400
        '#A78BFA'  // purple-400
      ],
      borderWidth: 0
    }]
  };

  const toggleCategory = (categoryId) => {
    setSelectedDeductionCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const downloadPDF = async () => {
    try {
      const element = document.querySelector('.tax-calculator-container');
      const canvas = await html2canvas(element);
      const dataURL = canvas.toDataURL('image/png');
      saveAs(dataURL, 'tax-calculation.png');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="tax-calculator-container flex flex-col lg:flex-row gap-3">
      <div className="lg:w-2/3 space-y-3">
        {/* Basic Information Section */}
        <div className="bg-white p-3 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-3">Basic Information</h2>
          
          {/* Province Selection First */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
            <select
              className="w-full p-2 border rounded-lg bg-gray-50"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            >
              <option value="">Select a province</option>
              {regions['Canada'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Income Inputs in Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="space-y-4">
              <DraggableSlider
                label="Employment Income"
                value={incomes.employmentIncome}
                setValue={(val) => setIncomes(prev => ({...prev, employmentIncome: val}))}
                min={0}
                max={500000}
                step={1000}
                currencySymbol="$"
              />
              
              <DraggableSlider
                label="Self-employment Income"
                value={incomes.selfEmploymentIncome}
                setValue={(val) => setIncomes(prev => ({...prev, selfEmploymentIncome: val}))}
                min={0}
                max={500000}
                step={1000}
                currencySymbol="$"
              />
              
              <DraggableSlider
                label="Other Income (incl. EI)"
                value={incomes.otherIncome}
                setValue={(val) => setIncomes(prev => ({...prev, otherIncome: val}))}
                min={0}
                max={100000}
                step={1000}
                currencySymbol="$"
              />
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <DraggableSlider
                label="RRSP Contribution"
                value={incomes.rrspContribution}
                setValue={(val) => setIncomes(prev => ({...prev, rrspContribution: val}))}
                min={0}
                max={30000}
                step={100}
                currencySymbol="$"
              />
              
              <DraggableSlider
                label="Capital Gains & Losses"
                value={incomes.capitalGains}
                setValue={(val) => setIncomes(prev => ({...prev, capitalGains: val}))}
                min={-50000}
                max={100000}
                step={1000}
                currencySymbol="$"
              />
              
              <DraggableSlider
                label="Eligible Dividends"
                value={incomes.eligibleDividends}
                setValue={(val) => setIncomes(prev => ({...prev, eligibleDividends: val}))}
                min={0}
                max={100000}
                step={1000}
                currencySymbol="$"
              />
            </div>
          </div>
        </div>

        {/* Deductions Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Deductions & Credits</h2>
          </div>
          <div className="p-4">
            {/* Category Selection Grid */}
            <div className="grid grid-cols-3 gap-2">
              {deductionCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`p-3 rounded-lg flex flex-col items-center justify-center transition-colors
                    ${selectedDeductionCategories.includes(category.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'}`}
                >
                  <span className="text-2xl mb-2">{category.icon}</span>
                  <span className="text-sm font-medium">{category.label}</span>
                </button>
              ))}
            </div>

            {/* Selected Deductions */}
            {selectedDeductionCategories.length > 0 && (
              <div className="grid grid-cols-2 gap-6 mt-6">
                {/* General Deductions */}
                {selectedDeductionCategories.includes('general') && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">General Deductions</h3>
                    <div className="space-y-3">
                      <DraggableSlider
                        label="Union Dues"
                        value={itemizedDeductions.unionDues}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, unionDues: val}))}
                        min={0}
                        max={2000}
                        step={50}
                        currencySymbol="$"
                      />
                      <DraggableSlider
                        label="Moving Expenses"
                        value={itemizedDeductions.movingExpenses}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, movingExpenses: val}))}
                        min={0}
                        max={10000}
                        step={100}
                        currencySymbol="$"
                      />
                    </div>
                  </div>
                )}

                {/* Health Related */}
                {selectedDeductionCategories.includes('health') && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Health Related</h3>
                    <div className="space-y-3">
                      <DraggableSlider
                        label="Medical Expenses"
                        value={itemizedDeductions.medicalExpenses}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, medicalExpenses: val}))}
                        min={0}
                        max={20000}
                        step={100}
                        currencySymbol="$"
                      />
                      <DraggableSlider
                        label="Disability Supports"
                        value={itemizedDeductions.disabilitySupports}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, disabilitySupports: val}))}
                        min={0}
                        max={10000}
                        step={100}
                        currencySymbol="$"
                      />
                    </div>
                  </div>
                )}

                {/* Education Related */}
                {selectedDeductionCategories.includes('education') && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Education</h3>
                    <div className="space-y-3">
                      <DraggableSlider
                        label="Tuition Credit"
                        value={itemizedDeductions.tuitionCredit}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, tuitionCredit: val}))}
                        min={0}
                        max={50000}
                        step={100}
                        currencySymbol="$"
                      />
                      <DraggableSlider
                        label="Student Loan Interest"
                        value={itemizedDeductions.studentLoanInterest}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, studentLoanInterest: val}))}
                        min={0}
                        max={5000}
                        step={50}
                        currencySymbol="$"
                      />
                      <DraggableSlider
                        label="Training Credit"
                        value={itemizedDeductions.trainingCredit}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, trainingCredit: val}))}
                        min={0}
                        max={5000}
                        step={100}
                        currencySymbol="$"
                      />
                    </div>
                  </div>
                )}

                {/* Property & Investment */}
                {selectedDeductionCategories.includes('property') && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Property & Investment</h3>
                    <div className="space-y-3">
                      <DraggableSlider
                        label="Home Buyers' Amount"
                        value={itemizedDeductions.homeBuyersAmount}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, homeBuyersAmount: val}))}
                        min={0}
                        max={10000}
                        step={100}
                        currencySymbol="$"
                      />
                      <DraggableSlider
                        label="Home Accessibility"
                        value={itemizedDeductions.homeAccessibility}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, homeAccessibility: val}))}
                        min={0}
                        max={20000}
                        step={100}
                        currencySymbol="$"
                      />
                      <DraggableSlider
                        label="Investment Expenses"
                        value={itemizedDeductions.investmentExpenses}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, investmentExpenses: val}))}
                        min={0}
                        max={10000}
                        step={100}
                        currencySymbol="$"
                      />
                    </div>
                  </div>
                )}

                {/* Other Credits */}
                {selectedDeductionCategories.includes('other') && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Other Credits</h3>
                    <div className="space-y-3">
                      <DraggableSlider
                        label="Charitable Donations"
                        value={itemizedDeductions.charitableDonations}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, charitableDonations: val}))}
                        min={0}
                        max={100000}
                        step={100}
                        currencySymbol="$"
                      />
                      <DraggableSlider
                        label="Political Contributions"
                        value={itemizedDeductions.politicalContributions}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, politicalContributions: val}))}
                        min={0}
                        max={1275}
                        step={25}
                        currencySymbol="$"
                      />
                      <DraggableSlider
                        label="Digital News Credit"
                        value={itemizedDeductions.digitalNewsCredit}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, digitalNewsCredit: val}))}
                        min={0}
                        max={500}
                        step={10}
                        currencySymbol="$"
                      />
                      <DraggableSlider
                        label="Northern Residents Deduction"
                        value={itemizedDeductions.northernDeduction}
                        setValue={(val) => setItemizedDeductions(prev => ({...prev, northernDeduction: val}))}
                        min={0}
                        max={25000}
                        step={100}
                        currencySymbol="$"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:w-1/3 space-y-3">
        {/* Tax Breakdown */}
        <div className="bg-white p-3 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Tax Breakdown</h2>
          
          <div className="flex flex-col justify-center" style={{ height: '220px' }}>
            {taxResult && (
              <Doughnut 
                data={chartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  cutout: '60%',
                  plugins: {
                    legend: {
                      display: true,
                      position: 'right',
                      labels: { 
                        font: { size: 12 },
                        padding: 5,
                        boxWidth: 12
                      }
                    }
                  },
                  layout: {
                    padding: {
                      bottom: 5
                    }
                  }
                }} 
              />
            )}
          </div>

          {taxResult && (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <TaxResultCard 
                  label="Net Income" 
                  value={`$${(taxResult.netIncome || 0).toLocaleString()}`} 
                />
                <TaxResultCard 
                  label="Total Tax" 
                  value={`$${(taxResult.totalTax || 0).toLocaleString()}`} 
                />
                <TaxResultCard 
                  label="Federal Tax" 
                  value={`$${(taxResult.federalTax || 0).toLocaleString()}`} 
                />
                <TaxResultCard 
                  label="Provincial Tax" 
                  value={`$${(taxResult.provincialTax || 0).toLocaleString()}`} 
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-3 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={downloadPDF}
              className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-600 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Report
            </button>
            <button 
              className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-600 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare Provinces
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};