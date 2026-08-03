import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  MortgageInputs,
  PrepaymentOptions,
  CalculationResult,
  CurrencySymbol,
  AmortizationRow,
} from '../types/mortgage';
import {
  formatCurrency,
  formatPercent,
  formatMonthsToYearsAndMonths,
} from './mortgageCalculations';

export function exportMortgagePDFReport(
  inputs: MortgageInputs,
  prepayments: PrepaymentOptions,
  result: CalculationResult,
  currency: CurrencySymbol = '$'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [30, 58, 138]; // Deep blue
  const secondaryColor: [number, number, number] = [15, 118, 110]; // Teal accent
  const darkTextColor: [number, number, number] = [30, 41, 59];

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('MORTGAGE & PAYOFF ANALYSIS REPORT', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 196, 18, {
    align: 'right',
  });

  let currentY = 36;

  // Executive Summary Card Section
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 34, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, 182, 34, 3, 3, 'D');

  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('EXECUTIVE LOAN SUMMARY', 20, currentY + 8);

  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  // Column 1
  doc.text(`Home Price: ${formatCurrency(inputs.homePrice, currency)}`, 20, currentY + 16);
  doc.text(
    `Down Payment: ${formatCurrency(result.downPaymentAmount, currency)} (${formatPercent(
      (result.downPaymentAmount / (inputs.homePrice || 1)) * 100
    )})`,
    20,
    currentY + 22
  );
  doc.text(`Loan Amount: ${formatCurrency(result.loanAmount, currency)}`, 20, currentY + 28);

  // Column 2
  doc.text(`Interest Rate: ${formatPercent(inputs.interestRate)}`, 80, currentY + 16);
  doc.text(`Loan Term: ${inputs.loanTermYears} Years`, 80, currentY + 22);
  doc.text(
    `Monthly P&I: ${formatCurrency(result.monthlyPrincipalAndInterest, currency)}`,
    80,
    currentY + 28
  );

  // Column 3
  doc.text(
    `Total Monthly Cost: ${formatCurrency(result.totalMonthlyPayment, currency)}`,
    140,
    currentY + 16
  );
  doc.text(`Original Payoff: ${result.payoffDateStandard}`, 140, currentY + 22);
  doc.text(
    `Prepayment Payoff: ${result.payoffDateWithPrepayment || 'N/A'}`,
    140,
    currentY + 28
  );

  currentY += 40;

  // Prepayment Impact Highlight Card
  if (result.monthsSaved > 0 || result.interestSaved > 0) {
    doc.setFillColor(240, 253, 250); // Mint background
    doc.roundedRect(14, currentY, 182, 22, 3, 3, 'F');
    doc.setDrawColor(153, 246, 228);
    doc.roundedRect(14, currentY, 182, 22, 3, 3, 'D');

    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SAVINGS WITH PREPAYMENTS', 20, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(
      `Payoff Accelerated By: ${formatMonthsToYearsAndMonths(result.monthsSaved)} early!`,
      20,
      currentY + 15
    );
    doc.text(
      `Total Interest Saved: ${formatCurrency(result.interestSaved, currency)}`,
      110,
      currentY + 15
    );

    currentY += 28;
  }

  // Section: Monthly Payment Breakdown Table
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Monthly Payment Breakdown', 14, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    head: [['Component', 'Monthly Amount', '% of Total']],
    body: [
      [
        'Principal & Interest (P&I)',
        formatCurrency(result.monthlyPrincipalAndInterest, currency),
        `${Math.round(
          (result.monthlyPrincipalAndInterest / (result.totalMonthlyPayment || 1)) * 100
        )}%`,
      ],
      [
        'Property Tax',
        formatCurrency(result.monthlyPropertyTax, currency),
        `${Math.round(
          (result.monthlyPropertyTax / (result.totalMonthlyPayment || 1)) * 100
        )}%`,
      ],
      [
        'Homeowner Insurance',
        formatCurrency(result.monthlyHomeInsurance, currency),
        `${Math.round(
          (result.monthlyHomeInsurance / (result.totalMonthlyPayment || 1)) * 100
        )}%`,
      ],
      [
        'HOA Fees',
        formatCurrency(result.monthlyHOA, currency),
        `${Math.round(
          (result.monthlyHOA / (result.totalMonthlyPayment || 1)) * 100
        )}%`,
      ],
      [
        'PMI Insurance',
        formatCurrency(result.monthlyPMI, currency),
        `${Math.round(
          (result.monthlyPMI / (result.totalMonthlyPayment || 1)) * 100
        )}%`,
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    margin: { left: 14, right: 14 },
  });

  // Get current Y after table
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Section: Standard vs Prepayment Comparison Table
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Lifetime Schedule Comparison', 14, currentY);
  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    head: [['Metric', 'Standard Schedule', 'With Prepayments', 'Difference / Savings']],
    body: [
      [
        'Payoff Term',
        `${inputs.loanTermYears} Years (${result.monthsStandard} mos)`,
        `${formatMonthsToYearsAndMonths(result.monthsWithPrepayment)} (${result.monthsWithPrepayment} mos)`,
        `${formatMonthsToYearsAndMonths(result.monthsSaved)} sooner`,
      ],
      [
        'Final Payoff Date',
        result.payoffDateStandard,
        result.payoffDateWithPrepayment,
        `${result.monthsSaved} months early`,
      ],
      [
        'Total Interest Paid',
        formatCurrency(result.totalInterestStandard, currency),
        formatCurrency(result.totalInterestWithPrepayment, currency),
        `Saved ${formatCurrency(result.interestSaved, currency)}`,
      ],
      [
        'Total Principal + Interest Paid',
        formatCurrency(result.totalPaymentStandard, currency),
        formatCurrency(result.totalPaymentWithPrepayment, currency),
        `Saved ${formatCurrency(result.interestSaved, currency)}`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Page 2: Annual Amortization Table
  doc.addPage();

  // Annual Amortization Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ANNUAL AMORTIZATION SCHEDULE', 14, 13);

  // Compute annual summary rows
  const scheduleToUse = result.prepaymentSchedule.length > 0 ? result.prepaymentSchedule : result.standardSchedule;
  const annualMap = new Map<number, {
    year: number;
    principal: number;
    interest: number;
    extra: number;
    endBalance: number;
  }>();

  scheduleToUse.forEach((row) => {
    const existing = annualMap.get(row.year) || {
      year: row.year,
      principal: 0,
      interest: 0,
      extra: 0,
      endBalance: row.endBalance,
    };
    existing.principal += row.principalPaid;
    existing.interest += row.interestPaid;
    existing.extra += row.extraPayment;
    existing.endBalance = row.endBalance; // takes the final month's balance
    annualMap.set(row.year, existing);
  });

  const annualRows = Array.from(annualMap.values()).map((item, idx) => [
    `Year ${idx + 1} (${item.year})`,
    formatCurrency(item.principal, currency),
    formatCurrency(item.interest, currency),
    formatCurrency(item.extra, currency),
    formatCurrency(item.principal + item.extra + item.interest, currency),
    formatCurrency(item.endBalance, currency),
  ]);

  autoTable(doc, {
    startY: 26,
    head: [
      ['Year', 'Principal Paid', 'Interest Paid', 'Extra Paid', 'Total Paid', 'End Balance'],
    ],
    body: annualRows,
    theme: 'striped',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: 14, right: 14, top: 26, bottom: 15 },
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Mortgage Calculator Report • Page ${i} of ${pageCount}`,
      105,
      287,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`Mortgage_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Export Schedule to CSV file
 */
export function exportToCSV(
  schedule: AmortizationRow[],
  filename: string,
  currency: CurrencySymbol = '$'
) {
  const headers = [
    'Payment #',
    'Date',
    'Year',
    'Month',
    'Start Balance',
    'Principal Paid',
    'Interest Paid',
    'Extra Payment',
    'Total Payment',
    'End Balance',
    'Cumulative Principal',
    'Cumulative Interest',
  ];

  const rows = schedule.map((r) => [
    r.paymentNumber,
    `"${r.dateStr}"`,
    r.year,
    r.month,
    r.startBalance.toFixed(2),
    r.principalPaid.toFixed(2),
    r.interestPaid.toFixed(2),
    r.extraPayment.toFixed(2),
    r.totalPayment.toFixed(2),
    r.endBalance.toFixed(2),
    r.cumulativePrincipal.toFixed(2),
    r.cumulativeInterest.toFixed(2),
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
