export type IncomeCategory = string;

export interface UserProfile {
  name: string;
}

export interface UserSettings {
  currency: string;
  appLockEnabled: boolean;
  appLockPin: string;
  biometricsEnabled: boolean;
  theme: 'light' | 'dark';
  hasCompletedOnboarding: boolean;
  customIncomeCategories: string[];
  customExpenseCategories: string[];
  customReminderTypes: string[];
  lastBackupDate?: string; // New: track for offline safety
}

export interface Income {
  id: string;
  category: IncomeCategory;
  amount: number;
  date: string;
  notes?: string;
  lastUpdated: string;
}

export interface Expense {
  id: string;
  amount: number;
  date: string;
  category: string;
  notes?: string;
}

export interface Loan {
  id: string;
  name: string;
  totalAmount: number;
  emi: number;
  startDate: string;
  endDate: string;
  paidMonths: string[]; // Stores months in "YYYY-MM" format
  notes?: string;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  imageUrl?: string;
}

export interface BorrowedMoney {
  id: string;
  personName: string;
  totalAmount: number;
  totalPaid: number;
  startDate: string;
  payments: Payment[];
  imageUrl?: string;
}

export interface ChitFundEntry {
  id: string;
  date: string;
  isTaken: boolean;
  takenBy?: string;
  amountPaid: number;
  amountReceived: number;
  winningBid?: number;
  notes?: string;
}

export interface ChitFund {
  id: string;
  name: string;
  totalChitAmount: number;
  monthlyContribution: number;
  totalMonths: number;
  startDate: string;
  chitDay: number;
  entries: ChitFundEntry[];
}

export interface OtherSavingEntry {
  id: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface OtherSaving {
  id: string;
  name: string;
  type: 'Daily' | 'Monthly' | 'Piggy bank' | 'Gold' | 'Informal' | 'Other';
  entries: OtherSavingEntry[];
}

export type ReminderFrequency = 'One-time' | 'Weekly' | 'Monthly' | 'Yearly';
export type ReminderType = string;

export interface FinancialReminder {
  id: string;
  type: ReminderType;
  title: string;
  amount?: number;
  dueDate: string;
  reminderDate?: string;
  frequency: ReminderFrequency;
  isCompleted: boolean;
  notes?: string;
}

export interface FinanceData {
  profile: UserProfile;
  settings: UserSettings;
  incomes: Income[];
  expenses: Expense[];
  loans: Loan[];
  borrowed: BorrowedMoney[];
  reminders: FinancialReminder[];
  chitFunds: ChitFund[];
  otherSavings: OtherSaving[];
}

export type ViewType = 'dashboard' | 'income' | 'expenses' | 'loans' | 'reminders' | 'profile' | 'chits';