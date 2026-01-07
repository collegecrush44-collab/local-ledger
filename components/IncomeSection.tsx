import React, { useState } from 'react';
import { Card, Heading, Button, ConfirmModal } from './Shared.tsx';
import { formatCurrency } from '../utils.ts';
import { Income, IncomeCategory } from '../types.ts';

interface IncomeSectionProps {
  incomes: Income[];
  selectedMonth: string;
  customCategories: string[];
  onAdd: (income: Omit<Income, 'id' | 'lastUpdated'>) => void;
  onUpdate: (id: string, income: Omit<Income, 'id' | 'lastUpdated'>) => void;
  onDelete: (id: string) => void;
  onAddCustomCategory: (category: string) => void;
}

const IncomeSection: React.FC<IncomeSectionProps> = ({ incomes, selectedMonth, customCategories, onAdd, onUpdate, onDelete, onAddCustomCategory }) => {
  const [showForm, setShowForm] = useState(incomes.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [category, setCategory] = useState<IncomeCategory>('Salary');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const resetForm = () => {
    setCategory('Salary');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setEditingId(null);
    setShowForm(incomes.length === 0);
    setShowAddCategory(false);
    setNewCategoryName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    
    if (parsedAmount < 0) {
      alert("Amount cannot be negative.");
      return;
    }

    const payload = {
      category,
      amount: parsedAmount || 0,
      date,
      notes: notes.trim() || undefined
    };

    if (editingId) {
      onUpdate(editingId, payload);
    } else {
      onAdd(payload);
    }
    resetForm();
    setShowForm(false);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      onAddCustomCategory(newCategoryName.trim());
      setCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  const startEdit = (income: Income) => {
    setEditingId(income.id);
    setCategory(income.category);
    setAmount(income.amount.toString());
    setDate(income.date);
    setNotes(income.notes || '');
    setShowForm(true);
    // Auto-scroll the main scroll container
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const baseCategories: string[] = ['Salary', 'Business', 'Freelance', 'Investment', 'Other'];
  const allCategories = [...baseCategories, ...customCategories];

  const filteredIncomes = incomes.filter(i => 
    i.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.amount.toString().includes(searchTerm) ||
    (i.notes && i.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Heading>Income Management</Heading>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1 border border-blue-100 dark:border-blue-800/40"
          >
            <i className="fa-solid fa-plus"></i>
            ADD INCOME
          </button>
        )}
      </div>

      {showForm && (
        <Card className="shadow-xl shadow-slate-200/50 dark:shadow-none border-blue-100 dark:border-blue-900/40 ring-2 ring-blue-50 dark:ring-blue-900/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-700 dark:text-slate-200">{editingId ? 'Edit Income' : 'Add New Income'}</h3>
            {(incomes.length > 0 || editingId) && (
              <button onClick={resetForm} className="text-xs font-bold text-slate-400 hover:text-rose-500 uppercase">
                Cancel
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Income Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all truncate ${category === cat ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                  >
                    {cat}
                  </button>
                ))}
                {!showAddCategory ? (
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(true)}
                    className="py-2 px-3 rounded-xl text-xs font-bold border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <i className="fa-solid fa-plus text-[10px]"></i>
                    OTHER
                  </button>
                ) : (
                  <div className="col-span-2 flex gap-2 animate-in slide-in-from-left-2 duration-200">
                    <input 
                      autoFocus
                      placeholder="Category name"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xl font-black"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Date</label>
                <input
                  type="date"
                  value={date}
                  max={todayStr}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold appearance-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Details about this income..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm min-h-[80px]"
              />
            </div>

            <Button type="submit" className="w-full py-4 text-lg">
              {editingId ? 'Update Income Details' : 'Save Income Source'}
            </Button>
          </form>
        </Card>
      )}

      {/* Summary Widget */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-200 dark:shadow-none text-white flex justify-between items-center relative overflow-hidden ring-4 ring-blue-50 dark:ring-blue-900/10 transition-all">
        <div className="z-10">
          <div className="text-blue-100 text-[10px] font-bold uppercase tracking-widest opacity-90 mb-1">Total Monthly Income</div>
          <div className="text-3xl font-bold tracking-tight">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl backdrop-blur-md border border-white/30 z-10">
          <i className="fa-solid fa-wallet"></i>
        </div>
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      {/* Search Bar */}
      {incomes.length > 0 && (
        <div className="relative group px-1">
          <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-blue-500 transition-colors"></i>
          <input 
            type="text"
            placeholder="Search by category or amount..."
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

      {/* Income List */}
      <div className="space-y-3">
        {incomes.length === 0 ? (
          !showForm && (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
              <i className="fa-solid fa-money-bill-transfer text-3xl text-slate-200 dark:text-slate-800 mb-2"></i>
              <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">No income sources added yet</p>
            </div>
          )
        ) : filteredIncomes.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[10px]">
            <i className="fa-solid fa-face-meh mb-2 block text-2xl"></i>
            No results found for "{searchTerm}"
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {[...filteredIncomes].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(income => (
              <div 
                key={income.id}
                className={`group bg-white dark:bg-slate-900 px-5 py-4 rounded-3xl border transition-all ${editingId === income.id ? 'border-blue-500 ring-4 ring-blue-50 dark:ring-blue-900/20 shadow-md' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors border border-slate-100 dark:border-slate-800">
                      <i className={`fa-solid ${income.category === 'Salary' ? 'fa-building-columns' : income.category === 'Business' ? 'fa-shop' : income.category === 'Freelance' ? 'fa-laptop-code' : income.category === 'Investment' ? 'fa-chart-line' : 'fa-coins'} text-lg`}></i>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-base">{income.category}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        {new Date(income.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-none">{formatCurrency(income.amount)}</div>
                    <div className="flex gap-3 justify-end mt-2 opacity-30 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEdit(income)} 
                        className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen-to-square text-sm"></i>
                      </button>
                      {editingId !== income.id && (
                        <button 
                          onClick={() => setDeleteId(income.id)} 
                          className="text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors" 
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {income.notes && (
                  <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 italic">
                    <i className="fa-solid fa-note-sticky mr-1 opacity-50"></i>
                    {income.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex gap-4 text-slate-500 dark:text-slate-400 text-sm leading-snug transition-colors">
        <i className="fa-solid fa-circle-info text-blue-400 mt-1 flex-shrink-0"></i>
        <span>Add all regular and side income here. Your "Savings" in the dashboard is what's left after all bills are paid.</span>
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && onDelete(deleteId)}
        title="Delete Income?"
        message="Are you sure you want to remove this income record? This will adjust your monthly budget."
      />
    </div>
  );
};

export default IncomeSection;