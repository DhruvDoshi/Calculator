import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import HomePage from './components/HomePage';
import InvestmentCalculator from './components/InvestmentCalculator';
import TaxCalculatorApp from './components/TaxCalculatorApp';

function App() {
  return (
    <Router>
      <div className="App">
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/investment" element={<InvestmentCalculator />} />
          <Route path="/tax" element={<TaxCalculatorApp />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
