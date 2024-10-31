import React, { useState, useEffect, useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import DraggableSlider from '../TaxInputSlider';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import usaTaxRates from '../../data/taxRates/usaTaxRates.json';
import regions from '../../data/regions.json';

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

export const USATaxCalculator = () => {
  // Basic Information
  const [income, setIncome] = useState(50000);
  const [state, setState] = useState('California');
  const [filingStatus, setFilingStatus] = useState('single');
  const [age, setAge] = useState(30);
  
  // Additional Income
  const [investmentIncome, setInvestmentIncome] = useState({
    dividends: 0,
    interest: 0,
    shortTermGains: 0,
    longTermGains: 0
  });
  
  // Deductions State
  const [deductionType, setDeductionType] = useState('standard');
  const [itemizedDeductions, setItemizedDeductions] = useState({
    // Housing Related
    mortgageInterest: 0,
    propertyTax: 0,
    
    // Medical & Health
    medicalExpenses: 0,
    healthInsurance: 0,
    hsa: 0, // Health Savings Account
    
    // Retirement & Investments
    iraContribution: 0,
    k401Contribution: 0,
    
    // Education
    studentLoanInterest: 0,
    educationExpenses: 0,
    teacherExpenses: 0,
    plan529Contribution: 0,
    
    // Other Common Deductions
    charitableDonations: 0,
    saltDeduction: 0, // State and Local Tax (capped at 10k)
    workExpenses: 0,  // Unreimbursed work-related expenses
    movingExpenses: 0, // For military only
    
    // Self-Employment Deductions
    selfEmployedHealthInsurance: 0,
    selfEmployedRetirement: 0,
    businessExpenses: 0,
    
    // Additional Deductions
    alimonyPaid: 0,
    teacherExpenses: 0, // Educator expenses up to $250
    casualtyLosses: 0, // From federally declared disasters
  });
  
  // Credits State
  const [taxCredits, setTaxCredits] = useState({
    childCredit: 0,
    dependentCare: 0,
    educationCredit: 0,
    energyCredit: 0,
  });
  
  // Tax Result State
  const [taxResult, setTaxResult] = useState(null);
  const [showDeductions, setShowDeductions] = useState(false);

  // Change to array for multiple selections
  const [selectedDeductionCategories, setSelectedDeductionCategories] = useState([]);

  // Define deduction categories
  const deductionCategories = [
    { id: 'housing', label: 'Housing', icon: '🏠' },
    { id: 'medical', label: 'Medical & Health', icon: '🏥' },
    { id: 'retirement', label: 'Retirement', icon: '💰' },
    { id: 'education', label: 'Education', icon: '📚' },
    { id: 'other', label: 'Other', icon: '📋' },
    { id: 'selfEmployment', label: 'Self-Employment', icon: '💼' },
  ];

  // Toggle category selection
  const toggleCategory = (categoryId) => {
    setSelectedDeductionCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const calculateTax = () => {
    if (!state) return null;

    let totalIncome = income + 
      investmentIncome.dividends + 
      investmentIncome.interest + 
      investmentIncome.shortTermGains;

    // Calculate Standard Deduction based on filing status
    let standardDeduction = filingStatus === 'married' ? 29200 : 14600;
    if (age >= 65) standardDeduction += 1500; // Extra deduction for seniors

    // Calculate total itemized deductions
    const totalItemizedDeductions = Object.values(itemizedDeductions).reduce((a, b) => a + b, 0);
    
    // Use the larger of standard or itemized deductions
    const applicableDeduction = deductionType === 'standard' ? 
      standardDeduction : 
      Math.max(totalItemizedDeductions, standardDeduction);

    // Calculate taxable income
    let taxableIncome = Math.max(0, totalIncome - applicableDeduction);

    // Calculate federal tax
    const federalTax = calculateTaxForBrackets(taxableIncome, usaTaxRates.federal);
    
    // Calculate state tax
    const stateTax = calculateTaxForBrackets(taxableIncome, usaTaxRates.state[state]);

    // Calculate capital gains tax
    const longTermGainsTax = calculateLongTermCapitalGainsTax(investmentIncome.longTermGains, taxableIncome);

    // Apply tax credits
    const totalCredits = Object.values(taxCredits).reduce((a, b) => a + b, 0);
    
    // Calculate final tax
    const totalTax = Math.max(0, federalTax + stateTax + longTermGainsTax - totalCredits);
    const netIncome = totalIncome - totalTax;
    const effectiveTaxRate = (totalTax / totalIncome) * 100;

    return {
      federalTax,
      stateTax,
      longTermGainsTax,
      totalTax,
      netIncome,
      effectiveTaxRate,
      applicableDeduction,
      taxableIncome
    };
  };

  const calculateLongTermCapitalGainsTax = (gains, taxableIncome) => {
    // 2024 Long-term capital gains tax brackets
    if (taxableIncome <= 44625) return gains * 0;
    if (taxableIncome <= 492300) return gains * 0.15;
    return gains * 0.20;
  };

  useEffect(() => {
    const result = calculateTax();
    setTaxResult(result);
  }, [income, state, filingStatus, investmentIncome, deductionType, itemizedDeductions, taxCredits]);

  // Chart data with null checks
  const chartData = {
    labels: [
      'Net Income',
      'Federal Tax',
      'State Tax'
    ],
    datasets: [{
      data: taxResult ? [
        taxResult.netIncome || 0,
        taxResult.federalTax || 0,
        taxResult.stateTax || 0
      ] : [0, 0, 0],
      backgroundColor: [
        'rgb(59, 130, 246)', // Blue
        'rgb(239, 68, 68)',  // Red
        'rgb(249, 115, 22)'  // Orange
      ],
      borderWidth: 1
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i] || 0;
                return {
                  text: `${label}: $${value.toLocaleString()}`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      }
    }
  };

  // Add chart reference
  const chartRef = useRef(null);

  // Cleanup chart on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  const downloadPDF = async () => {
    try {
      const element = document.querySelector('.tax-calculator-container');
      if (!element) return;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      const dataUrl = canvas.toDataURL('image/png');
      saveAs(dataUrl, 'usa-tax-calculation.png');
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
          
          <div className="mb-4">
            <DraggableSlider
              label="Annual Income"
              value={income}
              setValue={setIncome}
              min={0}
              max={1000000}
              step={1000}
              currencySymbol="$"
              currentYear={new Date().getFullYear()}
              showYear={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filing Status</label>
              <select
                className="w-full p-2 border rounded-lg bg-gray-50"
                value={filingStatus}
                onChange={(e) => setFilingStatus(e.target.value)}
              >
                <option value="single">Single</option>
                <option value="married">Married Filing Jointly</option>
                <option value="headOfHousehold">Head of Household</option>
                <option value="marriedSeparate">Married Filing Separately</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <select
                className="w-full p-2 border rounded-lg bg-gray-50"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                {regions['United States'].map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Deductions Section */}
        <div className="bg-white p-3 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Deductions</h2>
          
          <div className="flex gap-3 mb-4">
            <button
              className={`flex-1 py-2 px-4 rounded-lg ${
                deductionType === 'standard' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setDeductionType('standard')}
            >
              Standard
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-lg ${
                deductionType === 'itemized' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
              onClick={() => setDeductionType('itemized')}
            >
              Itemized
            </button>
          </div>

          {deductionType === 'itemized' && (
            <div className="space-y-4">
              {/* Category Selection Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {deductionCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => toggleCategory(category.id)}
                    className={`p-2 rounded-lg flex flex-col items-center justify-center transition-colors
                      ${selectedDeductionCategories.includes(category.id)
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                  >
                    <span className="text-xl mb-1">{category.icon}</span>
                    <span className="text-sm font-medium">{category.label}</span>
                  </button>
                ))}
              </div>

              {/* Deduction Options Based on Selected Categories */}
              {selectedDeductionCategories.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-6">
                  {/* Housing Deductions */}
                  {selectedDeductionCategories.includes('housing') && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Housing Deductions</h3>
                      <div className="space-y-3">
                        <DraggableSlider
                          label="Mortgage Interest"
                          value={itemizedDeductions.mortgageInterest}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, mortgageInterest: val}))}
                          min={0}
                          max={50000}
                          step={100}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="Property Tax"
                          value={itemizedDeductions.propertyTax}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, propertyTax: val}))}
                          min={0}
                          max={10000}
                          step={100}
                          currencySymbol="$"
                        />
                      </div>
                    </div>
                  )}

                  {/* Medical Deductions */}
                  {selectedDeductionCategories.includes('medical') && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Medical & Health Deductions</h3>
                      <div className="space-y-3">
                        <DraggableSlider
                          label="Medical Expenses"
                          value={itemizedDeductions.medicalExpenses}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, medicalExpenses: val}))}
                          min={0}
                          max={50000}
                          step={100}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="Health Insurance"
                          value={itemizedDeductions.healthInsurance}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, healthInsurance: val}))}
                          min={0}
                          max={20000}
                          step={100}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="HSA"
                          value={itemizedDeductions.hsa}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, hsa: val}))}
                          min={0}
                          max={7750}
                          step={50}
                          currencySymbol="$"
                        />
                      </div>
                    </div>
                  )}

                  {/* Retirement Deductions */}
                  {selectedDeductionCategories.includes('retirement') && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Retirement Deductions</h3>
                      <div className="space-y-3">
                        <DraggableSlider
                          label="Traditional IRA"
                          value={itemizedDeductions.iraContribution}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, iraContribution: val}))}
                          min={0}
                          max={7000}
                          step={100}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="401(k)"
                          value={itemizedDeductions.k401Contribution}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, k401Contribution: val}))}
                          min={0}
                          max={23000}
                          step={100}
                          currencySymbol="$"
                        />
                      </div>
                    </div>
                  )}

                  {/* Education Deductions */}
                  {selectedDeductionCategories.includes('education') && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Education Deductions</h3>
                      <div className="space-y-3">
                        <DraggableSlider
                          label="Student Loan Interest"
                          value={itemizedDeductions.studentLoanInterest}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, studentLoanInterest: val}))}
                          min={0}
                          max={2500} // Annual limit for student loan interest deduction
                          step={50}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="Education Expenses"
                          value={itemizedDeductions.educationExpenses}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, educationExpenses: val}))}
                          min={0}
                          max={4000} // Typical limit for qualified education expenses
                          step={100}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="Teacher Expenses"
                          value={itemizedDeductions.teacherExpenses}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, teacherExpenses: val}))}
                          min={0}
                          max={300} // 2024 limit for educator expenses
                          step={25}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="529 Plan Contribution"
                          value={itemizedDeductions.plan529Contribution}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, plan529Contribution: val}))}
                          min={0}
                          max={16000} // Annual gift tax exclusion limit
                          step={500}
                          currencySymbol="$"
                        />
                      </div>
                    </div>
                  )}

                  {/* Other Common Deductions */}
                  {selectedDeductionCategories.includes('other') && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Other Common Deductions</h3>
                      <div className="space-y-3">
                        <DraggableSlider
                          label="Charitable Donations"
                          value={itemizedDeductions.charitableDonations}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, charitableDonations: val}))}
                          min={0}
                          max={10000}
                          step={100}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="Salt Deduction"
                          value={itemizedDeductions.saltDeduction}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, saltDeduction: val}))}
                          min={0}
                          max={10000}
                          step={100}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="Work Expenses"
                          value={itemizedDeductions.workExpenses}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, workExpenses: val}))}
                          min={0}
                          max={10000}
                          step={100}
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

                  {/* Self-Employment Deductions */}
                  {selectedDeductionCategories.includes('selfEmployment') && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Self-Employment Deductions</h3>
                      <div className="space-y-3">
                        <DraggableSlider
                          label="Self-Employed Health Insurance"
                          value={itemizedDeductions.selfEmployedHealthInsurance}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, selfEmployedHealthInsurance: val}))}
                          min={0}
                          max={20000}
                          step={100}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="Self-Employed Retirement"
                          value={itemizedDeductions.selfEmployedRetirement}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, selfEmployedRetirement: val}))}
                          min={0}
                          max={7000}
                          step={100}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="Business Expenses"
                          value={itemizedDeductions.businessExpenses}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, businessExpenses: val}))}
                          min={0}
                          max={10000}
                          step={100}
                          currencySymbol="$"
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Deductions */}
                  {selectedDeductionCategories.includes('additional') && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Additional Deductions</h3>
                      <div className="space-y-3">
                        <DraggableSlider
                          label="Alimony Paid"
                          value={itemizedDeductions.alimonyPaid}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, alimonyPaid: val}))}
                          min={0}
                          max={10000}
                          step={100}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="Teacher Expenses"
                          value={itemizedDeductions.teacherExpenses}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, teacherExpenses: val}))}
                          min={0}
                          max={250}
                          step={25}
                          currencySymbol="$"
                        />
                        <DraggableSlider
                          label="Casualty Losses"
                          value={itemizedDeductions.casualtyLosses}
                          setValue={(val) => setItemizedDeductions(prev => ({...prev, casualtyLosses: val}))}
                          min={0}
                          max={10000}
                          step={100}
                          currencySymbol="$"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Summary of Selected Deductions */}
              {Object.values(itemizedDeductions).some(value => value > 0) && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Selected Deductions Summary</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(itemizedDeductions)
                      .filter(([_, value]) => value > 0)
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </span>
                          <span className="text-sm font-medium">${value.toLocaleString()}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Continue with Tax Credits and other sections... */}
      </div>

      <div className="lg:w-1/3 space-y-3">
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
                  label="State Tax" 
                  value={`$${(taxResult.stateTax || 0).toLocaleString()}`} 
                />
              </div>
            </div>
          )}
        </div>

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
              Compare States
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};