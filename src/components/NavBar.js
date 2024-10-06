import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const NavBar = () => {
  const [isInvestmentOpen, setIsInvestmentOpen] = useState(false);

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="font-bold text-xl">Finance Calculator</span>
        </Link>
        <div className="space-x-4 flex items-center">
          <div className="relative">
            <button 
              className="hover:text-gray-300 focus:outline-none"
              onMouseEnter={() => setIsInvestmentOpen(true)}
              onMouseLeave={() => setIsInvestmentOpen(false)}
            >
              Investment
              <svg className="w-4 h-4 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isInvestmentOpen && (
              <div 
                className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                onMouseEnter={() => setIsInvestmentOpen(true)}
                onMouseLeave={() => setIsInvestmentOpen(false)}
              >
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  <Link to="/sip" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">SIP Calculator</Link>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900" role="menuitem">Lumpsum Calculator</a>
                </div>
              </div>
            )}
          </div>
          <a href="#" className="hover:text-gray-300">Tax Calculator</a>
          <a href="#" className="hover:text-gray-300">Retirement</a>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
