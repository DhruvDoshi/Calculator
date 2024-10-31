import React, { useState, useEffect } from 'react';
import { Doughnut, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip, 
  Legend 
} from 'chart.js';
import DraggableSlider from '../TaxInputSlider';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import canadaTaxRates from '../../data/taxRates/canadaTaxRates.json';
import regions from '../../data/regions.json';

// Register all ChartJS components in one place
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
const TaxResultCard = ({ label, value, isLarge = false }) => (
  <div className="bg-blue-500 bg-opacity-20 rounded-lg p-2">
    <div className={`${isLarge ? 'text-xs' : 'text-[10px]'} text-blue-100`}>{label}</div>
    <div className={`text-white font-semibold truncate ${isLarge ? 'text-lg' : 'text-sm'}`}>{value}</div>
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
    employmentIncome: 70000,
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

  // Add state for comparison view
  const [showComparison, setShowComparison] = useState(false);

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

  // Add comparison calculation function
  const calculateProvinceComparison = () => {
    return regions['Canada'].map(provinceName => {
      const result = calculateCanadianTax(incomes, provinceName, itemizedDeductions);
      return {
        province: provinceName,
        totalIncome: result.totalIncome,
        netIncome: result.netIncome,
        totalDeductions: result.totalTax + result.ei + result.cpp,
        deductionRate: ((result.totalTax + result.ei + result.cpp) / result.totalIncome * 100),
        federalTax: result.federalTax,
        provincialTax: result.provincialTax,
        cpp: result.cpp,
        ei: result.ei
      };
    }).sort((a, b) => a.totalDeductions - b.totalDeductions);
  };

  // Add the comparison view component
  const ProvinceComparisonView = ({ onClose }) => {
    const comparisonData = calculateProvinceComparison();
    
    // Find the best province (lowest deductions)
    const bestProvince = comparisonData[0]; // Already sorted by totalDeductions

    // Bar chart options
    const barOptions = {
      responsive: true,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            padding: 20,
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => `$${context.raw.toLocaleString()}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => `$${value.toLocaleString()}`
          }
        }
      }
    };

    // Chart data for tax breakdown
    const taxBreakdownChart = {
      labels: comparisonData.map(d => d.province),
      datasets: [
        {
          label: 'Federal Tax',
          data: comparisonData.map(d => d.federalTax),
          backgroundColor: 'rgb(239, 68, 68)',
          stack: 'stack0',
        },
        {
          label: 'Provincial Tax',
          data: comparisonData.map(d => d.provincialTax),
          backgroundColor: 'rgb(16, 185, 129)',
          stack: 'stack0',
        },
        {
          label: 'CPP',
          data: comparisonData.map(d => d.cpp),
          backgroundColor: 'rgb(245, 158, 11)',
          stack: 'stack0',
        },
        {
          label: 'EI',
          data: comparisonData.map(d => d.ei),
          backgroundColor: 'rgb(139, 92, 246)',
          stack: 'stack0',
        }
      ]
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Provincial Tax Comparison</h2>
              <p className="text-sm text-gray-500">Compare tax implications across different provinces</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-auto max-h-[calc(90vh-80px)]">
            {/* Best Province Recommendation */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">Recommended Province</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Based on your income of ${incomes.employmentIncome.toLocaleString()}, 
                    here's the most tax-efficient province:
                  </p>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Province</div>
                        <div className="text-lg font-bold text-gray-900">{bestProvince.province}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Net Income</div>
                        <div className="text-lg font-bold text-green-600">${bestProvince.netIncome.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Total Deductions</div>
                        <div className="text-lg font-bold text-red-600">${bestProvince.totalDeductions.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Deduction Rate</div>
                        <div className="text-lg font-bold text-gray-900">{bestProvince.deductionRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Income Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="text-sm text-blue-600 mb-1">Employment Income</div>
                <div className="text-2xl font-bold text-blue-900">
                  ${incomes.employmentIncome.toLocaleString()}
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="text-sm text-purple-600 mb-1">Total Income</div>
                <div className="text-2xl font-bold text-purple-900">
                  ${(incomes.employmentIncome + incomes.selfEmploymentIncome + incomes.otherIncome).toLocaleString()}
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-sm text-green-600 mb-1">Current Province</div>
                <div className="text-2xl font-bold text-green-900">{province}</div>
              </div>
            </div>

            {/* Charts Section with Legend */}
            <div className="grid grid-cols-1 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="text-lg font-semibold mb-4">Tax Breakdown by Province</h3>
                <div className="h-[400px]">
                  <Bar options={barOptions} data={taxBreakdownChart} />
                </div>
                {/* Legend explanation */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-600">Federal Tax</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-600">Provincial Tax</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded"></div>
                    <span className="text-sm text-gray-600">CPP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span className="text-sm text-gray-600">EI</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Comparison Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Detailed Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Province</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Net Income</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total Deductions</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Rate</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Federal Tax</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Provincial Tax</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">CPP</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">EI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {comparisonData.map((result, index) => (
                      <tr 
                        key={result.province} 
                        className={result.province === province ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{result.province}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">${result.netIncome.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">${result.totalDeductions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">{result.deductionRate.toFixed(1)}%</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">${result.federalTax.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">${result.provincialTax.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">${result.cpp.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900">${result.ei.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                  {/* First Row: Total Income and Net Income - with larger fonts */}
                  <TaxResultCard 
                    label="Total Income" 
                    value={`$${(taxResult.totalIncome || 0).toLocaleString()}`}
                    isLarge={true}
                  />
                  <TaxResultCard 
                    label="Net Income" 
                    value={`$${(taxResult.netIncome || 0).toLocaleString()}`}
                    isLarge={true}
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
                onClick={() => setShowComparison(true)}
                className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"
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

      {/* Add the modal at the end of the component */}
      {showComparison && (
        <ProvinceComparisonView onClose={() => setShowComparison(false)} />
      )}
    </div>
  );
};