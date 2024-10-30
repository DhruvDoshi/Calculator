import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import DraggableSlider from '../TaxInputSlider';

ChartJS.register(ArcElement, Tooltip, Legend);

const DEDUCTION_LIMITS = {
  standardDeduction: 50000,
  section80C: 150000,
  section80D: 25000,
  section80E: Infinity,
  section80TTA: 10000,
  section24b: 200000
};

const TaxResultCard = ({ label, value }) => (
  <div className="bg-blue-500 bg-opacity-20 rounded-lg p-3">
    <div className="text-xs text-blue-100">{label}</div>
    <div className="text-white text-lg font-semibold">{value}</div>
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
      [name]: Math.min(Number(value) || 0, DEDUCTION_LIMITS[name] || Infinity)
    }));
  };

  useEffect(() => {
    // Calculate tax here
    const calculateTax = () => {
      let taxableIncome = income;
      
      // Apply deductions
      if (taxRegime === 'old') {
        taxableIncome -= DEDUCTION_LIMITS.standardDeduction;
        Object.values(deductions).forEach(deduction => {
          taxableIncome -= deduction;
        });
      }
      
      // Calculate tax based on regime and brackets
      let tax = 0;
      if (taxableIncome > 1000000) {
        tax = (taxableIncome - 1000000) * 0.3 + 112500;
      } else if (taxableIncome > 500000) {
        tax = (taxableIncome - 500000) * 0.2 + 12500;
      } else if (taxableIncome > 250000) {
        tax = (taxableIncome - 250000) * 0.05;
      }
      
      // Add capital gains tax
      tax += shortTermCapitalGains * 0.15;
      const taxableLongTermGains = Math.max(0, longTermCapitalGains - 100000);
      tax += taxableLongTermGains * 0.1;
      
      const totalIncome = income + shortTermCapitalGains + longTermCapitalGains;
      const netIncome = totalIncome - tax;
      const effectiveTaxRate = totalIncome > 0 ? (tax / totalIncome) * 100 : 0;

      setTaxResult({
        taxableIncome: Math.max(0, taxableIncome),
        tax: Math.max(0, tax),
        netIncome,
        effectiveTaxRate
      });
    };

    calculateTax();
  }, [income, shortTermCapitalGains, longTermCapitalGains, deductions, ageBracket, taxRegime]);

  // Calculate individual tax components
  const calculateTaxComponents = () => {
    const basicIncomeTax = taxResult.tax - (shortTermCapitalGains * 0.15) - (Math.max(0, longTermCapitalGains - 100000) * 0.1);
    const stcgTax = shortTermCapitalGains * 0.15;
    const ltcgTax = Math.max(0, longTermCapitalGains - 100000) * 0.1;
    const totalDeductions = taxRegime === 'old' ? 
      (DEDUCTION_LIMITS.standardDeduction + Object.values(deductions).reduce((a, b) => a + b, 0)) : 0;

    return {
      basicIncomeTax,
      stcgTax,
      ltcgTax,
      totalDeductions,
      netIncome: taxResult.netIncome
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

  return (
    <div className="flex flex-col lg:flex-row gap-3">
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
                    ageBracket === age.toLowerCase().replace(' ', '')
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  onClick={() => setAgeBracket(age.toLowerCase().replace(' ', ''))}
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
                  onClick={() => setTaxRegime(regime.toLowerCase().replace(' ', ''))}
                >
                  {regime}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <button 
              className="w-full py-1.5 px-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
              onClick={() => setShowDeductions(!showDeductions)}
            >
              {showDeductions ? 'Hide' : 'Show'} Deductions
            </button>
          </div>
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
                      max={DEDUCTION_LIMITS[name] || Infinity}
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
        </div>

        <div className="bg-white p-3 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-3">Tax Saving Suggestions</h2>
          <div className="grid grid-cols-2 gap-3">
            {getTaxSavingSuggestions().map((suggestion, index) => (
              <div 
                key={index}
                className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-3"
              >
                <div className="flex items-start space-x-3">
                  <div className="bg-white bg-opacity-20 rounded-full p-2 mt-1">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z" 
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {suggestion.title}
                    </h3>
                    <p className="text-blue-100 text-sm mt-1">
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
                label="Taxable Income" 
                value={`₹${taxResult.taxableIncome.toLocaleString()}`} 
              />
              <TaxResultCard 
                label="Tax Amount" 
                value={`₹${taxResult.tax.toLocaleString()}`} 
              />
              <TaxResultCard 
                label="Net Income" 
                value={`₹${taxResult.netIncome.toLocaleString()}`} 
              />
              <TaxResultCard 
                label="Effective Tax Rate" 
                value={`${taxResult.effectiveTaxRate.toFixed(1)}%`} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
