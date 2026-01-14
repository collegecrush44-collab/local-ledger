
import { useState, useEffect } from 'react';
import { FinanceData, Income, Expense, Loan, BorrowedMoney, FinancialReminder, UserProfile, UserSettings, ChitFund, OtherSaving, ChitFundEntry, OtherSavingEntry, NotificationEntry } from '../types.ts';
import { loadData, saveData } from '../db.ts';

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
    notificationsEnabled: true, // Default to true for reminders
    customIncomeCategories: [],
    customExpenseCategories: [],
    customReminderTypes: [],
    customReminderCategories: []
  },
  incomes: [],
  expenses: [],
  loans: [],
  borrowed: [],
  reminders: [],
  chitFunds: [],
  otherSavings: [],
  notificationHistory: []
};

export const useFinance = () => {
  const [data, setData] = useState<FinanceData>(initialData);
  const [isHydrated, setIsHydrated] = useState(false);

  // Async Hydration from IndexedDB
  useEffect(() => {
    const hydrate = async () => {
      try {
        const stored = await loadData();
        if (stored) {
          // Migrations and Defaults
          if (!stored.reminders) stored.reminders = [];
          if (!stored.chitFunds) stored.chitFunds = [];
          if (!stored.otherSavings) stored.otherSavings = [];
          if (!stored.notificationHistory) stored.notificationHistory = [];
          if (!stored.profile) stored.profile = initialData.profile;
          if (!stored.settings) stored.settings = initialData.settings;
          // Ensure new setting exists
          if (stored.settings.notificationsEnabled === undefined) {
            stored.settings.notificationsEnabled = initialData.settings.notificationsEnabled;
          }
          if (stored.settings.customReminderCategories === undefined) {
            stored.settings.customReminderCategories = [];
          }
          setData(stored);
        } else {
          // Fallback to legacy localStorage if available during transition
          const legacy = localStorage.getItem('finance_wise_data_v2');
          if (legacy) {
            const parsed = JSON.parse(legacy);
            setData(parsed);
            await saveData(parsed);
          }
        }
      } catch (e) {
        console.error("Hydration error:", e);
      } finally {
        setIsHydrated(true);
      }
    };
    hydrate();
  }, []);

  // Async Save to IndexedDB
  useEffect(() => {
    if (isHydrated) {
      saveData(data).catch(e => console.error("Auto-save failed:", e));
    }
  }, [data, isHydrated]);

  const addLog = (title: string, message: string, type: NotificationEntry['type'] = 'success') => {
    const newLog: NotificationEntry = {
      id: generateId(),
      title,
      message,
      timestamp: new Date().toISOString(),
      type
    };
    setData(prev => ({
      ...prev,
      notificationHistory: [newLog, ...prev.notificationHistory].slice(0, 50) // Keep last 50
    }));
  };

  const updateProfile = (profile: UserProfile) => setData(prev => ({ ...prev, profile }));
  const updateSettings = (settings: UserSettings) => setData(prev => ({ ...prev, settings }));
  const resetData = () => setData(initialData);
  const clearNotificationHistory = () => setData(prev => ({ ...prev, notificationHistory: [] }));
  const importData = (newData: FinanceData) => setData(newData);

  const addCustomIncomeCategory = (category: string) => {
    if (!data.settings.customIncomeCategories.includes(category)) {
      updateSettings({ ...data.settings, customIncomeCategories: [...data.settings.customIncomeCategories, category] });
    }
  };

  const addCustomExpenseCategory = (category: string) => {
    if (!data.settings.customExpenseCategories.includes(category)) {
      updateSettings({ ...data.settings, customExpenseCategories: [...data.settings.customExpenseCategories, category] });
    }
  };

  const addCustomReminderCategory = (category: string) => {
    if (!data.settings.customReminderCategories.includes(category)) {
      updateSettings({ ...data.settings, customReminderCategories: [...data.settings.customReminderCategories, category] });
    }
  };

  const addChitFund = (chit: Omit<ChitFund, 'id' | 'entries'>) => {
    setData(prev => ({ ...prev, chitFunds: [...prev.chitFunds, { ...chit, id: generateId(), entries: [] }] }));
    addLog('Chit Created', `New chit fund "${chit.name}" added.`);
  };
  const updateChitFund = (id: string, updated: Omit<ChitFund, 'id'>) => {
    setData(prev => ({ ...prev, chitFunds: prev.chitFunds.map(c => c.id === id ? { ...updated, id } : c) }));
  };
  const deleteChitFund = (id: string) => {
    const name = data.chitFunds.find(c => c.id === id)?.name;
    setData(prev => ({ ...prev, chitFunds: prev.chitFunds.filter(c => c.id !== id) }));
    addLog('Chit Deleted', `Chit fund "${name}" removed.`);
  };

  const updateChitEntry = (chitId: string, entryId: string, entry: Omit<ChitFundEntry, 'id'>) => {
    setData(prev => ({
      ...prev,
      chitFunds: prev.chitFunds.map(c => c.id === chitId ? {
        ...c,
        entries: c.entries.map(e => e.id === entryId ? { ...entry, id: entryId } : e)
      } : c)
    }));
  };

  const deleteChitEntry = (chitId: string, entryId: string) => {
    setData(prev => ({
      ...prev,
      chitFunds: prev.chitFunds.map(c => c.id === chitId ? {
        ...c,
        entries: c.entries.filter(e => e.id !== entryId)
      } : c)
    }));
  };

  const addChitEntry = (chitId: string, entry: Omit<ChitFundEntry, 'id'>) => {
    setData(prev => ({
      ...prev,
      chitFunds: prev.chitFunds.map(c => c.id === chitId ? { ...c, entries: [...c.entries, { ...entry, id: generateId() }] } : c)
    }));
    const chit = data.chitFunds.find(c => c.id === chitId);
    addLog('Chit Payment', `Logged payment for ${chit?.name}.`);
  };

  const addOtherSaving = (saving: Omit<OtherSaving, 'id' | 'entries'>) => {
    setData(prev => ({ ...prev, otherSavings: [...prev.otherSavings, { ...saving, id: generateId(), entries: [] }] }));
  };

  const updateOtherSaving = (id: string, updated: Omit<OtherSaving, 'id'>) => {
    setData(prev => ({ ...prev, otherSavings: prev.otherSavings.map(s => s.id === id ? { ...updated, id } : s) }));
  };

  const deleteOtherSaving = (id: string) => {
    setData(prev => ({ ...prev, otherSavings: prev.otherSavings.filter(s => s.id !== id) }));
  };

  const addSavingEntry = (savingId: string, entry: Omit<OtherSavingEntry, 'id'>) => {
    setData(prev => ({
      ...prev,
      otherSavings: prev.otherSavings.map(s => s.id === savingId ? { ...s, entries: [...s.entries, { ...entry, id: generateId() }] } : s)
    }));
    const bucket = data.otherSavings.find(s => s.id === savingId);
    addLog('Saving Added', `Deposited ₹${entry.amount} into ${bucket?.name}.`);
  };

  const deleteSavingEntry = (savingId: string, entryId: string) => {
    setData(prev => ({
      ...prev,
      otherSavings: prev.otherSavings.map(s => s.id === savingId ? {
        ...s,
        entries: s.entries.filter(e => e.id !== entryId)
      } : s)
    }));
  };

  const addIncome = (income: Omit<Income, 'id' | 'lastUpdated'>) => {
    setData(prev => ({ ...prev, incomes: [...prev.incomes, { ...income, id: generateId(), lastUpdated: new Date().toISOString() }] }));
    addLog('Income Added', `Added ₹${income.amount} from ${income.category}.`);
  };

  const updateIncome = (id: string, income: Omit<Income, 'id' | 'lastUpdated'>) => {
    setData(prev => ({
      ...prev,
      incomes: prev.incomes.map(i => i.id === id ? { ...income, id, lastUpdated: new Date().toISOString() } : i)
    }));
  };

  const deleteIncome = (id: string) => {
    setData(prev => ({ ...prev, incomes: prev.incomes.filter(i => i.id !== id) }));
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setData(prev => ({ ...prev, expenses: [...prev.expenses, { ...expense, id: generateId() }] }));
    addLog('Expense Logged', `Recorded ₹${expense.amount} for ${expense.category}.`);
  };

  const updateExpense = (id: string, expense: Omit<Expense, 'id'>) => {
    setData(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...expense, id } : e)
    }));
  };

  const deleteExpense = (id: string) => {
    setData(prev => ({ ...prev, expenses: prev.expenses.filter(e => e.id !== id) }));
  };

  // Fixed: Removed manual payments/paidMonths initialization as LoanSection provides them via Omit<Loan, 'id'>
  const addLoan = (loan: Omit<Loan, 'id'>) => {
    setData(prev => ({ ...prev, loans: [...prev.loans, { ...loan, id: generateId() }] }));
    addLog('Loan Started', `Started tracking loan: ${loan.name}.`);
  };

  const deleteLoan = (id: string) => {
    setData(prev => ({ ...prev, loans: prev.loans.filter(l => l.id !== id) }));
  };

  // Fixed: Use payments property instead of legacy paidMonths
  const updateLoan = (id: string, updated: Omit<Loan, 'id'>) => {
    const prevLoan = data.loans.find(l => l.id === id);
    setData(prev => ({ ...prev, loans: prev.loans.map(l => l.id === id ? { ...updated, id } : l) }));
    
    if (updated.payments.length > (prevLoan?.payments.length || 0)) {
      addLog('EMI Paid', `Marked current month EMI for ${updated.name} as paid.`, 'payment');
    }
  };

  const addBorrowed = (entry: Omit<BorrowedMoney, 'id'>) => {
    setData(prev => ({ ...prev, borrowed: [...prev.borrowed, { ...entry, id: generateId() }] }));
    addLog('Debt Created', `Recorded money borrowed from ${entry.personName}.`);
  };

  const deleteBorrowed = (id: string) => {
    setData(prev => ({ ...prev, borrowed: prev.borrowed.filter(b => b.id !== id) }));
  };

  const updateBorrowed = (id: string, updated: Omit<BorrowedMoney, 'id'>) => {
    const prevItem = data.borrowed.find(b => b.id === id);
    setData(prev => ({ ...prev, borrowed: prev.borrowed.map(b => b.id === id ? { ...updated, id } : b) }));
    
    if (updated.payments.length > (prevItem?.payments.length || 0)) {
      const lastPayment = updated.payments[updated.payments.length - 1];
      addLog('Debt Payment', `Paid ₹${lastPayment.amount} to ${updated.personName}.`, 'payment');
    }
  };

  const addReminder = (reminder: Omit<FinancialReminder, 'id' | 'isCompleted'>) => {
    setData(prev => ({ ...prev, reminders: [...prev.reminders, { ...reminder, id: generateId(), isCompleted: false }] }));
    addLog('Reminder Set', `Alert set for: ${reminder.title}.`);
  };

  const updateReminder = (id: string, updated: Omit<FinancialReminder, 'id'>) => {
    setData(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => r.id === id ? { ...updated, id } : r)
    }));
  };

  const deleteReminder = (id: string) => {
    setData(prev => ({ ...prev, reminders: prev.reminders.filter(r => r.id !== id) }));
  };

  const markReminderAsPaid = (id: string) => {
    let reminderName = '';
    setData(prev => {
      const updatedReminders = prev.reminders.map(r => {
        if (r.id !== id) return r;
        reminderName = r.title;
        if (r.frequency === 'One-time') {
          return { ...r, isCompleted: true };
        } else {
          const incrementDate = (dateStr: string) => {
            const nextDate = new Date(dateStr);
            if (r.frequency === 'Weekly') nextDate.setDate(nextDate.getDate() + 7);
            else if (r.frequency === 'Monthly') nextDate.setMonth(nextDate.getMonth() + 1);
            else if (r.frequency === 'Yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
            return nextDate.toISOString().slice(0, 10);
          };

          return { 
            ...r, 
            dueDate: incrementDate(r.dueDate),
            reminderDate: incrementDate(r.reminderDate)
          };
        }
      });
      return { ...prev, reminders: updatedReminders };
    });
    addLog('Reminder Completed', `Payment for "${reminderName}" was successfully marked as done.`, 'success');
  };

  const totals = {
    income: data.incomes.reduce((sum, i) => sum + i.amount, 0),
    monthlyExpenses: data.expenses.reduce((sum, e) => sum + e.amount, 0),
    // Fixed: Use emiAmount instead of emi
    monthlyEMIs: data.loans.reduce((sum, l) => sum + l.emiAmount, 0),
    monthlyBorrowed: 0,
  };

  const totalFixedCommitments = totals.monthlyExpenses + totals.monthlyEMIs;
  const remainingBalance = Math.max(0, totals.income - totalFixedCommitments);

  return {
    data,
    isHydrated,
    totals,
    remainingBalance,
    updateProfile,
    updateSettings,
    addCustomIncomeCategory,
    addCustomExpenseCategory,
    addCustomReminderCategory,
    resetData,
    clearNotificationHistory,
    importData,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense,
    addLoan, updateLoan, deleteLoan,
    addBorrowed, updateBorrowed, deleteBorrowed,
    addReminder, updateReminder, deleteReminder, markReminderAsPaid,
    addChitFund, updateChitFund, deleteChitFund, addChitEntry, updateChitEntry, deleteChitEntry,
    addOtherSaving, updateOtherSaving, deleteOtherSaving, addSavingEntry, deleteSavingEntry
  };
};
