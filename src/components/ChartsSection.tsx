import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { CalculationResult, CurrencySymbol } from '../types/mortgage';
import { formatCurrency } from '../utils/mortgageCalculations';
import { LineChart as LineChartIcon, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';

interface ChartsSectionProps {
  result: CalculationResult;
  currency: CurrencySymbol;
  includePITI: boolean;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({
  result,
  currency,
  includePITI,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'balance' | 'interestVsPrincipal' | 'breakdown'>('balance');
  const [dataResolution, setDataResolution] = useState<'annual' | 'monthly'>('annual');
  const [selectedBarSchedule, setSelectedBarSchedule] = useState<'prepayment' | 'standard'>('prepayment');
  const [annualGroupingMode, setAnnualGroupingMode] = useState<'calendar' | 'loanYear'>('loanYear');

  // Prepare Balance Comparison Chart Data
  const standardMap = new Map<number, import('../types/mortgage').AmortizationRow>();
  result.standardSchedule.forEach((row) => {
    standardMap.set(row.paymentNumber, row);
  });

  const prepayMap = new Map<number, import('../types/mortgage').AmortizationRow>();
  result.prepaymentSchedule.forEach((row) => {
    prepayMap.set(row.paymentNumber, row);
  });

  const maxMonths = Math.max(result.monthsStandard, result.monthsWithPrepayment);

  const balanceChartData: {
    monthNumber: number;
    label: string;
    standardBalance: number;
    prepaymentBalance: number;
  }[] = [];

  if (maxMonths > 0) {
    const monthNumbers: number[] = [];

    if (dataResolution === 'annual') {
      const totalYears = Math.ceil(maxMonths / 12);
      monthNumbers.push(0); // Start
      for (let y = 1; y <= totalYears; y++) {
        const m = Math.min(y * 12, maxMonths);
        if (!monthNumbers.includes(m)) {
          monthNumbers.push(m);
        }
      }
    } else {
      for (let m = 0; m <= maxMonths; m++) {
        monthNumbers.push(m);
      }
    }

    monthNumbers.forEach((m) => {
      let label = '';
      if (m === 0) {
        label = 'Start';
      } else {
        const stdRow = standardMap.get(m);
        const prepayRow = prepayMap.get(m);
        const refRow = stdRow || prepayRow;

        if (dataResolution === 'annual') {
          const yr = Math.round(m / 12);
          label = refRow ? `Yr ${yr} (${refRow.year})` : `Yr ${yr}`;
        } else {
          label = refRow ? refRow.dateStr : `Mo ${m}`;
        }
      }

      // Calculate standard balance at month m
      let stdBalance = 0;
      if (m === 0) {
        stdBalance = result.loanAmount;
      } else if (m <= result.monthsStandard) {
        const row = standardMap.get(m);
        if (row) {
          stdBalance = row.endBalance;
        } else {
          const prevRow = result.standardSchedule.filter((r) => r.paymentNumber <= m).pop();
          stdBalance = prevRow ? prevRow.endBalance : 0;
        }
      } else {
        stdBalance = 0;
      }

      // Calculate prepayment balance at month m
      let prepayBalance = 0;
      if (m === 0) {
        prepayBalance = result.loanAmount;
      } else if (m <= result.monthsWithPrepayment) {
        const row = prepayMap.get(m);
        if (row) {
          prepayBalance = row.endBalance;
        } else {
          const prevRow = result.prepaymentSchedule.filter((r) => r.paymentNumber <= m).pop();
          prepayBalance = prevRow ? prevRow.endBalance : 0;
        }
      } else {
        prepayBalance = 0;
      }

      balanceChartData.push({
        monthNumber: m,
        label,
        standardBalance: Math.max(0, Math.round(stdBalance)),
        prepaymentBalance: Math.max(0, Math.round(prepayBalance)),
      });
    });
  }

  // Interest vs Principal Breakdown Data
  const hasPrepayment = result.monthsSaved > 0 || result.interestSaved > 0;
  const activeSchedule = (hasPrepayment && selectedBarSchedule === 'prepayment')
    ? result.prepaymentSchedule
    : result.standardSchedule;

  const interestVsPrincipalData: {
    label: string;
    Interest: number;
    Principal: number;
    ExtraPayment: number;
  }[] = [];

  // Always base the full timeline on the standard schedule duration so time scale is consistent
  const totalStandardMonths = result.standardSchedule.length;
  const totalStandardYears = Math.ceil(totalStandardMonths / 12);

  if (dataResolution === 'annual') {
    if (annualGroupingMode === 'calendar') {
      // Collect all calendar years from standard schedule to maintain full timeline
      const calendarYearsMap = new Map<number, { count: number }>();
      result.standardSchedule.forEach((row) => {
        const existing = calendarYearsMap.get(row.year) || { count: 0 };
        existing.count += 1;
        calendarYearsMap.set(row.year, existing);
      });

      // Collect data from active schedule
      const activeAnnualMap = new Map<number, { principal: number; interest: number; extra: number; count: number }>();
      activeSchedule.forEach((row) => {
        const existing = activeAnnualMap.get(row.year) || { principal: 0, interest: 0, extra: 0, count: 0 };
        existing.principal += row.principalPaid;
        existing.interest += row.interestPaid;
        existing.extra += row.extraPayment;
        existing.count += 1;
        activeAnnualMap.set(row.year, existing);
      });

      calendarYearsMap.forEach((stdVal, yr) => {
        const activeVal = activeAnnualMap.get(yr);
        if (activeVal) {
          const isPartial = activeVal.count < 12;
          const label = isPartial ? `${yr} (${activeVal.count}m)` : `${yr}`;
          interestVsPrincipalData.push({
            label,
            Interest: Math.round(activeVal.interest),
            Principal: Math.round(activeVal.principal),
            ExtraPayment: Math.round(activeVal.extra),
          });
        } else {
          // Paid off year
          interestVsPrincipalData.push({
            label: `${yr}`,
            Interest: 0,
            Principal: 0,
            ExtraPayment: 0,
          });
        }
      });
    } else {
      // Group by Loan Year (every 12 payments = 1 loan year)
      for (let ly = 1; ly <= totalStandardYears; ly++) {
        const startIndex = (ly - 1) * 12;
        const yearRows = activeSchedule.slice(startIndex, startIndex + 12);

        if (yearRows.length > 0) {
          let pSum = 0;
          let iSum = 0;
          let eSum = 0;
          yearRows.forEach((r) => {
            pSum += r.principalPaid;
            iSum += r.interestPaid;
            eSum += r.extraPayment;
          });
          const isPartial = yearRows.length < 12;
          const label = isPartial ? `Yr ${ly} (${yearRows.length}m)` : `Yr ${ly}`;
          interestVsPrincipalData.push({
            label,
            Interest: Math.round(iSum),
            Principal: Math.round(pSum),
            ExtraPayment: Math.round(eSum),
          });
        } else {
          // Post-payoff loan year
          interestVsPrincipalData.push({
            label: `Yr ${ly}`,
            Interest: 0,
            Principal: 0,
            ExtraPayment: 0,
          });
        }
      }
    }
  } else {
    // Monthly data covering all standard months to maintain identical time scale
    for (let m = 1; m <= totalStandardMonths; m++) {
      if (m <= activeSchedule.length) {
        const row = activeSchedule[m - 1];
        interestVsPrincipalData.push({
          label: row.dateStr,
          Interest: Math.round(row.interestPaid),
          Principal: Math.round(row.principalPaid),
          ExtraPayment: Math.round(row.extraPayment),
        });
      } else {
        const stdRow = result.standardSchedule[m - 1];
        interestVsPrincipalData.push({
          label: stdRow ? stdRow.dateStr : `Mo ${m}`,
          Interest: 0,
          Principal: 0,
          ExtraPayment: 0,
        });
      }
    }
  }

  // Payment Breakdown Donut Data
  const pieData = [
    { name: 'Principal & Interest', value: result.monthlyPrincipalAndInterest, color: '#2563eb' },
  ];

  if (includePITI) {
    if (result.monthlyPropertyTax > 0)
      pieData.push({ name: 'Property Tax', value: result.monthlyPropertyTax, color: '#0d9488' });
    if (result.monthlyHomeInsurance > 0)
      pieData.push({ name: 'Home Insurance', value: result.monthlyHomeInsurance, color: '#d97706' });
    if (result.monthlyHOA > 0)
      pieData.push({ name: 'HOA Fees', value: result.monthlyHOA, color: '#8b5cf6' });
    if (result.monthlyPMI > 0)
      pieData.push({ name: 'PMI Insurance', value: result.monthlyPMI, color: '#e11d48' });
  }

  // Custom Bar Tooltip
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (Number(entry.value) || 0), 0);
      if (total === 0) {
        return (
          <div className="rounded-xl border border-emerald-500/30 bg-slate-900 p-3 text-xs text-white shadow-xl min-w-[170px]">
            <p className="font-bold text-emerald-400 border-b border-slate-800 pb-1.5 mb-1.5">{label}</p>
            <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
              <span>🎉</span>
              <span>Mortgage Fully Paid Off</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">No monthly payments required.</p>
          </div>
        );
      }
      return (
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white shadow-xl min-w-[180px]">
          <p className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-1.5">{label}</p>
          {payload.map((entry: any, index: number) => {
            if (!entry.value || entry.value === 0) return null;
            return (
              <div key={`item-${index}`} className="my-1 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-slate-300">{entry.name}:</span>
                </span>
                <span className="font-semibold text-white">{formatCurrency(entry.value, currency)}</span>
              </div>
            );
          })}
          <div className="mt-2 flex items-center justify-between border-t border-slate-800 pt-1.5 font-bold text-slate-100">
            <span>Total Paid:</span>
            <span className="text-blue-400">{formatCurrency(total, currency)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
      {/* Chart Header & Tabs */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Visual Financial Analytics
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive loan balance curve, principal/interest split & cost breakdown
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Resolution toggle */}
          {activeChartTab !== 'breakdown' && (
            <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
              <button
                onClick={() => setDataResolution('annual')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  dataResolution === 'annual'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Annual
              </button>
              <button
                onClick={() => setDataResolution('monthly')}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  dataResolution === 'monthly'
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
            </div>
          )}

          {/* Tab Selector */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
            <button
              onClick={() => setActiveChartTab('balance')}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeChartTab === 'balance'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <LineChartIcon className="h-3.5 w-3.5" />
              Payoff Curve
            </button>
            <button
              onClick={() => setActiveChartTab('interestVsPrincipal')}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeChartTab === 'interestVsPrincipal'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Interest vs Principal
            </button>
            <button
              onClick={() => setActiveChartTab('breakdown')}
              className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                activeChartTab === 'breakdown'
                  ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <PieChartIcon className="h-3.5 w-3.5" />
              Cost Breakdown
            </button>
          </div>
        </div>
      </div>

      {/* Sub-controls bar for Interest vs Principal Tab */}
      {activeChartTab === 'interestVsPrincipal' && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60 text-xs">
          {/* Schedule Selector */}
          {hasPrepayment ? (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Schedule:</span>
              <div className="flex rounded-md bg-slate-200/80 p-0.5 dark:bg-slate-700">
                <button
                  onClick={() => setSelectedBarSchedule('standard')}
                  className={`rounded px-2.5 py-0.5 font-medium transition-all ${
                    selectedBarSchedule === 'standard'
                      ? 'bg-white text-blue-600 shadow dark:bg-slate-900 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Standard
                </button>
                <button
                  onClick={() => setSelectedBarSchedule('prepayment')}
                  className={`rounded px-2.5 py-0.5 font-medium transition-all ${
                    selectedBarSchedule === 'prepayment'
                      ? 'bg-white text-emerald-600 shadow dark:bg-slate-900 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  With Prepayments
                </button>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 font-medium">Schedule: Standard Amortization</div>
          )}

          {/* Grouping mode when annual */}
          {dataResolution === 'annual' && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Grouping:</span>
              <div className="flex rounded-md bg-slate-200/80 p-0.5 dark:bg-slate-700">
                <button
                  onClick={() => setAnnualGroupingMode('calendar')}
                  className={`rounded px-2.5 py-0.5 font-medium transition-all ${
                    annualGroupingMode === 'calendar'
                      ? 'bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Calendar Year
                </button>
                <button
                  onClick={() => setAnnualGroupingMode('loanYear')}
                  className={`rounded px-2.5 py-0.5 font-medium transition-all ${
                    annualGroupingMode === 'loanYear'
                      ? 'bg-white text-slate-900 shadow dark:bg-slate-900 dark:text-white'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Loan Year
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="h-[340px] w-full pt-1">
        {/* CHART 1: Balance Curve */}
        {activeChartTab === 'balance' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={balanceChartData}
              margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorPrepayment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <YAxis
                tickFormatter={(val) => `${currency}${(val / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                stroke="#94a3b8"
              />
              <Tooltip
                formatter={(val: number) => [formatCurrency(val, currency), '']}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  color: '#fff',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Area
                type="monotone"
                dataKey="standardBalance"
                name="Standard Schedule Balance"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorStandard)"
              />
              {result.monthsSaved > 0 && (
                <Area
                  type="monotone"
                  dataKey="prepaymentBalance"
                  name="Prepayment Schedule Balance"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorPrepayment)"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* CHART 2: Interest vs Principal Stacked Bar */}
        {activeChartTab === 'interestVsPrincipal' && (
          <div className="h-full w-full">
            {dataResolution === 'annual' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={interestVsPrincipalData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    tickFormatter={(val) => `${currency}${(val / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Principal" name="Scheduled Principal" stackId="a" fill="#2563eb" />
                  <Bar dataKey="Interest" name="Interest Paid" stackId="a" fill="#f59e0b" />
                  {hasPrepayment && selectedBarSchedule === 'prepayment' && (
                    <Bar dataKey="ExtraPayment" name="Extra Prepayment" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full overflow-x-auto">
                <div style={{ width: `${Math.max(750, interestVsPrincipalData.length * 18)}px`, height: '100%' }}>
                  <BarChart
                    width={Math.max(750, interestVsPrincipalData.length * 18)}
                    height={320}
                    data={interestVsPrincipalData}
                    margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                    barCategoryGap={1}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                      interval={0}
                      tickFormatter={(value, index) => (index % 12 === 0 ? value : '')}
                    />
                    <YAxis
                      tickFormatter={(val) => `${currency}${(val / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 11 }}
                      stroke="#94a3b8"
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Principal" name="Scheduled Principal" stackId="a" fill="#2563eb" />
                    <Bar dataKey="Interest" name="Interest Paid" stackId="a" fill="#f59e0b" />
                    {hasPrepayment && selectedBarSchedule === 'prepayment' && (
                      <Bar dataKey="ExtraPayment" name="Extra Prepayment" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} />
                    )}
                  </BarChart>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHART 3: Payment Breakdown Donut */}
        {activeChartTab === 'breakdown' && (
          <div className="flex h-full flex-col items-center justify-center sm:flex-row">
            <div className="h-[260px] w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val, currency), '']}
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend List */}
            <div className="w-full sm:w-1/2 space-y-2.5 px-4">
              {pieData.map((item) => {
                const total = includePITI ? result.totalMonthlyPayment : result.monthlyPrincipalAndInterest;
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {item.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.value, currency)}
                      </div>
                      <div className="text-[10px] text-slate-500">{pct}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
