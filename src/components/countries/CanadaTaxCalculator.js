import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import DraggableSlider from '../TaxInputSlider';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import canadaTaxRates from '../../data/taxRates/canadaTaxRates.json';
import regions from '../../data/regions.json';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

// Chart options configuration
const chartOptions = {
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
};

// Tax result card component
const TaxResultCard = ({ label, value }) => (
  <div className="bg-blue-500 bg-opacity-20 rounded-lg p-2">
    <div className="text-[10px] text-blue-100">{label}</div>
    <div className="text-white text-sm font-semibold truncate">{value}</div>
  </div>
);

// Deduction categories
const deductionCategories = [
  { id: 'general', label: 'General Deductions', icon: '📋' },
  { id: 'health', label: 'Health Related', icon: '🏥' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'property', label: 'Property & Investment', icon: '🏠' },
  { id: 'other', label: 'Other Credits', icon: '✨' },
];

const calculateCanadianTax = (incomes, province, deductions) => {
  try {
    // Get tax rates for the selected province
    const provincialRates = canadaTaxRates.provincial[province];
    const federalRates = canadaTaxRates.federal;
    
    if (!provincialRates || !federalRates) {
      throw new Error('Tax rates not found');
    }

    // Calculate total income
    const totalIncome = 
      incomes.employmentIncome + 
      incomes.selfEmploymentIncome + 
      incomes.otherIncome + 
      (incomes.capitalGains * 0.5) + // Only 50% of capital gains are taxable
      (incomes.eligibleDividends * 1.38); // Gross-up eligible dividends by 38%

    // Calculate total deductions
    const totalDeductions = deductions ? 
      Object.values(deductions).reduce((sum, val) => sum + val, 0) : 0;

    // Calculate taxable income
    const taxableIncome = Math.max(0, totalIncome - incomes.rrspContribution - totalDeductions);

    // Calculate federal tax
    let federalTax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of federalRates) {
      const taxableAmount = Math.min(
        remainingIncome, 
        (bracket.max || Infinity) - bracket.min
      );
      if (taxableAmount <= 0) break;
      
      federalTax += taxableAmount * bracket.rate;
      remainingIncome -= taxableAmount;
    }

    // Calculate provincial tax
    let provincialTax = 0;
    remainingIncome = taxableIncome;

    for (const bracket of provincialRates) {
      const taxableAmount = Math.min(
        remainingIncome, 
        (bracket.max || Infinity) - bracket.min
      );
      if (taxableAmount <= 0) break;
      
      provincialTax += taxableAmount * bracket.rate;
      remainingIncome -= taxableAmount;
    }

    // Calculate CPP contributions
    const employmentIncome = incomes.employmentIncome + incomes.selfEmploymentIncome;
    const cppMaxIncome = 66600; // 2024 maximum pensionable earnings
    const cppExemption = 3500; // Basic exemption amount
    const cppRate = 0.0595; // 5.95% for 2024
    
    const cppContributableIncome = Math.min(
      Math.max(employmentIncome - cppExemption, 0),
      cppMaxIncome - cppExemption
    );
    const cpp = cppContributableIncome * cppRate;

    // Calculate EI premiums
    const eiMaxIncome = 63200; // 2024 maximum insurable earnings
    const eiRate = 0.0163; // 1.63% for 2024
    const ei = Math.min(incomes.employmentIncome, eiMaxIncome) * eiRate;

    // Calculate total tax and net income
    const totalTax = federalTax + provincialTax + cpp + ei;
    const netIncome = totalIncome - totalTax;

    return {
      totalIncome: totalIncome,
      taxableIncome: taxableIncome,
      federalTax: federalTax,
      provincialTax: provincialTax,
      cpp: cpp,
      ei: ei,
      totalTax: totalTax,
      netIncome: netIncome,
      effectiveTaxRate: (totalTax / totalIncome * 100) || 0
    };
  } catch (error) {
    console.error('Error calculating tax:', error);
    return null;
  }
};

