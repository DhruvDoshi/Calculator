import React from 'react';

const IndiaTaxSavings = ({ income }) => {
  const getSuggestions = (income) => {
    const suggestions = [
      {
        name: "Section 80C investments",
        description: "Invest in PPF, ELSS, or pay LIC premiums",
        limit: 150000,
        applicable: true
      },
      {
        name: "National Pension System (NPS)",
        description: "Additional deduction under Section 80CCD(1B)",
        limit: 50000,
        applicable: true
      },
      {
        name: "Health Insurance Premium",
        description: "Deduction under Section 80D",
        limit: 25000,
        applicable: true
      },
      {
        name: "Home Loan Interest",
        description: "Deduction under Section 24",
        limit: 200000,
        applicable: income > 500000
      },
      {
        name: "Education Loan Interest",
        description: "Deduction under Section 80E",
        limit: "No limit",
        applicable: income > 400000
      }
    ];

    return suggestions.filter(suggestion => suggestion.applicable);
  };

  const suggestions = getSuggestions(income);

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3">Tax Saving Suggestions for India</h2>
      <ul className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <li key={index} className="bg-blue-50 p-3 rounded">
            <h3 className="font-medium">{suggestion.name}</h3>
            <p className="text-sm text-gray-600">{suggestion.description}</p>
            <p className="text-sm text-gray-600">
              Limit: {typeof suggestion.limit === 'number' ? `₹${suggestion.limit.toLocaleString()}` : suggestion.limit}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-gray-500">
        Note: These are general suggestions. Please consult a tax professional for personalized advice.
      </p>
    </div>
  );
};

export default IndiaTaxSavings;
