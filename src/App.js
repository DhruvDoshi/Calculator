import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import SIPCalculator from './components/SIPCalculator';

function App() {
  return (
    <Router>
      <div className="App">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sip" element={<SIPCalculator />} />
          {/* Add routes for Tax and Retirement calculators when they're ready */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;