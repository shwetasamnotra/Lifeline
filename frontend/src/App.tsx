import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import { useWebSocket } from './hooks/useWebSocket';
import CommandCentre from './pages/CommandCentre';
import LiveDisasterMap from './pages/LiveDisasterMap';
import IsolationIntelligence from './pages/IsolationIntelligence';
import ReliefOperations from './pages/ReliefOperations';
import RoutePlanner from './pages/RoutePlanner';
import HistoricalAnalysis from './pages/HistoricalAnalysis';
import ScenarioSimulator from './pages/ScenarioSimulator';
import SystemStatus from './pages/SystemStatus';
import './index.css';

function AppInner() {
  // Establish WebSocket connection globally
  useWebSocket();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <TopHeader />
        <Routes>
          <Route path="/" element={<CommandCentre />} />
          <Route path="/map" element={<LiveDisasterMap />} />
          <Route path="/isolation" element={<IsolationIntelligence />} />
          <Route path="/relief" element={<ReliefOperations />} />
          <Route path="/routes" element={<RoutePlanner />} />
          <Route path="/historical" element={<HistoricalAnalysis />} />
          <Route path="/simulator" element={<ScenarioSimulator />} />
          <Route path="/system" element={<SystemStatus />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
