
import React from 'react';
import { Card, Heading, SubHeading, CountUp } from './Shared.tsx';
import { formatCurrency, getBorrowedStatus } from '../utils.ts';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { FinancialReminder, FinanceData, ViewType } from '../types.ts';

interface DashboardProps {
  data: FinanceData;
  totals: {
    income: number;
    monthlyExpenses: number;
    monthlyEMIs: number;
    monthlyBorrowed: number;
  };
  remainingBalance: number;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  borrowed: any[];
  reminders: FinancialReminder[];
  onViewAlerts: () => void;
  onNavigate: (view: ViewType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  data, totals, remainingBalance, selectedMonth, onMonthChange,
  borrowed, reminders, onViewAlerts, onNavigate 
}) => {
  const theme = data.settings.theme;
  const totalBorrowedBalance = borrowed.reduce((sum, b) => sum + getBorrowedStatus(b).remainingBalance, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const urgentReminders = reminders.filter(r => !r.isCompleted && r.dueDate <= todayStr);

  const chartData = [
    { name: 'Spending', value: totals.monthlyExpenses, color: theme === 'dark' ? '#334155' : '#f1f5f9' },
    { name: 'Savings', value: remainingBalance, color: '#10b981' }, 
  ].filter(d => d.value > 0);

  const displayData = chartData.length > 0 ? chartData : [{ name: 'Empty', value: 1, color: '#e2e8f0' }];
  const savingsPercent = totals.income > 0 ? Math.round((remainingBalance / totals.income) * 100) : 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Month Picker Header */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-[2rem] shadow-sm border border-slate-50 dark:border-slate-800 animate-slide-up">
        <button 
          onClick={() => {
            const d = new Date(selectedMonth);
            d.setMonth(d.getMonth() - 1);
            onMonthChange(d.toISOString().slice(0, 7));
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 transition-colors active:scale-90"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <div className="text-center">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">SELECTED PERIOD</div>
          <div className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
            {new Date(selectedMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
        </div>
        <button 
          onClick={() => {
            const d = new Date(selectedMonth);
            d.setMonth(d.getMonth() + 1);
            onMonthChange(d.toISOString().slice(0, 7));
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 transition-colors active:scale-90"
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      {/* Summary Card */}
      <Card className="rounded-[2.5rem] p-6 bg-white dark:bg-slate-900 border-none shadow-sm animate-slide-up delay-1">
        <div className="flex divide-x divide-slate-100 dark:divide-slate-800">
          <div className="flex-1 pr-4" onClick={() => onNavigate('income')}>
            <SubHeading className="text-[9px] font-black opacity-60">MONTHLY INCOME</SubHeading>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 truncate">
              <CountUp value={totals.income} prefix="₹" />
            </div>
          </div>
          <div className="flex-1 pl-4" onClick={() => onNavigate('chits')}>
            <SubHeading className="text-[9px] font-black opacity-60">EST. SAVINGS</SubHeading>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-500 truncate">
              <CountUp value={remainingBalance} prefix="₹" />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Chart */}
      <Card className="relative p-8 flex flex-col items-center justify-center rounded-[3rem] border-none bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none animate-slide-up delay-2">
        <div className="w-full h-56 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={displayData} innerRadius={70} outerRadius={95} dataKey="value" stroke="none" startAngle={90} endAngle={450}>
                {displayData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-black text-slate-800 dark:text-slate-100">{savingsPercent}%</div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SAVED</div>
          </div>
        </div>
        <div className="mt-4 text-[11px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 px-6 py-2 rounded-full uppercase tracking-widest">
          {totals.monthlyExpenses > totals.income ? 'OVERSPENT' : 'ON TRACK'}
        </div>
      </Card>

      {/* Status Sections */}
      <div className="space-y-3 animate-slide-up delay-3">
        <SummaryRow label="Monthly Bills" value={totals.monthlyExpenses} icon="fa-receipt" color="bg-blue-600" onClick={() => onNavigate('expenses')} />
        <SummaryRow label="Active Loans" value={totalBorrowedBalance} icon="fa-landmark" color="bg-indigo-600" onClick={() => onNavigate('loans')} />
      </div>

      {urgentReminders.length > 0 && (
        <button onClick={onViewAlerts} className="w-full bg-rose-50 dark:bg-rose-950/20 p-5 rounded-[2rem] flex items-center justify-between border border-rose-100 animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-200/50 animate-bell"><i className="fa-solid fa-bell"></i></div>
            <span className="font-black text-xs text-rose-700 uppercase tracking-tight">You have {urgentReminders.length} pending alerts!</span>
          </div>
          <i className="fa-solid fa-arrow-right text-rose-300"></i>
        </button>
      )}
    </div>
  );
};

const SummaryRow = ({ label, value, icon, color, onClick }: any) => (
  <div onClick={onClick} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all cursor-pointer hover:border-blue-500/30 group">
    <div className="flex items-center gap-4">
      <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/5 group-hover:animate-pulse-subtle`}><i className={`fa-solid ${icon}`}></i></div>
      <div>
        <div className="font-black text-slate-800 dark:text-slate-100 text-sm">{label}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">This Period</div>
      </div>
    </div>
    <div className="text-right">
      <div className="font-black text-slate-900 dark:text-white text-base">
        <CountUp value={value} prefix="₹" />
      </div>
    </div>
  </div>
);

export default Dashboard;
