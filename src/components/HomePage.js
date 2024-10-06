import React from 'react';
import SIPCalculator from './SIPCalculator';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      <header className="py-4 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-accent-primary">Finance Calculator</h1>
          <button className="bg-accent-primary text-white py-2 px-4 rounded-md">Login/Register</button>
        </div>
      </header>
      <main className="mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SIPCalculator />
        </div>
      </main>
    </div>
  );
};

export default HomePage;