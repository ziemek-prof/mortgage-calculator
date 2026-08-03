import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { InputSection } from './components/InputSection';
import { PrepaymentInputs } from './components/PrepaymentInputs';
import { SummaryCards } from './components/SummaryCards';
import { ChartsSection } from './components/ChartsSection';
import { AmortizationTable } from './components/AmortizationTable';
import { ScenarioComparer } from './components/ScenarioComparer';

import {
  MortgageInputs,
  PrepaymentOptions,
  SavedScenario,
  CurrencySymbol,
} from './types/mortgage';
import {
  DEFAULT_INPUTS,
  DEFAULT_PREPAYMENTS,
  calculateMortgage,
} from './utils/mortgageCalculations';
import { exportMortgagePDFReport } from './utils/pdfExport';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [currency, setCurrency] = useState<CurrencySymbol>('$');
  const [activeTab, setActiveTab] = useState<'calculator' | 'scenarios'>('calculator');

  const [inputs, setInputs] = useState<MortgageInputs>(DEFAULT_INPUTS);
  const [prepayments, setPrepayments] = useState<PrepaymentOptions>(DEFAULT_PREPAYMENTS);

  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    try {
      const stored = localStorage.getItem('mortgage_scenarios');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save scenarios to local storage
  useEffect(() => {
    try {
      localStorage.setItem('mortgage_scenarios', JSON.stringify(savedScenarios));
    } catch {
      // ignore
    }
  }, [savedScenarios]);

  // Compute results
  const result = useMemo(() => {
    return calculateMortgage(inputs, prepayments);
  }, [inputs, prepayments]);

  // Reset to defaults
  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
    setPrepayments(DEFAULT_PREPAYMENTS);
  };

  // Export PDF Report
  const handleExportPDF = () => {
    exportMortgagePDFReport(inputs, prepayments, result, currency);
  };

  // Load a scenario
  const handleLoadScenario = (scenario: SavedScenario) => {
    setInputs(scenario.inputs);
    setPrepayments(scenario.prepayments);
    setActiveTab('calculator');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currency={currency}
        setCurrency={setCurrency}
        onExportPDF={handleExportPDF}
        onReset={handleReset}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedScenariosCount={savedScenarios.length}
      />

      {/* Main Content Layout */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {activeTab === 'calculator' ? (
          <>
            {/* Realtime Executive Summary Metrics */}
            <SummaryCards
              result={result}
              currency={currency}
              includePITI={inputs.includePITI}
            />

            {/* Main Interactive Grid: Inputs on Left, Charts & Amortization on Right */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Column: Loan Inputs & Prepayments */}
              <div className="space-y-6 lg:col-span-5">
                <InputSection
                  inputs={inputs}
                  setInputs={setInputs}
                  currency={currency}
                />

                <PrepaymentInputs
                  prepayments={prepayments}
                  setPrepayments={setPrepayments}
                  currency={currency}
                  totalMonths={inputs.loanTermYears * 12}
                />
              </div>

              {/* Right Column: Charts & Detailed Amortization Table */}
              <div className="space-y-6 lg:col-span-7">
                <ChartsSection
                  result={result}
                  currency={currency}
                  includePITI={inputs.includePITI}
                />

                <AmortizationTable
                  standardSchedule={result.standardSchedule}
                  prepaymentSchedule={result.prepaymentSchedule}
                  currency={currency}
                />
              </div>
            </div>
          </>
        ) : (
          /* Scenarios Comparison View */
          <ScenarioComparer
            currentInputs={inputs}
            currentPrepayments={prepayments}
            currentResult={result}
            savedScenarios={savedScenarios}
            setSavedScenarios={setSavedScenarios}
            onLoadScenario={handleLoadScenario}
            currency={currency}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4">
          <p>
            Mortgage Calculator & Payoff Accelerator • Real-time amortization schedule, prepayment analytics & PDF reports.
          </p>
        </div>
      </footer>
    </div>
  );
}
