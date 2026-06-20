import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import Dashboard from './pages/Dashboard';
import TestCases from './pages/TestCases';
import TestSuites from './pages/TestSuites';
import SuiteDetail from './pages/SuiteDetail';
import Bugs from './pages/Bugs';
import BugDetail from './pages/BugDetail';
import TestRuns from './pages/TestRuns';
import TestRunDetail from './pages/TestRunDetail';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import TestCaseImport from './pages/TestCaseImport';
import FlakyTests from './pages/FlakyTests';
import Settings from './pages/Settings';
import KeyboardManager from './components/KeyboardManager';

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <KeyboardManager />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/test-cases" element={<TestCases />} />
        <Route path="/test-cases/import" element={<TestCaseImport />} />
        <Route path="/test-suites" element={<TestSuites />} />
        <Route path="/test-suites/:id" element={<SuiteDetail />} />
        <Route path="/bugs" element={<Bugs />} />
        <Route path="/bugs/:id" element={<BugDetail />} />
        <Route path="/test-runs" element={<TestRuns />} />
        <Route path="/test-runs/:id" element={<TestRunDetail />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
        <Route path="/flaky-tests" element={<FlakyTests />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
