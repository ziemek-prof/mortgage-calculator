export type CurrencySymbol = '$' | '€' | '£' | 'A$' | 'C$';

export type DownPaymentType = 'percent' | 'amount';
export type PropertyTaxType = 'percent' | 'amount';

export interface MortgageInputs {
  homePrice: number;
  downPayment: number;
  downPaymentType: DownPaymentType;
  interestRate: number; // percentage, e.g. 6.5 for 6.5%
  loanTermYears: number; // e.g., 30
  startDate: string; // YYYY-MM format, e.g. "2026-09"
  
  // Optional PITI Taxes & Fees
  propertyTax: number; // yearly amount or percentage
  propertyTaxType: PropertyTaxType;
  homeInsurance: number; // yearly amount
  hoaFee: number; // monthly amount
  pmiRate: number; // annual percentage of initial loan amount if down payment < 20%
  includePITI: boolean;
}

export interface PrepaymentOptions {
  extraMonthly: number;
  extraYearly: number;
  extraYearlyMonth: number; // 1 to 12 (default month 12 = December)
  lumpSumAmount: number;
  lumpSumMonth: number; // 1 to totalMonths (e.g., month 24 = year 2 month 12)
}

export interface AmortizationRow {
  paymentNumber: number;
  dateStr: string;
  year: number;
  month: number;
  startBalance: number;
  principalPaid: number;
  interestPaid: number;
  extraPayment: number;
  totalPayment: number;
  endBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface CalculationResult {
  loanAmount: number;
  downPaymentAmount: number;
  monthlyPrincipalAndInterest: number;
  monthlyPropertyTax: number;
  monthlyHomeInsurance: number;
  monthlyHOA: number;
  monthlyPMI: number;
  totalMonthlyPayment: number;
  
  standardSchedule: AmortizationRow[];
  prepaymentSchedule: AmortizationRow[];
  
  totalInterestStandard: number;
  totalInterestWithPrepayment: number;
  totalPaymentStandard: number;
  totalPaymentWithPrepayment: number;
  
  payoffDateStandard: string;
  payoffDateWithPrepayment: string;
  
  monthsStandard: number;
  monthsWithPrepayment: number;
  
  monthsSaved: number;
  interestSaved: number;
}

export interface SavedScenario {
  id: string;
  name: string;
  inputs: MortgageInputs;
  prepayments: PrepaymentOptions;
  result: CalculationResult;
  createdAt: number;
}
