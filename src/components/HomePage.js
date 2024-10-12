import React from 'react';
import { Link } from 'react-router-dom';

const CalculatorCard = ({ title, description, link }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 mb-4">{description}</p>
    <Link to={link} className="text-blue-500 hover:text-blue-600">
      {description === "Coming soon..." ? "Learn More" : "Calculate Now"}
    </Link>
  </div>
);

const HomePage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Welcome to Finance Calculator</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CalculatorCard
          title="SIP Calculator"
          description="Calculate your Systematic Investment Plan returns"
          link="/investment?type=sip"
        />
        <CalculatorCard
          title="Lumpsum Calculator"
          description="Calculate your Lumpsum Investment returns"
          link="/investment?type=lumpsum"
        />
        <CalculatorCard
          title="Tax Calculator"
          description="Calculate your income tax"
          link="/tax"
        />
        <CalculatorCard
          title="Retirement Calculator"
          description="Coming soon..."
          link="/retirement"
        />
      </div>
    </div>
  );
};

export default HomePage;
