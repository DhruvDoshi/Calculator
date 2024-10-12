import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import InvestmentCalculator from './components/InvestmentCalculator';
import TaxCalculator from './components/TaxCalculator';

function App() {
  return (
    <Router>
      <div className="App">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/investmentcalculator" element={<InvestmentCalculator />} />
          <Route path="/taxcalculator" element={<TaxCalculator />} />
          {/* Add routes for Tax and Retirement calculators when they're ready */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
