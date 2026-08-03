import React from 'react';
import {
  Calculator,
  Moon,
  Sun,
  FileDown,
  RotateCcw,
  Sparkles,
  GitCompare,
} from 'lucide-react';
import { CurrencySymbol } from '../types/mortgage';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  currency: CurrencySymbol;
  setCurrency: (curr: CurrencySymbol) => void;
  onExportPDF: () => void;
  onReset: () => void;
  activeTab: 'calculator' | 'scenarios';
  setActiveTab: (tab: 'calculator' | 'scenarios') => void;
  savedScenariosCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  setDarkMode,
  currency,
  setCurrency,
  onExportPDF,
  onReset,
  activeTab,
  setActiveTab,
  savedScenariosCount,
}) => {
  const currencies: CurrencySymbol[] = ['$', '€', '£', 'C$', 'A$'];

  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 dark:bg-blue-500">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Mortgage Pro
            </h1>
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
              by Prof. Ziemek
            </p>
          </div>
        </div>

        {/* Center Tabs: Calculator vs Scenarios */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'calculator'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Calculator
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'scenarios'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <GitCompare className="h-3.5 w-3.5" />
            Compare
            {savedScenariosCount > 0 && (
              <span className="ml-0.5 rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                {savedScenariosCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Currency Selector */}
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as CurrencySymbol)}
              className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              aria-label="Select Currency"
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr} Currency
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <button
            onClick={onReset}
            title="Reset to default values"
            className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* PDF Export Button */}
          <button
            onClick={onExportPDF}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">PDF Report</span>
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
