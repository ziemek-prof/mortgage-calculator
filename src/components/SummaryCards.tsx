import React from 'react';
import {
  DollarSign,
  TrendingDown,
  CalendarCheck,
  PiggyBank,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import { CalculationResult, CurrencySymbol } from '../types/mortgage';
import {
  formatCurrency,
  formatMonthsToYearsAndMonths,
} from '../utils/mortgageCalculations';

interface SummaryCardsProps {
  result: CalculationResult;
  currency: CurrencySymbol;
  includePITI: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  result,
  currency,
  includePITI,
}) => {
  const hasSavings = result.monthsSaved > 0 || result.interestSaved > 0;

  return (
    <div className="space-y-4">
      {/* Realtime Savings Banner */}
      {hasSavings && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white shadow-lg shadow-emerald-600/10 dark:from-emerald-700 dark:to-teal-800">
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 blur-xl"></div>
          <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <Sparkles className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-100">
                  <Zap className="h-3.5 w-3.5 text-amber-300" />
                  Prepayment Accelerator Active
                </div>
                <h3 className="text-xl font-black text-white">
                  Save {formatCurrency(result.interestSaved, currency)} in Total Interest!
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Your mortgage will be completely paid off{' '}
                  <span className="font-bold underline text-amber-300">
                    {formatMonthsToYearsAndMonths(result.monthsSaved)} sooner
                  </span>
                  !
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/20">
              <div className="text-right">
                <div className="text-[10px] text-emerald-100 uppercase font-semibold">
                  New Payoff Date
                </div>
                <div className="text-sm font-black text-white">
                  {result.payoffDateWithPrepayment}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Payment Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">
              {includePITI ? 'Total Monthly Payment (PITI)' : 'Monthly Principal & Interest'}
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(
              includePITI ? result.totalMonthlyPayment : result.monthlyPrincipalAndInterest,
              currency
            )}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            P&I: {formatCurrency(result.monthlyPrincipalAndInterest, currency)}
            {includePITI && (
              <span>
                + {formatCurrency(
                  result.totalMonthlyPayment - result.monthlyPrincipalAndInterest,
                  currency
                )} taxes/fees
              </span>
            )}
          </div>
        </div>

        {/* Total Interest Paid */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Total Interest Paid</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <PiggyBank className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(
              hasSavings ? result.totalInterestWithPrepayment : result.totalInterestStandard,
              currency
            )}
          </div>
          {hasSavings ? (
            <div className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <s>{formatCurrency(result.totalInterestStandard, currency)}</s> std interest
            </div>
          ) : (
            <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Over life of loan
            </div>
          )}
        </div>

        {/* Payoff Date */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-purple-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Mortgage Payoff Date</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {hasSavings ? result.payoffDateWithPrepayment : result.payoffDateStandard}
          </div>
          {hasSavings ? (
            <div className="mt-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
              vs {result.payoffDateStandard} standard
            </div>
          ) : (
            <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {result.monthsStandard} total payments
            </div>
          )}
        </div>

        {/* Total Cost / Principal */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-amber-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Total Paid (P + I)</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(
              hasSavings ? result.totalPaymentWithPrepayment : result.totalPaymentStandard,
              currency
            )}
          </div>
          <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Principal: {formatCurrency(result.loanAmount, currency)}
          </div>
        </div>
      </div>
    </div>
  );
};
