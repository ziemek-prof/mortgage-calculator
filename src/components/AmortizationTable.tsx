import React, { useState, useMemo } from 'react';
import {
  Table,
  Search,
  Download,
  ChevronRight,
  ChevronDown,
  Calendar,
  Sparkles,
  Zap,
  Filter,
} from 'lucide-react';
import { AmortizationRow, CurrencySymbol } from '../types/mortgage';
import { formatCurrency } from '../utils/mortgageCalculations';
import { exportToCSV } from '../utils/pdfExport';

interface AmortizationTableProps {
  standardSchedule: AmortizationRow[];
  prepaymentSchedule: AmortizationRow[];
  currency: CurrencySymbol;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  standardSchedule,
  prepaymentSchedule,
  currency,
}) => {
  const [scheduleType, setScheduleType] = useState<'prepayment' | 'standard'>('prepayment');
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYearFilter, setSelectedYearFilter] = useState<number | 'all'>('all');
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set([1]));

  const activeSchedule =
    scheduleType === 'prepayment' && prepaymentSchedule.length > 0
      ? prepaymentSchedule
      : standardSchedule;

  // Toggle expanded year in annual view
  const toggleExpandYear = (yearNum: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(yearNum)) {
        next.delete(yearNum);
      } else {
        next.add(yearNum);
      }
      return next;
    });
  };

  // Group monthly schedule into Annual rows
  const annualGrouped = useMemo(() => {
    const map = new Map<
      number,
      {
        yearNum: number;
        calendarYear: number;
        principal: number;
        interest: number;
        extra: number;
        totalPaid: number;
        endBalance: number;
        monthlyRows: AmortizationRow[];
      }
    >();

    activeSchedule.forEach((row) => {
      // paymentNumber 1..12 = yearNum 1
      const yearNum = Math.ceil(row.paymentNumber / 12);
      const existing = map.get(yearNum) || {
        yearNum,
        calendarYear: row.year,
        principal: 0,
        interest: 0,
        extra: 0,
        totalPaid: 0,
        endBalance: row.endBalance,
        monthlyRows: [],
      };

      existing.principal += row.principalPaid;
      existing.interest += row.interestPaid;
      existing.extra += row.extraPayment;
      existing.totalPaid += row.totalPayment;
      existing.endBalance = row.endBalance; // final month's end balance
      existing.monthlyRows.push(row);

      map.set(yearNum, existing);
    });

    return Array.from(map.values());
  }, [activeSchedule]);

  // Available years for dropdown filter
  const totalYears = annualGrouped.length;

  // Filtered rows
  const filteredAnnual = useMemo(() => {
    return annualGrouped.filter((item) => {
      if (selectedYearFilter !== 'all' && item.yearNum !== selectedYearFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesYear =
          `year ${item.yearNum}`.includes(q) ||
          `${item.calendarYear}`.includes(q);
        const matchesMonthly = item.monthlyRows.some((r) =>
          r.dateStr.toLowerCase().includes(q)
        );
        return matchesYear || matchesMonthly;
      }
      return true;
    });
  }, [annualGrouped, selectedYearFilter, searchQuery]);

  const filteredMonthly = useMemo(() => {
    return activeSchedule.filter((row) => {
      const yearNum = Math.ceil(row.paymentNumber / 12);
      if (selectedYearFilter !== 'all' && yearNum !== selectedYearFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          row.dateStr.toLowerCase().includes(q) ||
          `month ${row.paymentNumber}`.includes(q) ||
          `${row.year}`.includes(q)
        );
      }
      return true;
    });
  }, [activeSchedule, selectedYearFilter, searchQuery]);

  const handleCSVDownload = () => {
    const name = `Mortgage_Schedule_${scheduleType}_${viewMode}`;
    exportToCSV(activeSchedule, name, currency);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
      {/* Table Header & Controls */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Amortization Schedule
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Complete repayment breakdown month by month or year by year
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Schedule Switcher if prepayments exist */}
          {prepaymentSchedule.length > 0 && (
            <div className="flex rounded-lg bg-emerald-50 p-0.5 border border-emerald-200/60 dark:bg-emerald-950/40 dark:border-emerald-900/40">
              <button
                onClick={() => setScheduleType('prepayment')}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                  scheduleType === 'prepayment'
                    ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                    : 'text-emerald-800 hover:text-emerald-900 dark:text-emerald-300'
                }`}
              >
                <Zap className="h-3 w-3" />
                With Prepayments
              </button>
              <button
                onClick={() => setScheduleType('standard')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${
                  scheduleType === 'standard'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                }`}
              >
                Standard
              </button>
            </div>
          )}

          {/* View Mode Toggle: Annual vs Monthly */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('annual')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'annual'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Annual Summary
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                viewMode === 'monthly'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Monthly View
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleCSVDownload}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {/* Search Bar */}
        <div className="relative flex items-center sm:col-span-2">
          <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search date, month or year (e.g. 2028, Dec)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Year Filter */}
        <select
          value={selectedYearFilter}
          onChange={(e) =>
            setSelectedYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
          }
          className="rounded-xl border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="all">All Years ({totalYears} Yrs)</option>
          {Array.from({ length: totalYears }, (_, i) => i + 1).map((yr) => (
            <option key={yr} value={yr}>
              Year {yr}
            </option>
          ))}
        </select>
      </div>

      {/* Amortization Schedule Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 uppercase font-bold">
            <tr>
              {viewMode === 'annual' && <th className="py-2.5 px-3 w-8"></th>}
              <th className="py-2.5 px-3">
                {viewMode === 'annual' ? 'Year' : 'Pmt # / Date'}
              </th>
              <th className="py-2.5 px-3 text-right">Principal Paid</th>
              <th className="py-2.5 px-3 text-right">Interest Paid</th>
              <th className="py-2.5 px-3 text-right">Extra Prepayment</th>
              <th className="py-2.5 px-3 text-right">Total Payment</th>
              <th className="py-2.5 px-3 text-right">End Balance</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
            {/* ANNUAL VIEW */}
            {viewMode === 'annual' &&
              filteredAnnual.map((yearGroup) => {
                const isExpanded = expandedYears.has(yearGroup.yearNum);

                return (
                  <React.Fragment key={yearGroup.yearNum}>
                    {/* Parent Annual Row */}
                    <tr
                      onClick={() => toggleExpandYear(yearGroup.yearNum)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/60 ${
                        isExpanded ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 inline" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400 inline" />
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        Year {yearGroup.yearNum}{' '}
                        <span className="text-[11px] font-normal text-slate-500">
                          ({yearGroup.calendarYear})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                        {formatCurrency(yearGroup.principal, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                        {formatCurrency(yearGroup.interest, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {yearGroup.extra > 0
                          ? `+${formatCurrency(yearGroup.extra, currency)}`
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold">
                        {formatCurrency(yearGroup.totalPaid, currency)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(yearGroup.endBalance, currency)}
                      </td>
                    </tr>

                    {/* Sub-rows for monthly breakdown when expanded */}
                    {isExpanded &&
                      yearGroup.monthlyRows.map((mRow) => (
                        <tr
                          key={mRow.paymentNumber}
                          className={`bg-slate-50/30 text-[11px] dark:bg-slate-900/40 ${
                            mRow.extraPayment > 0
                              ? 'bg-emerald-50/30 dark:bg-emerald-950/20'
                              : ''
                          }`}
                        >
                          <td></td>
                          <td className="py-1.5 px-3 pl-8 text-slate-600 dark:text-slate-400">
                            #{mRow.paymentNumber} • {mRow.dateStr}
                          </td>
                          <td className="py-1.5 px-3 text-right text-slate-700 dark:text-slate-300">
                            {formatCurrency(mRow.principalPaid, currency)}
                          </td>
                          <td className="py-1.5 px-3 text-right text-slate-600 dark:text-slate-400">
                            {formatCurrency(mRow.interestPaid, currency)}
                          </td>
                          <td className="py-1.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                            {mRow.extraPayment > 0
                              ? `+${formatCurrency(mRow.extraPayment, currency)}`
                              : '-'}
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            {formatCurrency(mRow.totalPayment, currency)}
                          </td>
                          <td className="py-1.5 px-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                            {formatCurrency(mRow.endBalance, currency)}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}

            {/* MONTHLY VIEW */}
            {viewMode === 'monthly' &&
              filteredMonthly.map((mRow) => (
                <tr
                  key={mRow.paymentNumber}
                  className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 ${
                    mRow.extraPayment > 0
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                      : ''
                  }`}
                >
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                    #{mRow.paymentNumber} • {mRow.dateStr}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                    {formatCurrency(mRow.principalPaid, currency)}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-amber-600 dark:text-amber-400">
                    {formatCurrency(mRow.interestPaid, currency)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    {mRow.extraPayment > 0
                      ? `+${formatCurrency(mRow.extraPayment, currency)}`
                      : '-'}
                  </td>
                  <td className="py-2 px-3 text-right font-bold">
                    {formatCurrency(mRow.totalPayment, currency)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(mRow.endBalance, currency)}
                  </td>
                </tr>
              ))}

            {filteredAnnual.length === 0 && filteredMonthly.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No amortization rows match your filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
