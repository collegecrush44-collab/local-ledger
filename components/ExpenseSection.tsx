
import React, { useState } from 'react';
import { Card, Heading, Input, Button, SubHeading, ConfirmModal } from './Shared.tsx';
import { formatCurrency } from '../utils.ts';
import { Expense } from '../types.ts';

interface ExpenseProps {
  expenses: Expense[];
  customCategories: string[];
  onAdd: (expense: Omit<Expense, 'id'>) => void;
  onUpdate: (id: string, expense: Omit<Expense, 'id'>) => void;
  onDelete: (id: string) => void;
  onAddCustomCategory: (category: string) => void;
}

const ExpenseSection: React.FC<ExpenseProps> = ({ expenses, customCategories, onAdd, onUpdate, onDelete, onAddCustomCategory }) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Rent');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount && date && category) {
      const parsedAmount = parseFloat(amount);
      if (parsedAmount < 0) {
        alert("Amount cannot be negative.");
        return;
      }

      const payload = { 
        amount: parsedAmount, 
        date,
        category,
        notes: notes.trim() || undefined
      };
      if (editingId) {
        onUpdate(editingId, payload);
        setEditingId(null);
      } else {
        onAdd(payload);
        // Scroll to list after adding new entry
        setTimeout(() => {
          document.getElementById('expense-list-header')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      resetForm();
    }
  };

  const resetForm = () => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Rent');
    setNotes('');
    setEditingId(null);
    setShowAddCategory(false);
    setNewCategoryName('');
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCustomCategory(newCategoryName.trim());
      setCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const startEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setAmount(expense.amount.toString());
    setDate(expense.date);
    setCategory(expense.category);
    setNotes(expense.notes || '');
    // Smooth scroll to top of the scrollable main container
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const baseCategories = ['Rent', 'Utilities', 'Grocery', 'Transport', 'Insurance', 'Subscriptions', 'Other'];
  const allCategories = [...baseCategories, ...customCategories];

  const filteredExpenses = expenses.filter(e => 
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.amount.toString().includes(searchTerm) ||
    (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'Rent': return 'fa-house-chimney';
      case 'Utilities': return 'fa-plug-circle-bolt';
      case 'Grocery': return 'fa-cart-shopping';
      case 'Transport': return 'fa-car-side';
      case 'Insurance': return 'fa-shield-heart';
      case 'Subscriptions': return 'fa-clapperboard';
      default: return 'fa-receipt';
    }
  };

  return (
    <div className="space-y-6">
      <Heading>{editingId ? 'Edit Bill' : 'Fixed Bills & Expenses'}</Heading>
      
      <Card className={editingId ? 'border-blue-500 ring-2 ring-blue-50 dark:ring-blue-900/40 bg-blue-50/20 dark:bg-blue-900/10' : 'shadow-xl shadow-slate-200/50 dark:shadow-none'}>
        <div className="flex justify-between items-center mb-4">
          <SubHeading>{editingId ? 'Updating Expense' : 'Add Recurring Bill'}</SubHeading>
          {editingId && (
            <button onClick={resetForm} className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/30 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900/40 transition-colors">
              CANCEL
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all truncate ${category === cat ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                >
                  {cat}
                </button>
              ))}
              {!showAddCategory ? (
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="py-2 px-3 rounded-xl text-xs font-bold border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-plus text-[10px]"></i>
                  ADD NEW
                </button>
              ) : (
                <div className="col-span-2 flex gap-2 animate-in slide-in-from-left-2 duration-200">
                  <input 
                    autoFocus
                    placeholder="New category"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-950 border border-blue-500 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                  />
                  <button 
                    type="button" 
                    onClick={handleAddCategory}
                    className="px-3 bg-blue-600 text-white rounded-xl text-xs font-bold"
                  >
                    ADD
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddCategory(false)}
                    className="text-slate-400"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Amount</label>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Date</label>
              <Input
                type="date"
                value={date}
                max={todayStr}
                onChange={e => setDate(e.target.value)}
                className="appearance-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details about this expense..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm min-h-[80px]"
            />
          </div>
          <Button type="submit" className="w-full py-4 text-base font-black">
            {editingId ? 'Update Bill Details' : 'Save Recurring Bill'}
          </Button>
        </form>
      </Card>

      <div className="space-y-4" id="expense-list-header">
        <div className="flex justify-between items-end px-2">
          <Heading className="text-lg">Monthly List</Heading>
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800/40">
            Total {formatCurrency(total)}
          </div>
        </div>

        {/* Search Bar */}
        {expenses.length > 0 && (
          <div className="relative group px-1">
            <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-blue-500 transition-colors"></i>
            <input 
              type="text"
              placeholder="Search bills by category or amount..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-10 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 dark:hover:text-slate-100 transition-colors"
              >
                <i className="fa-solid fa-circle-xmark"></i>
              </button>
            )}
          </div>
        )}

        {expenses.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="fa-solid fa-receipt text-2xl text-slate-200 dark:text-slate-700"></i>
            </div>
            <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">No recurring bills added yet</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[10px]">
            <i className="fa-solid fa-face-meh mb-2 block text-2xl"></i>
            No matching bills found
          </div>
        ) : (
          <div className="space-y-3">
            {[...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
              <div 
                key={expense.id} 
                className={`flex flex-col bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-none border transition-all ${editingId === expense.id ? 'border-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-600">
                      <i className={`fa-solid ${getIcon(expense.category || '')}`}></i>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-base">{expense.category}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{formatCurrency(expense.amount)}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 font-bold uppercase tracking-tight flex items-center gap-1">
                          <i className="fa-regular fa-calendar-check"></i>
                          {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => startEdit(expense)}
                      className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all"
                      title="Edit"
                    >
                      <i className="fa-solid fa-pen-to-square text-sm"></i>
                    </button>
                    {!editingId && (
                      <button 
                        onClick={() => setDeleteId(expense.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    )}
                  </div>
                </div>
                {expense.notes && (
                  <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 italic">
                    <i className="fa-solid fa-note-sticky mr-1 opacity-50"></i>
                    {expense.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && onDelete(deleteId)}
        title="Remove Bill?"
        message="Are you sure you want to delete this fixed expense? This will increase your monthly savings."
      />
    </div>
  );
};

export default ExpenseSection;
