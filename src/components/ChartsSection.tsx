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
    const monthNumbersSet = new Set<number>();

    // Always include Start (Month 0)
    monthNumbersSet.add(0);

    if (dataResolution === 'annual') {
      const totalYears = Math.ceil(maxMonths / 12);
      for (let y = 1; y <= totalYears; y++) {
        const m = Math.min(y * 12, maxMonths);
        monthNumbersSet.add(m);
      }
    } else {
      for (let m = 1; m <= maxMonths; m++) {
        monthNumbersSet.add(m);
      }
    }

    // Always include exact payoff months if present
    if (result.monthsStandard > 0) {
      monthNumbersSet.add(result.monthsStandard);
    }
    if (result.monthsWithPrepayment > 0) {
      monthNumbersSet.add(result.monthsWithPrepayment);
    }

    const sortedMonths = Array.from(monthNumbersSet).sort((a, b) => a - b);

    sortedMonths.forEach((m) => {
      let label = '';
      if (m === 0) {
        label = 'Start';
      } else {
        const stdRow = standardMap.get(m);
        const prepayRow = prepayMap.get(m);
        const refRow = stdRow || prepayRow;

        if (dataResolution === 'annual') {
          const yr = Math.ceil(m / 12);
          label = refRow ? `Yr ${yr} (${refRow.year})` : `Yr ${yr}`;
        } else {
          label = refRow ? refRow.dateStr : `Mo ${m}`;
        }
      }

      // Calculate standard balance at month m
      let stdBalance = 0;
      if (m === 0) {
        stdBalance = result.loanAmount;
      } else if (m < result.monthsStandard) {
        const row = standardMap.get(m);
        if (row) {
          stdBalance = row.endBalance;
        } else {
          const prevRow = result.standardSchedule.filter((r) => r.paymentNumber <= m).pop();
          stdBalance = prevRow ? prevRow.endBalance : result.loanAmount;
        }
      } else {
        stdBalance = 0;
      }

      // Calculate prepayment balance at month m
      let prepayBalance = 0;
      if (m === 0) {
        prepayBalance = result.loanAmount;
      } else if (m < result.monthsWithPrepayment) {
        const row = prepayMap.get(m);
        if (row) {
          prepayBalance = row.endBalance;
        } else {
          const prevRow = result.prepaymentSchedule.filter((r) => r.paymentNumber <= m).pop();
          prepayBalance = prevRow ? prevRow.endBalance : result.loanAmount;
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
  const interestVsPrincipalData = [];
  const activeSchedule = result.prepaymentSchedule.length > 0 ? result.prepaymentSchedule : result.standardSchedule;

  if (dataResolution === 'annual') {
    const annualMap = new Map<number, { year: number; principal: number; interest: number; extra: number }>();
    activeSchedule.forEach((row) => {
      const existing = annualMap.get(row.year) || { year: row.year, principal: 0, interest: 0, extra: 0 };
      existing.principal += row.principalPaid;
      existing.interest += row.interestPaid;
      existing.extra += row.extraPayment;
      annualMap.set(row.year, existing);
    });

    annualMap.forEach((val, yr) => {
      interestVsPrincipalData.push({
        label: `${yr}`,
        Interest: Math.round(val.interest),
        Principal: Math.round(val.principal),
        ExtraPayment: Math.round(val.extra),
      });
    });
  } else {
    // Monthly data
    activeSchedule.slice(0, 60).forEach((row) => {
      interestVsPrincipalData.push({
        label: row.dateStr,
        Interest: Math.round(row.interestPaid),
        Principal: Math.round(row.principalPaid),
        ExtraPayment: Math.round(row.extraPayment),
      });
    });
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900">
      {/* Chart Header & Tabs */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
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

      {/* Chart Canvas Area */}
      <div className="h-[340px] w-full pt-2">
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

        {/* CHART 2: Interest vs Principal Stacked Area / Bar */}
        {activeChartTab === 'interestVsPrincipal' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={interestVsPrincipalData}
              margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
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
              <Bar dataKey="Principal" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Interest" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="ExtraPayment" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
