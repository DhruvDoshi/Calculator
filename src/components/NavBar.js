import React from 'react';
import { Link } from 'react-router-dom';

const NavBar = () => (
  <nav className="bg-gray-800 text-white p-4">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <Link to="/" className="flex items-center space-x-2">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="font-bold text-xl">Finance Calculator</span>
      </Link>
      <div className="space-x-4 flex items-center">
        <Link to="/sip" className="hover:text-gray-300">SIP Calculator</Link>
        <Link to="/tax" className="hover:text-gray-300">Tax Calculator</Link>
        <Link to="/retirement" className="hover:text-gray-300">Retirement</Link>
      </div>
    </div>
  </nav>
);

export default NavBar;