export const CanadaTaxCalculator = () => {
  // State management
  const [province, setProvince] = useState('');
  const [incomes, setIncomes] = useState({
    employmentIncome: 0,
    selfEmploymentIncome: 0,
    otherIncome: 0,
    rrspContribution: 0,
    capitalGains: 0,
    eligibleDividends: 0
  });
  const [selectedDeductionCategories, setSelectedDeductionCategories] = useState([]);
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
  const [taxResult, setTaxResult] = useState(null);

  // Calculate tax when inputs change
  useEffect(() => {
    if (province) {
      const result = calculateCanadianTax(incomes, province, itemizedDeductions);
      setTaxResult(result);
    }
  }, [incomes, province, itemizedDeductions]);

  // Category toggle handler
  const toggleCategory = (categoryId) => {
    setSelectedDeductionCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Download report handler
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

  // Chart data
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
        'rgb(59, 130, 246)', // Blue
        'rgb(239, 68, 68)',  // Red
        'rgb(16, 185, 129)', // Green
        'rgb(245, 158, 11)', // Amber
        'rgb(139, 92, 246)'  // Purple
      ],
      borderWidth: 0
    }]
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4">
      {/* Left Column - 2/3 width */}
      <div className="lg:w-2/3 space-y-4">
        {/* Province and Income Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          {/* Province Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Province <span className="text-red-500">*</span>
            </label>
            <select
              className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                !province ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-50 border-gray-200'
              }`}
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            >
              <option value="">Select a province</option>
              {regions['Canada'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {!province && (
              <p className="mt-1 text-sm text-yellow-600">
                Please select a province to continue
              </p>
            )}
          </div>

          {/* Income Inputs - Only show if province is selected */}
          {province && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          )}
        </div>

        {/* Deductions Card - Only show if province is selected */}
        {province && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Deductions & Credits</h2>
            </div>
            <div className="p-4">
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
        )}
      </div>

      {/* Right Column - Only show if province is selected */}
      {province && (
        <div className="lg:w-1/3 space-y-4">
          {/* Tax Breakdown */}
          <div className="bg-white p-3 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Tax Breakdown</h2>
            
            <div className="flex flex-col justify-center" style={{ height: '220px' }}>
              {taxResult && (
                <Doughnut 
                  data={chartData} 
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      legend: {
                        ...chartOptions.plugins.legend,
                        labels: {
                          ...chartOptions.plugins.legend.labels,
                          font: { size: 11 },
                          padding: 3,
                          boxWidth: 10
                        }
                      }
                    }
                  }}
                />
              )}
            </div>

            {taxResult && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-2 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  {/* First Row: Total Income and Net Income */}
                  <TaxResultCard 
                    label="Total Income" 
                    value={`$${(taxResult.totalIncome || 0).toLocaleString()}`} 
                  />
                  <TaxResultCard 
                    label="Net Income" 
                    value={`$${(taxResult.netIncome || 0).toLocaleString()}`} 
                  />

                  {/* Second Row: Total Deductions and Deduction Rate */}
                  <TaxResultCard 
                    label="Total Deductions" 
                    value={`$${((taxResult.totalTax + taxResult.ei + taxResult.cpp) || 0).toLocaleString()}`} 
                  />
                  <TaxResultCard 
                    label="Deduction Rate" 
                    value={`${(((taxResult.totalTax + taxResult.ei + taxResult.cpp) / taxResult.totalIncome * 100) || 0).toFixed(1)}%`} 
                  />

                  {/* Third Row: Federal Tax, Provincial Tax, EI, and CPP */}
                  <div className="col-span-2 grid grid-cols-4 gap-2">
                    <TaxResultCard 
                      label="Federal Tax" 
                      value={`$${(taxResult.federalTax || 0).toLocaleString()}`} 
                    />
                    <TaxResultCard 
                      label="Provincial Tax" 
                      value={`$${(taxResult.provincialTax || 0).toLocaleString()}`} 
                    />
                    <TaxResultCard 
                      label="EI Premium" 
                      value={`$${(taxResult.ei || 0).toLocaleString()}`} 
                    />
                    <TaxResultCard 
                      label="CPP" 
                      value={`$${(taxResult.cpp || 0).toLocaleString()}`} 
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Quick Actions</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              <button 
                onClick={downloadPDF}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Report
              </button>
              <button 
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare Provinces
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};