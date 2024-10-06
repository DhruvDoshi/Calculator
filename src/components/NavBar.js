import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="font-bold text-xl">Finance Calculator</span>
        </Link>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        {/* Desktop menu */}
        <div className="hidden md:flex space-x-4 items-center">
          <Link to="/investmentcalculator" className="hover:text-gray-300">Investment Calculator</Link>
          <Link to="/tax" className="hover:text-gray-300">Tax Calculator</Link>
          <Link to="/retirement" className="hover:text-gray-300">Retirement</Link>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4">
          <Link to="/investmentcalculator" className="block py-2 hover:text-gray-300">Investment Calculator</Link>
          <Link to="/tax" className="block py-2 hover:text-gray-300">Tax Calculator</Link>
          <Link to="/retirement" className="block py-2 hover:text-gray-300">Retirement</Link>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
