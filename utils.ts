
import { Loan, BorrowedMoney, Expense } from './types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateMonthsBetween = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
};

export const getLoanTimeline = (loan: Loan) => {
  const timeline = [];
  const start = new Date(loan.startDate);
  const today = new Date();
  const currentMonthKey = today.toISOString().slice(0, 7);

  for (let i = 0; i < loan.tenureMonths; i++) {
    const monthDate = new Date(start.getFullYear(), start.getMonth() + i, loan.dueDay);
    const monthKey = monthDate.toISOString().slice(0, 7);
    
    // A month is paid if there's a payment entry for this monthKey
    const isPaid = loan.payments.some(p => p.date.startsWith(monthKey));
    const isPast = monthDate < today && monthKey !== currentMonthKey;
    const isCurrent = monthKey === currentMonthKey;
    const isFuture = monthDate > today && monthKey !== currentMonthKey;

    timeline.push({
      monthIndex: i,
      monthKey,
      date: monthDate.toISOString().slice(0, 10),
      label: monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      isPaid,
      status: isCurrent ? 'current' : isPast ? 'past' : 'future'
    });
  }
  return timeline;
};

export const getLoanStatus = (loan: Loan) => {
  const totalPayable = loan.emiAmount * loan.tenureMonths;
  const timeline = getLoanTimeline(loan);
  
  const paidMonthsCount = timeline.filter(t => t.isPaid).length;
  const actualTotalPaid = paidMonthsCount * loan.emiAmount;
  
  const today = new Date();
  const endDateObj = new Date(loan.endDate);
  const isPastTenure = today > endDateObj;

  // For legacy/UI display: Remaining balance is based on what's NOT marked as paid
  const remainingBalance = Math.max(0, totalPayable - actualTotalPaid);
  
  const progress = totalPayable > 0 ? (actualTotalPaid / totalPayable) * 100 : 0;
  const remainingEmis = loan.tenureMonths - paidMonthsCount;
  const isCompleted = remainingBalance <= 0 || (isPastTenure && remainingEmis <= 0);

  // Check if current month is paid
  const currentMonthKey = today.toISOString().slice(0, 7);
  const isCurrentMonthPaid = loan.payments.some(p => p.date.startsWith(currentMonthKey));

  return {
    totalPaid: actualTotalPaid,
    actualTotalPaid,
    remainingBalance,
    totalPayable,
    remainingEmis,
    progress: Math.min(100, progress),
    isCompleted,
    isCurrentMonthPaid,
    isPastTenure,
    timeline
  };
};

export const getBorrowedStatus = (borrowed: BorrowedMoney) => {
  const paidTillDate = borrowed.totalPaid || 0;
  const remainingBalance = Math.max(0, borrowed.totalAmount - paidTillDate);
  
  return {
    paidTillDate,
    remainingBalance,
    progress: Math.min(100, (paidTillDate / borrowed.totalAmount) * 100)
  };
};

/**
 * VALIDATION UTILITIES
 */

export const validateAmount = (value: string | number): { isValid: boolean; error?: string } => {
  const strValue = value.toString();
  const regex = /^\d+(\.\d{1,2})?$/;
  
  if (!regex.test(strValue)) return { isValid: false, error: "Enter a valid numeric amount" };
  
  const num = parseFloat(strValue);
  if (isNaN(num)) return { isValid: false, error: "Enter a valid amount" };
  if (num <= 0) return { isValid: false, error: "Amount must be greater than zero" };
  
  return { isValid: true };
};

export const validateString = (value: string, minLength = 2): { isValid: boolean; error?: string } => {
  const trimmed = value.trim();
  if (!trimmed) return { isValid: false, error: "This field cannot be empty" };
  if (trimmed.length < minLength) return { isValid: false, error: `Minimum ${minLength} characters required` };
  return { isValid: true };
};

export const isValidFutureDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

export const isTodayOrPast = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
};
