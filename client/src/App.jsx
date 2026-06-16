import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import TestCases from './pages/TestCases';
import TestSuites from './pages/TestSuites';
import SuiteDetail from './pages/SuiteDetail';
import Bugs from './pages/Bugs';
import BugDetail from './pages/BugDetail';
import TestRuns from './pages/TestRuns';
import TestRunDetail from './pages/TestRunDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/test-cases" element={<TestCases />} />
        <Route path="/test-suites" element={<TestSuites />} />
        <Route path="/test-suites/:id" element={<SuiteDetail />} />
        <Route path="/bugs" element={<Bugs />} />
        <Route path="/bugs/:id" element={<BugDetail />} />
        <Route path="/test-runs" element={<TestRuns />} />
        <Route path="/test-runs/:id" element={<TestRunDetail />} />
        <Route path="*" element={<Navigate to="/test-cases" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
