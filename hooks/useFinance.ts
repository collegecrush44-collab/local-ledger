
import { useState, useEffect } from 'react';
import { FinanceData, Income, Expense, Loan, BorrowedMoney, FinancialReminder, UserProfile, UserSettings, ChitFund, OtherSaving, ChitFundEntry, OtherSavingEntry } from '../types.ts';
import { getMonthKey, triggerHaptic } from '../utils.ts';

const STORAGE_KEY = 'finance_wise_data_v2';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};

const initialData: FinanceData = {
  profile: { name: '' },
  settings: {
    currency: 'INR',
    appLockEnabled: false,
    appLockPin: '',
    biometricsEnabled: false,
    theme: 'light',
    hasCompletedOnboarding: false,
    customIncomeCategories: [],
    customExpenseCategories: [],
    customReminderTypes: []
  },
  incomes: [],
  expenses: [],
  loans: [],
  borrowed: [],
  reminders: [],
  chitFunds: [],
  otherSavings: []
};

export const useFinance = () => {
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [data, setData] = useState<FinanceData>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...initialData,
          ...parsed,
          profile: parsed.profile || initialData.profile,
          settings: { ...initialData.settings, ...parsed.settings },
          incomes: parsed.incomes || [],
          expenses: parsed.expenses || [],
          loans: parsed.loans || [],
          borrowed: parsed.borrowed || [],
          reminders: parsed.reminders || [],
          chitFunds: parsed.chitFunds || [],
          otherSavings: parsed.otherSavings || []
        };
      }
      return initialData;
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
      return initialData;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save data to localStorage", e);
    }
  }, [data]);

  const updateProfile = (profile: UserProfile) => {
    setData(prev => ({ ...prev, profile }));
    triggerHaptic('success');
  };

  const updateSettings = (settings: UserSettings) => {
    setData(prev => ({ ...prev, settings }));
    triggerHaptic('light');
  };
  
  const resetData = () => {
    setData(initialData);
    localStorage.removeItem(STORAGE_KEY);
    triggerHaptic('warning');
  };
  
  const importData = (newData: FinanceData) => {
    setData(newData);
    triggerHaptic('success');
  };

  // Generic helpers for linked transactions
  const createExpenseLink = (category: string, amount: number, date: string, notes: string) => {
    const newExpense: Expense = {
      id: generateId(),
      category,
      amount,
      date,
      notes: `(Auto-link) ${notes}`
    };
    setData(prev => ({ ...prev, expenses: [...prev.expenses, newExpense] }));
  };

  const addIncome = (income: Omit<Income, 'id' | 'lastUpdated'>) => {
    setData(prev => ({ ...prev, incomes: [...prev.incomes, { ...income, id: generateId(), lastUpdated: new Date().toISOString() }] }));
    triggerHaptic('success');
  };
  const deleteIncome = (id: string) => {
    setData(prev => ({ ...prev, incomes: prev.incomes.filter(i => i.id !== id) }));
    triggerHaptic('light');
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setData(prev => ({ ...prev, expenses: [...prev.expenses, { ...expense, id: generateId() }] }));
    triggerHaptic('success');
  };
  const deleteExpense = (id: string) => {
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
    triggerHaptic('light');
  };

  const addLoan = (loan: Omit<Loan, 'id'>) => {
    setData(prev => ({ ...prev, loans: [...prev.loans, { ...loan, id: generateId(), paidMonths: [] }] }));
    triggerHaptic('success');
  };
  const toggleLoanMonthPaid = (loanId: string, monthKey: string) => {
    setData(prev => {
      const loan = prev.loans.find(l => l.id === loanId);
      if (!loan) return prev;
      
      const isPaid = loan.paidMonths.includes(monthKey);
      const newPaidMonths = isPaid ? loan.paidMonths.filter(m => m !== monthKey) : [...loan.paidMonths, monthKey];
      
      // If marking as paid, create an expense
      if (!isPaid) {
        createExpenseLink('Loan EMI', loan.emi, `${monthKey}-01`, `EMI payment for ${loan.name}`);
      }

      triggerHaptic('success');
      return {
        ...prev,
        loans: prev.loans.map(l => l.id === loanId ? { ...l, paidMonths: newPaidMonths } : l)
      };
    });
  };

  const markReminderAsPaid = (id: string) => {
    setData(prev => {
      const r = prev.reminders.find(rem => rem.id === id);
      if (!r) return prev;

      // Create linked expense
      if (r.amount) {
        createExpenseLink(r.type || 'Payment', r.amount, r.dueDate, `Payment for reminder: ${r.title}`);
      }

      const updatedReminders = prev.reminders.map(rem => {
        if (rem.id !== id) return rem;
        if (rem.frequency === 'One-time') return { ...rem, isCompleted: true };
        
        const nextDate = new Date(rem.dueDate);
        if (rem.frequency === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
        else if (rem.frequency === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        else if (rem.frequency === 'Yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
        
        return { ...rem, dueDate: nextDate.toISOString().slice(0, 10) };
      });

      triggerHaptic('success');
      return { ...prev, reminders: updatedReminders };
    });
  };

  // Contextual Totals Calculation
  const filteredIncomes = data.incomes.filter(i => getMonthKey(i.date) === selectedMonth);
  const filteredExpenses = data.expenses.filter(e => getMonthKey(e.date) === selectedMonth);
  
  const totals = {
    income: filteredIncomes.reduce((sum, i) => sum + i.amount, 0),
    monthlyExpenses: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
    monthlyEMIs: data.loans.reduce((sum, l) => sum + l.emi, 0), // EMIs are typically recurring
    monthlyBorrowed: 0,
  };

  const remainingBalance = Math.max(0, totals.income - totals.monthlyExpenses);

  return {
    data,
    totals,
    selectedMonth,
    setSelectedMonth,
    remainingBalance,
    updateProfile,
    updateSettings,
    resetData,
    importData,
    addIncome, deleteIncome,
    addExpense, deleteExpense,
    addLoan, toggleLoanMonthPaid,
    markReminderAsPaid,
    // (Other methods left for brevity, assuming similar pattern)
    addChitFund: (chit: any) => setData(prev => ({ ...prev, chitFunds: [...prev.chitFunds, { ...chit, id: generateId(), entries: [] }] })),
    addOtherSaving: (saving: any) => setData(prev => ({ ...prev, otherSavings: [...prev.otherSavings, { ...saving, id: generateId(), entries: [] }] })),
    addBorrowed: (entry: any) => setData(prev => ({ ...prev, borrowed: [...prev.borrowed, { ...entry, id: generateId() }] })),
    addReminder: (reminder: any) => setData(prev => ({ ...prev, reminders: [...prev.reminders, { ...reminder, id: generateId(), isCompleted: false }] })),
    updateIncome: (id: string, updated: any) => setData(prev => ({ ...prev, incomes: prev.incomes.map(i => i.id === id ? { ...updated, id, lastUpdated: new Date().toISOString() } : i) })),
    updateExpense: (id: string, updated: any) => setData(prev => ({ ...prev, expenses: prev.expenses.map(e => e.id === id ? { ...updated, id } : e) })),
    updateLoan: (id: string, updated: any) => setData(prev => ({ ...prev, loans: prev.loans.map(l => l.id === id ? { ...updated, id } : l) })),
    deleteLoan: (id: string) => setData(prev => ({ ...prev, loans: prev.loans.filter(l => l.id !== id) })),
    updateBorrowed: (id: string, updated: any) => setData(prev => ({ ...prev, borrowed: prev.borrowed.map(b => b.id === id ? { ...updated, id } : b) })),
    deleteBorrowed: (id: string) => setData(prev => ({ ...prev, borrowed: prev.borrowed.filter(b => b.id !== id) })),
    updateReminder: (id: string, updated: any) => setData(prev => ({ ...prev, reminders: prev.reminders.map(r => r.id === id ? { ...updated, id } : r) })),
    deleteReminder: (id: string) => setData(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) })),
    addChitEntry: (cid: string, e: any) => setData(prev => ({ ...prev, chitFunds: prev.chitFunds.map(c => c.id === cid ? { ...c, entries: [...c.entries, { ...e, id: generateId() }] } : c) })),
    addSavingEntry: (sid: string, e: any) => setData(prev => ({ ...prev, otherSavings: prev.otherSavings.map(s => s.id === sid ? { ...s, entries: [...s.entries, { ...e, id: generateId() }] } : s) })),
    updateChitFund: (id: string, updated: any) => setData(prev => ({ ...prev, chitFunds: prev.chitFunds.map(c => c.id === id ? { ...updated, id } : c) })),
    deleteChitFund: (id: string) => setData(prev => ({ ...prev, chitFunds: prev.chitFunds.filter(c => c.id !== id) })),
    updateChitEntry: (cid: string, eid: string, u: any) => setData(prev => ({ ...prev, chitFunds: prev.chitFunds.map(c => c.id === cid ? { ...c, entries: c.entries.map(e => e.id === eid ? { ...u, id: eid } : e) } : c) })),
    deleteChitEntry: (cid: string, eid: string) => setData(prev => ({ ...prev, chitFunds: prev.chitFunds.map(c => c.id === cid ? { ...c, entries: c.entries.filter(e => e.id !== eid) } : c) })),
    updateOtherSaving: (id: string, updated: any) => setData(prev => ({ ...prev, otherSavings: prev.otherSavings.map(s => s.id === id ? { ...updated, id } : s) })),
    deleteOtherSaving: (id: string) => setData(prev => ({ ...prev, otherSavings: prev.otherSavings.filter(s => s.id !== id) })),
    deleteSavingEntry: (sid: string, eid: string) => setData(prev => ({ ...prev, otherSavings: prev.otherSavings.map(s => s.id === sid ? { ...s, entries: s.entries.filter(e => e.id !== eid) } : s) })),
    addCustomIncomeCategory: (c: string) => setData(prev => ({ ...prev, settings: { ...prev.settings, customIncomeCategories: [...new Set([...prev.settings.customIncomeCategories, c])] } })),
    addCustomExpenseCategory: (c: string) => setData(prev => ({ ...prev, settings: { ...prev.settings, customExpenseCategories: [...new Set([...prev.settings.customExpenseCategories, c])] } })),
    addCustomReminderType: (t: string) => setData(prev => ({ ...prev, settings: { ...prev.settings, customReminderTypes: [...new Set([...prev.settings.customReminderTypes, t])] } }))
  };
};
