import React, { useState } from 'react';
import {
  GitCompare,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  BookmarkPlus,
  Sparkles,
} from 'lucide-react';
import {
  SavedScenario,
  MortgageInputs,
  PrepaymentOptions,
  CalculationResult,
  CurrencySymbol,
} from '../types/mortgage';
import { formatCurrency, formatMonthsToYearsAndMonths } from '../utils/mortgageCalculations';

interface ScenarioComparerProps {
  currentInputs: MortgageInputs;
  currentPrepayments: PrepaymentOptions;
  currentResult: CalculationResult;
  savedScenarios: SavedScenario[];
  setSavedScenarios: React.Dispatch<React.SetStateAction<SavedScenario[]>>;
  onLoadScenario: (scenario: SavedScenario) => void;
  currency: CurrencySymbol;
}

export const ScenarioComparer: React.FC<ScenarioComparerProps> = ({
  currentInputs,
  currentPrepayments,
  currentResult,
  savedScenarios,
  setSavedScenarios,
  onLoadScenario,
  currency,
}) => {
  const [newScenarioName, setNewScenarioName] = useState('');

  const handleSaveCurrent = () => {
    const name =
      newScenarioName.trim() ||
      `${currentInputs.loanTermYears}Yr @ ${currentInputs.interestRate}% ${
        currentPrepayments.extraMonthly > 0
          ? `(+$${currentPrepayments.extraMonthly}/mo)`
          : ''
      }`;

    const newScenario: SavedScenario = {
      id: Date.now().toString(),
      name,
      inputs: { ...currentInputs },
      prepayments: { ...currentPrepayments },
      result: { ...currentResult },
      createdAt: Date.now(),
    };

    setSavedScenarios((prev) => [newScenario, ...prev.slice(0, 3)]); // Keep up to 4 scenarios
    setNewScenarioName('');
  };

  const handleDeleteScenario = (id: string) => {
    setSavedScenarios((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Scenario Comparison Tool
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Save different loan terms, interest rates, or prepayment strategies to compare side-by-side
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Scenario name (optional)..."
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <button
              onClick={handleSaveCurrent}
              className="flex items-center gap-1.5 shrink-0 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500"
            >
              <BookmarkPlus className="h-4 w-4" />
              Save Current Setup
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-side Comparison Grid */}
      {savedScenarios.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
          <GitCompare className="mx-auto h-8 w-8 text-slate-400" />
          <h3 className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            No saved scenarios yet
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Adjust your mortgage inputs above and click "Save Current Setup" to start comparing.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {savedScenarios.map((sc, idx) => {
            const hasExtra =
              sc.prepayments.extraMonthly > 0 || sc.prepayments.extraYearly > 0;

            return (
              <div
                key={sc.id}
                className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Scenario Title & Delete */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider dark:text-blue-400">
                      Scenario #{idx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {sc.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleDeleteScenario(sc.id)}
                    className="text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                    title="Delete scenario"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Scenario Metrics */}
                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Loan Amount:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(sc.result.loanAmount, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Rate & Term:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {sc.inputs.interestRate}% @ {sc.inputs.loanTermYears} Yrs
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Extra Monthly:</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {sc.prepayments.extraMonthly > 0
                        ? `+${formatCurrency(sc.prepayments.extraMonthly, currency)}`
                        : 'None'}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                    <span className="text-slate-500">Monthly P&I:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatCurrency(sc.result.monthlyPrincipalAndInterest, currency)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Interest:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {formatCurrency(
                        hasExtra
                          ? sc.result.totalInterestWithPrepayment
                          : sc.result.totalInterestStandard,
                        currency
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Payoff Date:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {hasExtra
                        ? sc.result.payoffDateWithPrepayment
                        : sc.result.payoffDateStandard}
                    </span>
                  </div>

                  {sc.result.interestSaved > 0 && (
                    <div className="rounded-xl bg-emerald-50 p-2 text-center text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      Saves {formatCurrency(sc.result.interestSaved, currency)} interest!
                    </div>
                  )}
                </div>

                {/* Load Button */}
                <button
                  onClick={() => onLoadScenario(sc)}
                  className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
                >
                  Load Into Calculator
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
