import {
  MortgageInputs,
  PrepaymentOptions,
  AmortizationRow,
  CalculationResult,
  CurrencySymbol,
} from '../types/mortgage';

export const DEFAULT_INPUTS: MortgageInputs = {
  homePrice: 400000,
  downPayment: 20, // 20%
  downPaymentType: 'percent',
  interestRate: 6.5, // 6.5%
  loanTermYears: 30,
  startDate: new Date().toISOString().slice(0, 7), // e.g. "2026-08"
  propertyTax: 1.2, // 1.2% per year
  propertyTaxType: 'percent',
  homeInsurance: 1500, // $1500/year
  hoaFee: 0,
  pmiRate: 0.5, // 0.5% annual PMI if down payment < 20%
  includePITI: true,
};

export const DEFAULT_PREPAYMENTS: PrepaymentOptions = {
  extraMonthly: 200,
  extraYearly: 0,
  extraYearlyMonth: 12, // December
  lumpSumAmount: 0,
  lumpSumMonth: 12,
};

/**
 * Calculates down payment dollar amount from inputs
 */
export function getDownPaymentAmount(inputs: MortgageInputs): number {
  if (inputs.downPaymentType === 'percent') {
    return (inputs.homePrice * Math.max(0, inputs.downPayment)) / 100;
  }
  return Math.min(inputs.homePrice, Math.max(0, inputs.downPayment));
}

/**
 * Calculates loan principal amount
 */
export function getLoanAmount(inputs: MortgageInputs): number {
  const downAmount = getDownPaymentAmount(inputs);
  return Math.max(0, inputs.homePrice - downAmount);
}

/**
 * Standard fixed-rate monthly principal & interest payment
 */
export function calculateMonthlyPAndI(
  principal: number,
  annualInterestRate: number,
  termYears: number
): number {
  if (principal <= 0 || termYears <= 0) return 0;
  const monthlyRate = annualInterestRate / 100 / 12;
  const totalMonths = termYears * 12;

  if (monthlyRate === 0) {
    return principal / totalMonths;
  }

  const factor = Math.pow(1 + monthlyRate, totalMonths);
  return (principal * (monthlyRate * factor)) / (factor - 1);
}

/**
 * Format a Date object or YYYY-MM string offset by month index
 */
export function getPaymentDateStr(startDateYYYYMM: string, paymentIndex: number): {
  dateStr: string;
  year: number;
  month: number;
} {
  const [startYear, startMonth] = startDateYYYYMM.split('-').map(Number);
  const baseDate = new Date(startYear || 2026, (startMonth || 1) - 1, 1);
  
  // Add paymentIndex - 1 months
  baseDate.setMonth(baseDate.getMonth() + (paymentIndex - 1));
  
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth() + 1;
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return {
    dateStr: `${monthNames[month - 1]} ${year}`,
    year,
    month,
  };
}

/**
 * Generates an amortization schedule given loan parameters and prepayments
 */
