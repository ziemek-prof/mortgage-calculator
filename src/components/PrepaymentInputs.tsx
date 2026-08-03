import React from 'react';
import {
  Zap,
  DollarSign,
  Calendar,
  RotateCcw,
  Sparkles,
  TrendingDown,
} from 'lucide-react';
import { PrepaymentOptions, CurrencySymbol } from '../types/mortgage';
import { formatCurrency } from '../utils/mortgageCalculations';

interface PrepaymentInputsProps {
  prepayments: PrepaymentOptions;
  setPrepayments: React.Dispatch<React.SetStateAction<PrepaymentOptions>>;
  currency: CurrencySymbol;
  totalMonths: number;
}

export const PrepaymentInputs: React.FC<PrepaymentInputsProps> = ({
  prepayments,
  setPrepayments,
  currency,
  totalMonths,
}) => {
  const handleChange = (field: keyof PrepaymentOptions, value: number) => {
    setPrepayments((prev) => ({
      ...prev,
      [field]: Math.max(0, value),
    }));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const presets = [50, 100, 200, 300, 500];

  const handleResetPrepayments = () => {
    setPrepayments({
      extraMonthly: 0,
      extraYearly: 0,
      extraYearlyMonth: 12,
      lumpSumAmount: 0,
      lumpSumMonth: 12,
    });
  };

  const hasPrepayments =
    prepayments.extraMonthly > 0 ||
    prepayments.extraYearly > 0 ||
    prepayments.lumpSumAmount > 0;

  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/50 to-white p-5 shadow-sm transition-all dark:border-emerald-900/50 dark:from-emerald-950/20 dark:to-slate-900">
      <div className="mb-4 flex items-center justify-between border-b border-emerald-100 pb-3 dark:border-emerald-900/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Early Payoff & Prepayments
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Accelerate payoff & reduce total interest
            </p>
          </div>
        </div>

        {hasPrepayments && (
          <button
            onClick={handleResetPrepayments}
            className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:bg-slate-800 dark:text-emerald-300"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Extra Monthly Payment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Extra Monthly Payment
            </label>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(prepayments.extraMonthly, currency)}/mo
            </span>
          </div>

          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 text-sm font-semibold">{currency}</span>
            <input
              type="number"
              min={0}
              step={25}
              value={prepayments.extraMonthly || ''}
              onChange={(e) => handleChange('extraMonthly', Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Preset Buttons */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {presets.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleChange('extraMonthly', amt)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all border ${
                  prepayments.extraMonthly === amt
                    ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                +{currency}{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Extra Annual Payment */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Extra Annual Payment
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-sm font-semibold">{currency}</span>
              <input
                type="number"
                min={0}
                step={500}
                value={prepayments.extraYearly || ''}
                onChange={(e) => handleChange('extraYearly', Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Paid Every Year In
            </label>
            <select
              value={prepayments.extraYearlyMonth}
              onChange={(e) => handleChange('extraYearlyMonth', Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {monthNames.map((mName, idx) => (
                <option key={mName} value={idx + 1}>
                  {mName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* One-Time Lump Sum Payment */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              One-Time Lump Sum
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 text-sm font-semibold">{currency}</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={prepayments.lumpSumAmount || ''}
                onChange={(e) => handleChange('lumpSumAmount', Number(e.target.value))}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Payment Timing
            </label>
            <select
              value={prepayments.lumpSumMonth}
              onChange={(e) => handleChange('lumpSumMonth', Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {[12, 24, 36, 48, 60, 120].map((m) => (
                <option key={m} value={m}>
                  Month {m} (Year {m / 12})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
