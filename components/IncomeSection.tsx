
import React, { useState } from 'react';
import { Card, Heading, Button, ConfirmModal, Input } from './Shared.tsx';
import { formatCurrency, validateAmount, validateString, isTodayOrPast } from '../utils.ts';
import { Income, IncomeCategory } from '../types.ts';

interface IncomeSectionProps {
  incomes: Income[];
  customCategories: string[];
  onAdd: (income: Omit<Income, 'id' | 'lastUpdated'>) => void;
  onUpdate: (id: string, income: Omit<Income, 'id' | 'lastUpdated'>) => void;
  onDelete: (id: string) => void;
  onAddCustomCategory: (category: string) => void;
}

const IncomeSection: React.FC<IncomeSectionProps> = ({ incomes, customCategories, onAdd, onUpdate, onDelete, onAddCustomCategory }) => {
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

  const [isSubmitted, setIsSubmitted] = useState(false);

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
    setIsSubmitted(false);
  };

  const amountValidation = validateAmount(amount);
  const dateValidation = isTodayOrPast(date);
  const categoryValidation = validateString(category);
  
  const isFormValid = amountValidation.isValid && dateValidation && categoryValidation.isValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    if (!isFormValid) return;

    const payload = {
      category: category.trim(),
      amount: parseFloat(amount),
      date,
      notes: notes.trim() || undefined
    };

    if (editingId) {
      onUpdate(editingId, payload);
    } else {
      onAdd(payload);
      setTimeout(() => {
        document.getElementById('income-list-header')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    resetForm();
    setShowForm(false);
  };

  const handleAddCategory = () => {
    const valid = validateString(newCategoryName);
    if (valid.isValid) {
      const exists = [...['Salary', 'Business', 'Freelance', 'Investment', 'Other'], ...customCategories]
        .some(c => c.toLowerCase() === newCategoryName.trim().toLowerCase());
      
      if (exists) {
        alert("Category already exists");
        return;
      }

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
    setIsSubmitted(false);
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
              <div className="flex flex-wrap gap-2">
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
                    NEW
                  </button>
                ) : (
                  <div className="w-full flex gap-2 animate-in slide-in-from-left-2 duration-200">
                    <input 
                      autoFocus
                      placeholder="Category name"
                      value={newCategoryName}
                      onChange={e => setNewCategoryName(e.target.value)}
                      className="flex-1 bg-white dark:bg-slate-950 border border-blue-500 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                    />
                    <Button 
                      onClick={handleAddCategory}
                      disabled={!validateString(newCategoryName).isValid}
                      className="!px-4 !py-2"
                    >
                      ADD
                    </Button>
                    <button type="button" onClick={() => setShowAddCategory(false)} className="text-slate-400"><i className="fa-solid fa-xmark"></i></button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                error={isSubmitted ? amountValidation.error : undefined}
                required
              />
              <Input
                label="Date"
                type="date"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
                error={isSubmitted && !dateValidation ? "Date cannot be in the future" : undefined}
                required
              />
            </div>

            <Input
              label="Notes (Optional)"
              type="textarea"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Source details..."
            />

            <Button type="submit" disabled={isSubmitted && !isFormValid} className="w-full py-4 text-base">
              {editingId ? 'Update Income' : 'Save Income'}
            </Button>
          </form>
        </Card>
      )}

      {/* Summary and List remain similar with validation applied */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 rounded-3xl text-white flex justify-between items-center shadow-xl">
        <div>
          <div className="text-blue-100 text-[10px] font-bold uppercase tracking-widest opacity-90 mb-1">Total Monthly Income</div>
          <div className="text-3xl font-bold tracking-tight">{formatCurrency(totalIncome)}</div>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-xl backdrop-blur-md border border-white/30">
          <i className="fa-solid fa-wallet"></i>
        </div>
      </div>

      {/* Income List... */}
      <div className="space-y-3" id="income-list-header">
        {filteredIncomes.map(income => (
           <div key={income.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400"><i className="fa-solid fa-coins"></i></div>
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">{income.category}</div>
                  <div className="text-[10px] font-bold text-slate-400">{income.date}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(income.amount)}</div>
                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => startEdit(income)} className="text-slate-400 hover:text-blue-500"><i className="fa-solid fa-pen text-xs"></i></button>
                   <button onClick={() => setDeleteId(income.id)} className="text-slate-400 hover:text-rose-500"><i className="fa-solid fa-trash text-xs"></i></button>
                </div>
              </div>
           </div>
        ))}
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && onDelete(deleteId)}
        title="Delete Income?"
        message="This record will be permanently removed from your dashboard."
      />
    </div>
  );
};

export default IncomeSection;
