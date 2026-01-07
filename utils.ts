
import { Loan, BorrowedMoney, Expense } from './types';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const triggerHaptic = (type: 'success' | 'warning' | 'error' | 'light' = 'light') => {
  if (!('vibrate' in navigator)) return;
  switch (type) {
    case 'success': navigator.vibrate([10, 30, 10]); break;
    case 'warning': navigator.vibrate([50, 100, 50]); break;
    case 'error': navigator.vibrate([100, 50, 100]); break;
    case 'light': navigator.vibrate(10); break;
  }
};

export const getMonthKey = (date: string | Date = new Date()) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().slice(0, 7); // "YYYY-MM"
};

export const calculateMonthsBetween = (start: string, end: string): number => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
};

export const getLoanStatus = (loan: Loan) => {
  const now = new Date();
  const currentMonthKey = getMonthKey(now);
  const startDate = new Date(loan.startDate);
  
  const totalMonths = calculateMonthsBetween(loan.startDate, loan.endDate);
  
  let pastMonthsCount = 0;
  if (startDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
    pastMonthsCount = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
  }
  
  pastMonthsCount = Math.max(0, Math.min(pastMonthsCount, totalMonths));
  const isCurrentMonthPaid = loan.paidMonths.includes(currentMonthKey);
  const paidCount = pastMonthsCount + (isCurrentMonthPaid ? 1 : 0);
  
  const finalPaidCount = Math.min(paidCount, totalMonths);
  const remainingMonths = Math.max(0, totalMonths - finalPaidCount);
  const remainingAmount = Math.max(0, loan.totalAmount - (loan.emi * finalPaidCount));
  
  return {
    paidCount: finalPaidCount,
    totalMonths,
    remainingMonths,
    remainingAmount,
    progress: Math.min(100, (finalPaidCount / totalMonths) * 100),
    isCurrentMonthPaid
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
