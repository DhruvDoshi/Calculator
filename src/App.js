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
        </Routes>
      </div>
    </Router>
  );
}

export default App;