export function generateSchedule(
  inputs: MortgageInputs,
  prepayments: PrepaymentOptions | null
): AmortizationRow[] {
  const loanAmount = getLoanAmount(inputs);
  if (loanAmount <= 0) return [];

  const monthlyRate = inputs.interestRate / 100 / 12;
  const totalMonths = inputs.loanTermYears * 12;
  const monthlyPAndI = calculateMonthlyPAndI(
    loanAmount,
    inputs.interestRate,
    inputs.loanTermYears
  );

  const schedule: AmortizationRow[] = [];
  let currentBalance = loanAmount;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  for (let m = 1; m <= totalMonths && currentBalance > 0.01; m++) {
    const { dateStr, year, month } = getPaymentDateStr(inputs.startDate, m);
    const startBalance = currentBalance;
    const interestForMonth = monthlyRate > 0 ? startBalance * monthlyRate : 0;

    let scheduledPrincipal = monthlyPAndI - interestForMonth;
    if (scheduledPrincipal < 0) scheduledPrincipal = 0;

    // Check for prepayments if provided
    let extraForMonth = 0;
    if (prepayments) {
      if (prepayments.extraMonthly > 0) {
        extraForMonth += prepayments.extraMonthly;
      }
      if (
        prepayments.extraYearly > 0 &&
        month === prepayments.extraYearlyMonth
      ) {
        extraForMonth += prepayments.extraYearly;
      }
      if (
        prepayments.lumpSumAmount > 0 &&
        m === prepayments.lumpSumMonth
      ) {
        extraForMonth += prepayments.lumpSumAmount;
      }
    }

    let totalPrincipalPaid = scheduledPrincipal + extraForMonth;

    // Cap principal paid to current balance
    if (totalPrincipalPaid > startBalance) {
      totalPrincipalPaid = startBalance;
      extraForMonth = Math.max(0, startBalance - scheduledPrincipal);
    }

    const endBalance = Math.max(0, startBalance - totalPrincipalPaid);
    const totalPayment = interestForMonth + totalPrincipalPaid;

    cumulativeInterest += interestForMonth;
    cumulativePrincipal += totalPrincipalPaid;

    schedule.push({
      paymentNumber: m,
      dateStr,
      year,
      month,
      startBalance: Math.round(startBalance * 100) / 100,
      principalPaid: Math.round((totalPrincipalPaid - extraForMonth) * 100) / 100,
      interestPaid: Math.round(interestForMonth * 100) / 100,
      extraPayment: Math.round(extraForMonth * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      endBalance: Math.round(endBalance * 100) / 100,
      cumulativeInterest: Math.round(cumulativeInterest * 100) / 100,
      cumulativePrincipal: Math.round(cumulativePrincipal * 100) / 100,
    });

    currentBalance = endBalance;
  }

  return schedule;
}

/**
 * Main function to calculate all mortgage metrics and schedule comparison
 */
export function calculateMortgage(
  inputs: MortgageInputs,
  prepayments: PrepaymentOptions
): CalculationResult {
  const downPaymentAmount = getDownPaymentAmount(inputs);
  const loanAmount = getLoanAmount(inputs);
  const monthlyPAndI = calculateMonthlyPAndI(
    loanAmount,
    inputs.interestRate,
    inputs.loanTermYears
  );

  // Property Tax
  let monthlyPropertyTax = 0;
  if (inputs.propertyTaxType === 'percent') {
    monthlyPropertyTax = (inputs.homePrice * (inputs.propertyTax / 100)) / 12;
  } else {
    monthlyPropertyTax = inputs.propertyTax / 12;
  }

  // Insurance & HOA
  const monthlyHomeInsurance = inputs.homeInsurance / 12;
  const monthlyHOA = inputs.hoaFee;

  // PMI: Required if down payment < 20%
  const downPaymentRatio = inputs.homePrice > 0 ? downPaymentAmount / inputs.homePrice : 1;
  let monthlyPMI = 0;
  if (downPaymentRatio < 0.2 && inputs.pmiRate > 0) {
    monthlyPMI = (loanAmount * (inputs.pmiRate / 100)) / 12;
  }

  const totalMonthlyPayment = inputs.includePITI
    ? monthlyPAndI + monthlyPropertyTax + monthlyHomeInsurance + monthlyHOA + monthlyPMI
    : monthlyPAndI;

  const standardSchedule = generateSchedule(inputs, null);
  const prepaymentSchedule = generateSchedule(inputs, prepayments);

  const totalInterestStandard = standardSchedule.reduce(
    (sum, row) => sum + row.interestPaid,
    0
  );
  const totalInterestWithPrepayment = prepaymentSchedule.reduce(
    (sum, row) => sum + row.interestPaid,
    0
  );

  const totalPaymentStandard = standardSchedule.reduce(
    (sum, row) => sum + row.totalPayment,
    0
  );
  const totalPaymentWithPrepayment = prepaymentSchedule.reduce(
    (sum, row) => sum + row.totalPayment,
    0
  );

  const monthsStandard = standardSchedule.length;
  const monthsWithPrepayment = prepaymentSchedule.length;

  const payoffDateStandard =
    standardSchedule.length > 0
      ? standardSchedule[standardSchedule.length - 1].dateStr
      : '';
  const payoffDateWithPrepayment =
    prepaymentSchedule.length > 0
      ? prepaymentSchedule[prepaymentSchedule.length - 1].dateStr
      : '';

  const monthsSaved = Math.max(0, monthsStandard - monthsWithPrepayment);
  const interestSaved = Math.max(
    0,
    totalInterestStandard - totalInterestWithPrepayment
  );

  return {
    loanAmount: Math.round(loanAmount * 100) / 100,
    downPaymentAmount: Math.round(downPaymentAmount * 100) / 100,
    monthlyPrincipalAndInterest: Math.round(monthlyPAndI * 100) / 100,
    monthlyPropertyTax: Math.round(monthlyPropertyTax * 100) / 100,
    monthlyHomeInsurance: Math.round(monthlyHomeInsurance * 100) / 100,
    monthlyHOA: Math.round(monthlyHOA * 100) / 100,
    monthlyPMI: Math.round(monthlyPMI * 100) / 100,
    totalMonthlyPayment: Math.round(totalMonthlyPayment * 100) / 100,

    standardSchedule,
    prepaymentSchedule,

    totalInterestStandard: Math.round(totalInterestStandard * 100) / 100,
    totalInterestWithPrepayment: Math.round(totalInterestWithPrepayment * 100) / 100,
    totalPaymentStandard: Math.round(totalPaymentStandard * 100) / 100,
    totalPaymentWithPrepayment: Math.round(totalPaymentWithPrepayment * 100) / 100,

    payoffDateStandard,
    payoffDateWithPrepayment,

    monthsStandard,
    monthsWithPrepayment,

    monthsSaved,
    interestSaved: Math.round(interestSaved * 100) / 100,
  };
}

/**
 * Format helpers
 */
export function formatCurrency(
  amount: number,
  currency: CurrencySymbol = '$'
): string {
  const formatted = Math.round(amount).toLocaleString('en-US');
  return `${currency}${formatted}`;
}

export function formatPercent(val: number): string {
  return `${val.toFixed(2).replace(/\.00$/, '')}%`;
}

export function formatMonthsToYearsAndMonths(totalMonths: number): string {
  if (totalMonths <= 0) return '0 months';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const yearStr = years > 0 ? `${years} yr${years > 1 ? 's' : ''}` : '';
  const monthStr = months > 0 ? `${months} mo${months > 1 ? 's' : ''}` : '';

  if (yearStr && monthStr) return `${yearStr} ${monthStr}`;
  return yearStr || monthStr;
}
