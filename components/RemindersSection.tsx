
import React, { useState } from 'react';
import { Card, Heading, Button, SubHeading, ConfirmModal, Input } from './Shared.tsx';
import { formatCurrency, getLoanStatus, getBorrowedStatus } from '../utils.ts';
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
  const [showCompleted, setShowCompleted] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ReminderType>('Payment');
  const [category, setCategory] = useState('Other');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [reminderDate, setReminderDate] = useState(new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState<ReminderFrequency>('Monthly');
  const [notes, setNotes] = useState('');

  const [showAddType, setShowAddType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');

  const todayStr = new Date().toISOString().slice(0, 10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = amount ? parseFloat(amount) : undefined;
    
    if (parsedAmount !== undefined && parsedAmount < 0) {
      alert("Amount cannot be negative.");
      return;
    }

    // Logic Fix: Payment Date should not be a past date
    if (dueDate && dueDate < todayStr) {
      alert("Payment date cannot be in the past. Please select a future date.");
      return;
    }

    // Logic Fix: Alert date should not be a past date
    if (reminderDate && reminderDate < todayStr) {
      alert("Alert date cannot be in the past. Please select a future date.");
      return;
    }

    const payload = {
      title,
      type,
      category,
      amount: parsedAmount,
      dueDate,
      reminderDate: reminderDate || dueDate,
      frequency,
      isCompleted: false,
      notes: notes.trim() || undefined
    };

    if (editingId) {
      const existing = reminders.find(r => r.id === editingId);
      onUpdate(editingId, { ...payload, isCompleted: existing?.isCompleted || false });
    } else {
      const { isCompleted, ...addPayload } = payload;
      onAdd(addPayload);
      setTimeout(() => {
        document.getElementById('reminders-list-header')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    resetForm();
  };

  const handleAddType = () => {
    if (newTypeName.trim()) {
      onAddCustomType(newTypeName.trim());
      setType(newTypeName.trim() as ReminderType);
      setCategory(newTypeName.trim());
      setNewTypeName('');
      setShowAddType(false);
    }
  };

  const resetForm = () => {
    setTitle(''); setType('Payment'); setCategory('Other'); setAmount('');
    setDueDate(new Date().toISOString().slice(0, 10));
    setReminderDate(new Date().toISOString().slice(0, 10));
    setFrequency('Monthly');
    setNotes('');
    setEditingId(null);
    setShowForm(false);
    setShowAddType(false);
    setNewTypeName('');
  };

  const startEdit = (rem: FinancialReminder) => {
    setEditingId(rem.id);
    setTitle(rem.title);
    setType(rem.type);
    setCategory(rem.category);
    setAmount(rem.amount?.toString() || '');
    setDueDate(rem.dueDate);
    setReminderDate(rem.reminderDate || rem.dueDate);
    setFrequency(rem.frequency);
    setNotes(rem.notes || '');
    setShowForm(true);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeReminders = reminders.filter(r => !r.isCompleted);
  const completedReminders = reminders.filter(r => r.isCompleted);
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
      case 'Subscription': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'Credit Card': return 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400';
      case 'Rent': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400';
      case 'Loan': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';
      case 'Debt': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      default: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    }
  };

  const baseTypes: string[] = ['Payment', 'Subscription', 'Credit Card', 'Rent', 'Chit Fund', 'Other'];
  const allTypes = [...baseTypes, ...customTypes];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center px-1">
        <Heading className="text-2xl font-black dark:text-white tracking-tight">Reminders</Heading>
        <div className="flex gap-2">
          {completedReminders.length > 0 && (
            <button 
              onClick={() => setShowCompleted(!showCompleted)} 
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${showCompleted ? 'bg-slate-800 text-white' : 'bg-white dark:bg-slate-900 text-slate-400 border border-slate-100 dark:border-slate-800'}`}
              title="Show Completed"
            >
              <i className="fa-solid fa-clock-rotate-left text-sm"></i>
            </button>
          )}
          {!showForm && (
            <button 
              onClick={() => setShowForm(true)} 
              className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-[0_8px_20px_rgba(37,99,235,0.3)] active:scale-90 transition-all"
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="ring-[1px] ring-blue-50 dark:ring-blue-900/20 border-none shadow-2xl rounded-[2.5rem] p-6 animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input 
              label="Title"
              placeholder="e.g. Gym Subscription" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
              className="text-base"
            />
            
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Type</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {allTypes.map(t => (
                  <button key={t} type="button" onClick={() => { setType(t as ReminderType); setCategory(t); }} className={`py-2 px-3 rounded-xl text-[10px] font-black tracking-widest uppercase border transition-all truncate ${type === t ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>{t}</button>
                ))}
                {!showAddType ? (
                  <button type="button" onClick={() => setShowAddType(true)} className="py-2 px-3 rounded-xl text-[10px] font-black tracking-widest uppercase border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1"><i className="fa-solid fa-plus text-[10px]"></i>NEW</button>
                ) : (
                  <div className="w-full flex gap-2 animate-in slide-in-from-left-2 duration-200 mt-1">
                    <input autoFocus placeholder="New type" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} className="flex-1 bg-white dark:bg-slate-950 border border-blue-500 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none shadow-inner h-[46px]" />
                    <button type="button" onClick={handleAddType} className="px-4 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest">ADD</button>
                    <button type="button" onClick={() => setShowAddType(false)} className="text-slate-400 px-1"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Frequency</label>
                <select value={frequency} onChange={e => setFrequency(e.target.value as ReminderFrequency)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none shadow-inner text-xs min-h-[54px]">
                  <option value="One-time">One-time</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option><option value="Yearly">Yearly</option>
                </select>
              </div>
              <Input 
                label="Amount (₹)"
                type="number" 
                min="0" 
                step="any" 
                value={amount} 
                placeholder="0.00" 
                onChange={e => setAmount(e.target.value)} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Payment Date"
                type="date" 
                value={dueDate} 
                min={todayStr}
                onChange={e => setDueDate(e.target.value)} 
                required 
                className="text-xs"
              />
              <Input 
                label="Alert Date"
                type="date" 
                value={reminderDate} 
                min={todayStr} 
                onChange={e => setReminderDate(e.target.value)} 
                className="text-xs"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button type="button" onClick={resetForm} className="py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black rounded-[2rem] active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em]">CANCEL</button>
              <button type="submit" className="py-4 bg-blue-600 text-white font-black rounded-[2rem] shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em]">{editingId ? 'UPDATE' : 'SAVE'}</button>
            </div>
          </form>
        </Card>
      )}

      {showCompleted ? (
        <div className="space-y-4 animate-in slide-in-from-bottom-2">
          <SubHeading className="text-slate-400 dark:text-slate-500 font-black tracking-widest px-2 text-[10px] uppercase">PAST REMINDERS (HISTORY)</SubHeading>
          {completedReminders.length === 0 ? (
            <p className="text-center py-12 text-slate-300 dark:text-slate-700 text-xs font-bold uppercase tracking-tight">No completed reminders found</p>
          ) : (
            completedReminders.sort((a,b) => b.dueDate.localeCompare(a.dueDate)).map(r => (
              <ReminderCard key={r.id} r={r} onMarkPaid={onMarkPaid} onEdit={startEdit} onDelete={setDeleteId} isEditingGlobal={!!editingId} getIcon={getIcon} getColor={getTypeColor} isCompleted />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {overdueReminders.length > 0 && (
            <div className="space-y-4">
              <SubHeading className="text-rose-500 dark:text-rose-400 font-black tracking-widest px-2 text-[10px] uppercase">OVERDUE</SubHeading>
              {overdueReminders.map(r => <ReminderCard key={r.id} r={r} onMarkPaid={onMarkPaid} onEdit={startEdit} onDelete={setDeleteId} isEditingGlobal={!!editingId} isOverdue getIcon={getIcon} getColor={getTypeColor} />)}
            </div>
          )}
          {todayReminders.length > 0 && (
            <div className="space-y-4">
              <SubHeading className="text-amber-500 dark:text-amber-400 font-black tracking-widest px-2 text-[10px] uppercase">DUE TODAY</SubHeading>
              {todayReminders.map(r => <ReminderCard key={r.id} r={r} onMarkPaid={onMarkPaid} onEdit={startEdit} onDelete={setDeleteId} isEditingGlobal={!!editingId} isToday getIcon={getIcon} getColor={getTypeColor} />)}
            </div>
          )}
          <div className="space-y-4" id="reminders-list-header">
            <SubHeading className="font-black tracking-widest px-2 text-[10px] text-slate-400 dark:text-slate-600 uppercase">UPCOMING</SubHeading>
            {upcomingReminders.length === 0 && overdueReminders.length === 0 && todayReminders.length === 0 ? (
              <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 text-xs font-bold uppercase tracking-widest">No active reminders</div>
            ) : (
              upcomingReminders.sort((a,b) => a.dueDate.localeCompare(b.dueDate)).map(r => (
                <ReminderCard key={r.id} r={r} onMarkPaid={onMarkPaid} onEdit={startEdit} onDelete={setDeleteId} isEditingGlobal={!!editingId} getIcon={getIcon} getColor={getTypeColor} />
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && onDelete(deleteId)} title="Delete?" message="This will permanently stop tracking this payment." />
    </div>
  );
};

const ReminderCard = ({ r, onMarkPaid, onEdit, onDelete, isEditingGlobal, isOverdue, isToday, isCompleted, getIcon, getColor }: any) => {
  return (
    <Card className={`relative overflow-hidden border-none shadow-sm rounded-[2.2rem] p-5 transition-all active:scale-[0.99] ${isCompleted ? 'opacity-60 bg-slate-50 dark:bg-slate-800/20 grayscale-[0.5]' : isOverdue ? 'bg-rose-50/40 dark:bg-rose-900/10 ring-1 ring-rose-100 dark:ring-rose-900/40' : isToday ? 'bg-amber-50/40 dark:bg-amber-900/10 ring-1 ring-amber-100 dark:ring-amber-900/40' : 'bg-white dark:bg-slate-900 ring-1 ring-transparent dark:ring-slate-800/50'}`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${getColor(r.type)} shadow-sm`}>
            <i className={`fa-solid ${getIcon(r.type)}`}></i>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight">{r.title}</h4>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${isCompleted ? 'bg-emerald-100 text-emerald-600' : isOverdue ? 'bg-rose-100 text-rose-600' : isToday ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                {isCompleted ? 'COMPLETED' : `DUE: ${r.dueDate}`}
              </span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{r.frequency}</span>
            </div>
            {r.amount && <div className="text-base font-black text-slate-900 dark:text-white mt-2">{formatCurrency(r.amount)}</div>}
          </div>
        </div>
        <div className="flex flex-col gap-3 items-end">
          <div className="flex gap-1.5">
            {!isCompleted && <button onClick={() => onEdit(r)} className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center transition-all hover:text-blue-600 active:scale-90"><i className="fa-solid fa-pen text-[10px]"></i></button>}
            {!isEditingGlobal && (
              <button onClick={() => onDelete(r.id)} className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center transition-all hover:text-rose-500 active:scale-90"><i className="fa-solid fa-trash text-[10px]"></i></button>
            )}
          </div>
          {!isCompleted && (
            <button onClick={() => onMarkPaid(r.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 ${isOverdue || isToday ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 ring-1 ring-blue-50 dark:ring-blue-900/40'}`}>Mark Paid</button>
          )}
        </div>
      </div>
      {r.notes && <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800/50 text-[10px] text-slate-400 dark:text-slate-500 italic"><i className="fa-solid fa-note-sticky mr-1 opacity-50"></i>{r.notes}</div>}
    </Card>
  );
};

export default RemindersSection;
