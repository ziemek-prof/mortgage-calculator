import React, { useState } from 'react';
import {
  Home,
  Percent,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Building,
  FileSpreadsheet,
} from 'lucide-react';
import { MortgageInputs, CurrencySymbol } from '../types/mortgage';
import { getDownPaymentAmount, getLoanAmount, formatCurrency } from '../utils/mortgageCalculations';

interface InputSectionProps {
  inputs: MortgageInputs;
  setInputs: React.Dispatch<React.SetStateAction<MortgageInputs>>;
  currency: CurrencySymbol;
}

export const InputSection: React.FC<InputSectionProps> = ({
  inputs,
  setInputs,
  currency,
}) => {
  const [showAdvancedPITI, setShowAdvancedPITI] = useState(false);

  const downPaymentAmount = getDownPaymentAmount(inputs);
  const loanAmount = getLoanAmount(inputs);
  const downPaymentPercent = inputs.homePrice > 0 ? (downPaymentAmount / inputs.homePrice) * 100 : 0;

  const handleChange = (field: keyof MortgageInputs, value: any) => {
    setInputs((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const termPresets = [10, 15, 20, 25, 30];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
            <Home className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Loan Parameters
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set home value, rate, and term
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-blue-50 px-2.5 py-1 text-right text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
          Loan: {formatCurrency(loanAmount, currency)}
        </div>
      </div>

      <div className="space-y-4">
        {/* Home Price */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Home Purchase Price
            </label>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {formatCurrency(inputs.homePrice, currency)}
            </span>
          </div>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-slate-400 text-sm font-semibold">{currency}</span>
            <input
              type="number"
              min={0}
              step={5000}
              value={inputs.homePrice || ''}
              onChange={(e) => handleChange('homePrice', Math.max(0, Number(e.target.value)))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
            />
          </div>
          <input
            type="range"
            min={50000}
            max={2000000}
            step={10000}
            value={inputs.homePrice}
            onChange={(e) => handleChange('homePrice', Number(e.target.value))}
            className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 dark:bg-slate-700 dark:accent-blue-400"
          />
        </div>

        {/* Down Payment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Down Payment
            </label>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {formatCurrency(downPaymentAmount, currency)} ({downPaymentPercent.toFixed(1)}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">
                {inputs.downPaymentType === 'amount' ? currency : '%'}
              </span>
              <input
                type="number"
                min={0}
                max={inputs.downPaymentType === 'percent' ? 100 : inputs.homePrice}
                step={inputs.downPaymentType === 'percent' ? 1 : 1000}
                value={inputs.downPayment || ''}
                onChange={(e) => handleChange('downPayment', Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
              />
            </div>

            {/* Percent vs Amount Toggle */}
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => {
                  if (inputs.downPaymentType !== 'percent') {
                    handleChange('downPaymentType', 'percent');
                    handleChange('downPayment', Math.min(100, Math.round(downPaymentPercent)));
                  }
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  inputs.downPaymentType === 'percent'
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => {
                  if (inputs.downPaymentType !== 'amount') {
                    handleChange('downPaymentType', 'amount');
                    handleChange('downPayment', Math.round(downPaymentAmount));
                  }
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  inputs.downPaymentType === 'amount'
                    ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {currency}
              </button>
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={inputs.downPaymentType === 'percent' ? 60 : inputs.homePrice * 0.6}
            step={inputs.downPaymentType === 'percent' ? 0.5 : 5000}
            value={inputs.downPayment}
            onChange={(e) => handleChange('downPayment', Number(e.target.value))}
            className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 dark:bg-slate-700 dark:accent-blue-400"
          />
        </div>

        {/* Interest Rate & Loan Term Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Interest Rate */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Interest Rate (APR)
              </label>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {inputs.interestRate}%
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                type="number"
                min={0}
                max={25}
                step={0.1}
                value={inputs.interestRate || ''}
                onChange={(e) => handleChange('interestRate', Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
              />
              <span className="absolute right-3 text-slate-400 text-xs font-semibold">%</span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              step={0.125}
              value={inputs.interestRate}
              onChange={(e) => handleChange('interestRate', Number(e.target.value))}
              className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 dark:bg-slate-700 dark:accent-blue-400"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
              First Payment Date
            </label>
            <div className="relative flex items-center">
              <input
                type="month"
                value={inputs.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-sm font-semibold text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Loan Term Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Loan Term (Years)
            </label>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {inputs.loanTermYears} Years ({inputs.loanTermYears * 12} months)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {termPresets.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleChange('loanTermYears', term)}
                className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition-all border ${
                  inputs.loanTermYears === term
                    ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500 dark:bg-blue-950/80 dark:text-blue-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {term} Yrs
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible Section for Property Tax, Insurance, HOA, PMI */}
        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/50">
          <button
            type="button"
            onClick={() => setShowAdvancedPITI(!showAdvancedPITI)}
            className="flex w-full items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>Property Taxes, Insurance & HOA (PITI)</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span className="text-[11px] font-medium">
                {inputs.includePITI ? 'Included in total' : 'Excluded'}
              </span>
              {showAdvancedPITI ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </button>

          {showAdvancedPITI && (
            <div className="mt-4 space-y-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inputs.includePITI}
                    onChange={(e) => handleChange('includePITI', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Include Taxes & Fees in Monthly Calculation</span>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Property Tax */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Property Tax (Yearly)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-slate-400 text-xs font-semibold">
                      {inputs.propertyTaxType === 'amount' ? currency : '%'}
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={inputs.propertyTaxType === 'percent' ? 0.1 : 100}
                      value={inputs.propertyTax || ''}
                      onChange={(e) => handleChange('propertyTax', Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* Home Insurance */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    Homeowners Insurance ($/Year)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-slate-400 text-xs font-semibold">{currency}</span>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={inputs.homeInsurance || ''}
                      onChange={(e) => handleChange('homeInsurance', Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* HOA Fees */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    HOA Fees ($/Month)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-slate-400 text-xs font-semibold">{currency}</span>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={inputs.hoaFee || ''}
                      onChange={(e) => handleChange('hoaFee', Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                {/* PMI Rate */}
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                    PMI Insurance (%/Year)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={0}
                      step={0.1}
                      value={inputs.pmiRate || ''}
                      onChange={(e) => handleChange('pmiRate', Math.max(0, Number(e.target.value)))}
                      className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-7 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <span className="absolute right-2.5 text-slate-400 text-xs font-semibold">%</span>
                  </div>
                  {downPaymentPercent < 20 && (
                    <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                      Down payment &lt; 20% requires PMI.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
