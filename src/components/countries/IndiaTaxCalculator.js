import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import DraggableSlider from '../TaxInputSlider';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

ChartJS.register(ArcElement, Tooltip, Legend);

const DEDUCTION_LIMITS = {
  standardDeduction: 50000,
  section80C: 150000,
  section80D: 25000,
  section80E: 100000,
  section80TTA: 10000,
  section24b: 200000
};

const TaxResultCard = ({ label, value }) => (
  <div className="bg-blue-500 bg-opacity-20 rounded-lg p-3">
    <div className="text-xs text-blue-100">{label}</div>
    <div className="text-white text-lg font-semibold">{value}</div>
  </div>
);

const TaxSlabCard = ({ slab, rate, regime }) => (
  <div className="flex justify-between items-center p-2 border-b border-blue-100 last:border-0">
    <span className="text-sm text-gray-600">{slab}</span>
    <span className="text-sm font-medium text-blue-600">{rate}</span>
  </div>
);

export const IndiaTaxCalculator = () => {
  const [income, setIncome] = useState(500000);
  const [shortTermCapitalGains, setShortTermCapitalGains] = useState(0);
  const [longTermCapitalGains, setLongTermCapitalGains] = useState(0);
  const [ageBracket, setAgeBracket] = useState('below60');
  const [taxRegime, setTaxRegime] = useState('old');
  const [deductions, setDeductions] = useState({
    section80C: 0,
    section80D: 0,
    section80E: 0,
    section80TTA: 0,
    section24b: 0
  });
  const [showDeductions, setShowDeductions] = useState(false);
  const [taxResult, setTaxResult] = useState({
    taxableIncome: 0,
    tax: 0,
    netIncome: 0,
    effectiveTaxRate: 0
  });

  const handleDeductionChange = (name, value) => {
    setDeductions(prev => ({
      ...prev,
      [name]: Math.min(Number(value) || 0, DEDUCTION_LIMITS[name] || 100000)
    }));
  };

  const calculateTax = () => {
    let taxableIncome = income;
    let totalDeductions = 0;
    
    // Apply deductions for oldregime only
    if (taxRegime === 'oldregime') {
      totalDeductions = DEDUCTION_LIMITS.standardDeduction;
      Object.values(deductions).forEach(deduction => {
        totalDeductions += deduction;
      });
      taxableIncome = Math.max(0, income - totalDeductions);
    }

    // Calculate basic tax based on regime
    let tax = 0;
    
    if (taxRegime === 'oldregime') {
      // Old Regime Tax Calculation
      let exemptionLimit = 250000; // Default for below 60
      
      // Fix the age bracket conditions
      if (ageBracket === '60to80') {
        exemptionLimit = 300000;
        console.log('Setting exemption limit for 60-80:', exemptionLimit); // Debug log
      } else if (ageBracket === 'above80') {
        exemptionLimit = 500000;
      }

      taxableIncome = Math.max(0, taxableIncome - exemptionLimit);
      console.log('Age Bracket:', ageBracket, 'Exemption Limit:', exemptionLimit); // Debug log
      
      if (taxableIncome > 1000000) {
        tax = (taxableIncome - 1000000) * 0.3 + 112500; // Tax for 5L-10L bracket
      } else if (taxableIncome > 500000) {
        tax = (taxableIncome - 500000) * 0.2 + 12500; // Tax for 2.5L-5L bracket
      } else if (taxableIncome > 0) {
        tax = taxableIncome * 0.05;
      }
    } else {
      // New Regime Tax Calculation
      if (income <= 300000) {
        tax = 0;
      } else {
        // Apply standard deduction of 75,000 for salaried individuals
        taxableIncome = Math.max(0, income - 75000);
        
        if (taxableIncome > 1500000) {
          tax = (taxableIncome - 1500000) * 0.3 + 187500;
        } else if (taxableIncome > 1200000) {
          tax = (taxableIncome - 1200000) * 0.20 + 127500;
        } else if (taxableIncome > 900000) {
          tax = (taxableIncome - 900000) * 0.15 + 82500;
        } else if (taxableIncome > 600000) {
          tax = (taxableIncome - 600000) * 0.10 + 45000;
        } else if (taxableIncome > 300000) {
          tax = (taxableIncome - 300000) * 0.05;
        }
        
        // Apply rebate under Section 87A
        if (taxableIncome <= 700000) {
          tax = 0;
        }
      }
    }
    
    // Add capital gains tax (same for both regimes)
    const stcgTax = shortTermCapitalGains * 0.15;
    const taxableLongTermGains = Math.max(0, longTermCapitalGains - 100000);
    const ltcgTax = taxableLongTermGains * 0.1;
    
    tax += stcgTax + ltcgTax;
    
    const totalIncome = income + shortTermCapitalGains + longTermCapitalGains;
    const netIncome = totalIncome - tax;
    const effectiveTaxRate = totalIncome > 0 ? (tax / totalIncome) * 100 : 0;

    return {
      taxableIncome: Math.max(0, taxableIncome),
      tax: Math.max(0, tax),
      netIncome,
      effectiveTaxRate,
      totalDeductions
    };
  };

  useEffect(() => {
    const result = calculateTax();
    setTaxResult(result);
  }, [income, shortTermCapitalGains, longTermCapitalGains, deductions, ageBracket, taxRegime]);

  // Calculate individual tax components
  const calculateTaxComponents = () => {
    const result = calculateTax();
    const { tax, totalDeductions, netIncome } = result;
    
    // Split the tax into components
    const basicIncomeTax = tax - (shortTermCapitalGains * 0.15) - 
      (Math.max(0, longTermCapitalGains - 100000) * 0.1);
    
    return {
      basicIncomeTax: Math.max(0, basicIncomeTax),
      stcgTax: shortTermCapitalGains * 0.15,
      ltcgTax: Math.max(0, longTermCapitalGains - 100000) * 0.1,
      totalDeductions,
      netIncome
    };
  };

  const taxComponents = calculateTaxComponents();

  // Updated chart data with more detailed breakdown
  const chartData = {
    labels: [
      'Net Income',
      'Basic Income Tax',
      'STCG Tax',
      'LTCG Tax',
    ],
    datasets: [{
      data: [
        taxComponents.netIncome,
        taxComponents.basicIncomeTax,
        taxComponents.stcgTax,
        taxComponents.ltcgTax
      ],
      backgroundColor: [
        'rgb(59, 130, 246)', // Blue for Net Income
        'rgb(239, 68, 68)',  // Red for Basic Tax
        'rgb(249, 115, 22)', // Orange for STCG
        'rgb(234, 179, 8)',  // Yellow for LTCG
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
        align: 'center',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11
          },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => ({
                text: `${label}: ₹${data.datasets[0].data[i].toLocaleString()}`,
                fillStyle: data.datasets[0].backgroundColor[i],
                hidden: false,
                lineCap: 'butt',
                lineDash: [],
                lineDashOffset: 0,
                lineJoin: 'miter',
                lineWidth: 1,
                strokeStyle: data.datasets[0].backgroundColor[i],
                index: i
              }));
            }
            return [];
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ₹${context.raw.toLocaleString()}`;
          }
        }
      }
    }
  };

  const getTaxSavingSuggestions = () => {
    const suggestions = [];
    
    if (taxRegime === 'old') {
      const used80C = deductions?.section80C || 0;
      const remaining80C = DEDUCTION_LIMITS.section80C - used80C;
      
      if (remaining80C > 0) {
        suggestions.push({
          title: "Section 80C",
          description: `Invest ₹${remaining80C.toLocaleString()} more in ELSS, PPF, or EPF to save up to ₹${(remaining80C * 0.3).toLocaleString()} in tax.`
        });
      }

      const used80D = deductions?.section80D || 0;
      const remaining80D = DEDUCTION_LIMITS.section80D - used80D;
      if (remaining80D > 0) {
        suggestions.push({
          title: "Health Insurance (80D)",
          description: `Get health insurance coverage to claim additional deduction of up to ₹${remaining80D.toLocaleString()}.`
        });
      }
    }

    if (income > 500000) {
      suggestions.push({
        title: "NPS Investment",
        description: "Consider investing in NPS under Section 80CCD(1B) for additional ₹50,000 deduction."
      });
    }

    return suggestions;
  };

  const downloadPDF = async () => {
    try {
      const element = document.querySelector('.tax-calculator-container');
      if (!element) {
        console.error('Calculator container not found');
        return;
      }
      
      const canvas = await html2canvas(element, {
        scale: 2, // Better quality
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      saveAs(dataUrl, 'tax-calculation.png');
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const saveCalculation = async () => {
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
      saveAs(dataUrl, 'saved-calculation.png');
    } catch (error) {
      console.error('Error saving calculation:', error);
    }
  };

  const shareResults = async () => {
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
      
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'tax-calculation.png', { type: 'image/png' });
        try {
          await navigator.share({
            title: 'My Tax Calculation',
            text: 'Check out my tax calculation from Finance Calculator',
            files: [file]
          });
        } catch (error) {
          console.log('Error sharing:', error);
        }
      } else {
        // Fallback for browsers that don't support native sharing
        const shareWindow = window.open('', '_blank');
        if (shareWindow) {
          shareWindow.document.write(`
            <html>
              <body>
                <h2>Share on:</h2>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                  <a href="https://twitter.com/intent/tweet?text=My Tax Calculation&url=${encodeURIComponent(dataUrl)}" target="_blank">Twitter</a>
                  <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(dataUrl)}" target="_blank">Facebook</a>
                  <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(dataUrl)}" target="_blank">LinkedIn</a>
                  <a href="https://api.whatsapp.com/send?text=My Tax Calculation ${encodeURIComponent(dataUrl)}" target="_blank">WhatsApp</a>
                </div>
              </body>
            </html>
          `);
        }
      }
    } catch (error) {
      console.error('Error sharing results:', error);
    }
  };

  return (
    <div className="tax-calculator-container flex flex-col lg:flex-row gap-3">
      <div className="lg:w-2/3 space-y-3">
        <div className="bg-white p-3 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-3">Income Details</h2>
          <div className="mb-3">
            <DraggableSlider
              label="Annual Income"
              value={income}
              setValue={setIncome}
              min={0}
              max={10000000}
              step={10000}
              currencySymbol="₹"
              currentYear={new Date().getFullYear()}
              showYear={false}
            />
          </div>
          <div className="flex gap-3 mb-3">
            <div className="w-1/2">
              <DraggableSlider
                label="Short-term Capital Gains"
                value={shortTermCapitalGains}
                setValue={setShortTermCapitalGains}
                min={0}
                max={10000000}
                step={10000}
                currencySymbol="₹"
                currentYear={new Date().getFullYear()}
                showYear={false}
              />
            </div>
            <div className="w-1/2">
              <DraggableSlider
                label="Long-term Capital Gains"
                value={longTermCapitalGains}
                setValue={setLongTermCapitalGains}
                min={0}
                max={10000000}
                step={10000}
                currencySymbol="₹"
                currentYear={new Date().getFullYear()}
                showYear={false}
              />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">Age Bracket</h3>
            <div className="flex gap-2">
              {['Below 60', '60 to 80', 'Above 80'].map((age) => (
                <button
                  key={age}
                  className={`flex-1 px-4 py-2 rounded-md text-sm ${
                    ageBracket === age.toLowerCase().replace(/\s+/g, '')
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => {
                    const newAgeBracket = age.toLowerCase().replace(/\s+/g, '');
                    console.log('Setting age bracket to:', newAgeBracket); // Debug log
                    setAgeBracket(newAgeBracket);
                  }}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2">Select Tax Regime</h3>
            <div className="flex gap-2">
              {['Old Regime', 'New Regime'].map((regime) => (
                <button
                  key={regime}
                  className={`flex-1 px-4 py-2 rounded-md ${
                    taxRegime === regime.toLowerCase().replace(' ', '')
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => {
                    const newRegime = regime.toLowerCase().replace(' ', '');
                    console.log('Selected Tax Regime:', newRegime);
                    setTaxRegime(newRegime);
                  }}
                >
                  {regime}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            {taxRegime === 'oldregime' ? (
              <>
                <button 
                  className="w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
                  onClick={() => setShowDeductions(!showDeductions)}
                >
                  {showDeductions ? 'Hide' : 'Show'} Deductions
                </button>

                {showDeductions && (
                  <div className="mt-3">
                    <h2 className="text-lg font-bold mb-2">Deductions</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(deductions).map(([name, value]) => (
                        <div key={name}>
                          <DraggableSlider
                            label={name.replace('section', 'Section ')}
                            value={value}
                            setValue={(newValue) => handleDeductionChange(name, newValue)}
                            min={0}
                            max={DEDUCTION_LIMITS[name] || 100000}
                            step={1000}
                            currencySymbol="₹"
                            currentYear={new Date().getFullYear()}
                            showYear={false}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="mt-2 p-3 bg-blue-50 text-blue-600 rounded-lg text-sm">
                No deductions available in New Regime
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Tax Saving Suggestions</h2>
          <div className="grid grid-cols-1 gap-2">
            {getTaxSavingSuggestions().map((suggestion, index) => (
              <div 
                key={index}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-2.5"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500 rounded-lg p-1.5 flex-shrink-0">
                    <svg 
                      className="w-4 h-4 text-white" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gray-800 font-medium text-sm">
                      {suggestion.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:w-1/3 space-y-3">
        <div className="bg-white p-3 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-2">Tax Breakdown</h2>
          
          <div className="flex flex-col justify-center" style={{ height: '220px' }}>
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
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-3">
            <div className="grid grid-cols-2 gap-3">
              <TaxResultCard 
                label="Net Income" 
                value={`₹${taxResult.netIncome.toLocaleString()}`} 
              />
              <TaxResultCard 
                label="Taxable Income" 
                value={`₹${taxResult.taxableIncome.toLocaleString()}`} 
              />
              <TaxResultCard 
                label="Tax Amount" 
                value={`₹${taxResult.tax.toLocaleString()}`} 
              />
              <TaxResultCard 
                label="Effective Tax Rate" 
                value={`${taxResult.effectiveTaxRate.toFixed(1)}%`} 
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-lg shadow mt-3">
          <h2 className="text-xl font-bold mb-2">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={downloadPDF}
              className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-600 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF Report
            </button>
            <button 
              onClick={saveCalculation}
              className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-600 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Save Calculation
            </button>
            <button 
              onClick={shareResults}
              className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-600 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Results
            </button>
            <button 
              className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm text-blue-600 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Compare Regimes
            </button>
          </div>

          <div className="mt-3">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Important Dates</h3>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center p-1.5 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-800">Advance Tax (Q3)</div>
                <div className="text-xs font-semibold text-blue-600">Dec 15, 2024</div>
              </div>
              <div className="flex justify-between items-center p-1.5 bg-red-50 rounded-lg">
                <div className="text-xs text-gray-800">Tax Filing</div>
                <div className="text-xs font-semibold text-red-600">Jul 31, 2024</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
