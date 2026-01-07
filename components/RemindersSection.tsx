import React, { useState } from 'react';
import { Card, Heading, Button, SubHeading, ConfirmModal, CountUp } from './Shared.tsx';
import { formatCurrency, getLoanStatus, getBorrowedStatus, triggerHaptic } from '../utils.ts';
import { FinancialReminder, ReminderType, ReminderFrequency, Loan, BorrowedMoney } from '../types.ts';

interface RemindersProps {
  reminders: FinancialReminder[];
  loans: Loan[];
  borrowed: BorrowedMoney[];
  customTypes: string[];
  onAdd: (reminder: Omit<FinancialReminder, 'id' | 'isCompleted'>) => void;
  onUpdate: (id: string, reminder: Omit<FinancialReminder, 'id'>) => void;
  onDelete: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onAddCustomType: (type: string) => void;
}

const RemindersSection: React.FC<RemindersProps> = ({ reminders, loans, borrowed, customTypes, onAdd, onUpdate, onDelete, onMarkPaid, onAddCustomType }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReminderType>('Payment');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState<ReminderFrequency>('Monthly');
  const [notes, setNotes] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      type,
      amount: amount ? parseFloat(amount) : undefined,
      dueDate,
      reminderDate: reminderDate || undefined,
      frequency,
      isCompleted: false,
      notes: notes.trim() || undefined
    };

    if (editingId) {
      onUpdate(editingId, payload);
    } else {
      onAdd(payload);
      triggerHaptic('success');
    }
    resetForm();
  };

  const handleMarkPaid = (id: string) => {
    setAnimatingId(id);
    triggerHaptic('success');
    setTimeout(() => {
      onMarkPaid(id);
      setAnimatingId(null);
    }, 400);
  };

  const resetForm = () => {
    setTitle(''); setType('Payment'); setAmount('');
    setDueDate(new Date().toISOString().slice(0, 10));
    setReminderDate(new Date().toISOString().slice(0, 10));
    setFrequency('Monthly');
    setNotes('');
    setEditingId(null);
    setShowForm(false);
  };

  const activeReminders = reminders.filter(r => !r.isCompleted);
  const overdueReminders = activeReminders.filter(r => r.dueDate < todayStr);
  const todayReminders = activeReminders.filter(r => r.dueDate === todayStr);
  const upcomingReminders = activeReminders.filter(r => r.dueDate > todayStr);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Subscription': return 'fa-clapperboard';
      case 'Credit Card': return 'fa-credit-card';
      case 'Rent': return 'fa-house-user';
      case 'Chit Fund': return 'fa-users-line';
      case 'Loan': return 'fa-landmark';
      case 'Debt': return 'fa-handshake-angle';
      default: return 'fa-bell';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Subscription': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600';
      case 'Credit Card': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-600';
      case 'Rent': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600';
      case 'Loan': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600';
      case 'Debt': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600';
      default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-1 animate-slide-up">
        <Heading className="text-2xl font-black dark:text-white tracking-tight">Financial Reminders</Heading>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all animate-pulse-subtle"
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        )}
      </div>

      {showForm && (
        <Card className="animate-slide-up rounded-[2.5rem] p-6 shadow-xl border-blue-50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <input 
              placeholder="Title (e.g. Gym Subscription)" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl px-5 py-5 text-slate-900 dark:text-slate-100 font-bold outline-none"
            />
            <div className="flex gap-3">
               <Button type="submit" className="flex-[2] py-4 uppercase tracking-widest text-xs">Set Reminder</Button>
               <Button variant="secondary" onClick={resetForm} className="flex-1 text-xs">Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {overdueReminders.length > 0 && (
        <div className="space-y-4 animate-slide-up delay-1">
          <SubHeading className="text-rose-500 font-black tracking-widest px-2 text-[11px]">OVERDUE PAYMENTS</SubHeading>
          {overdueReminders.map(r => <ReminderCard key={r.id} r={r} onMarkPaid={handleMarkPaid} isOverdue getIcon={getIcon} getColor={getTypeColor} isAnimating={animatingId === r.id} />)}
        </div>
      )}

      {todayReminders.length > 0 && (
        <div className="space-y-4 animate-slide-up delay-2">
          <SubHeading className="text-amber-500 font-black tracking-widest px-2 text-[11px]">DUE TODAY</SubHeading>
          {todayReminders.map(r => <ReminderCard key={r.id} r={r} onMarkPaid={handleMarkPaid} isToday getIcon={getIcon} getColor={getTypeColor} isAnimating={animatingId === r.id} />)}
        </div>
      )}

      <div className="space-y-4 animate-slide-up delay-3">
        <SubHeading className="font-black tracking-widest px-2 text-[11px] text-slate-400">UPCOMING REMINDERS</SubHeading>
        {upcomingReminders.length === 0 && overdueReminders.length === 0 && todayReminders.length === 0 ? (
          <div className="text-center py-10 text-slate-300 text-sm">No active reminders</div>
        ) : (
          upcomingReminders.sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map((r, idx) => (
            <ReminderCard key={r.id} r={r} onMarkPaid={handleMarkPaid} getIcon={getIcon} getColor={getTypeColor} isAnimating={animatingId === r.id} delay={`delay-${Math.min(idx+1, 4)}`} />
          ))
        )}
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && onDelete(deleteId)}
        title="Delete Reminder?"
        message="This will stop tracking this payment."
      />
    </div>
  );
};

const ReminderCard = ({ r, onMarkPaid, isOverdue, isToday, getIcon, getColor, isAnimating, delay }: any) => {
  return (
    <Card className={`relative overflow-hidden border-none shadow-sm rounded-[2.2rem] p-5 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'} ${isOverdue ? 'bg-rose-50/40 dark:bg-rose-950/20 ring-1 ring-rose-200' : isToday ? 'bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-200' : 'bg-white dark:bg-slate-900'} ${delay}`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${getColor(r.type)} shadow-sm ${isToday || isOverdue ? 'animate-bell' : ''}`}>
            <i className={`fa-solid ${getIcon(r.type)}`}></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">{r.title}</h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${isOverdue ? 'bg-rose-200 text-rose-700' : isToday ? 'bg-amber-200 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                DUE: {r.dueDate}
              </span>
            </div>
            {r.amount && <div className="text-base font-black text-slate-900 dark:text-white mt-2">{formatCurrency(r.amount)}</div>}
          </div>
        </div>
        <button 
          onClick={() => onMarkPaid(r.id)}
          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-lg active:scale-95 transition-all"
        >
          Mark Paid
        </button>
      </div>
    </Card>
  );
};

export default RemindersSection;