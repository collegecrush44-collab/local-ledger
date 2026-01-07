import React, { useState, useEffect } from 'react';
import { Card, Heading, Input, Button, SubHeading, ConfirmModal } from './Shared.tsx';
import { formatCurrency, getLoanStatus, triggerHaptic } from '../utils.ts';
import { Loan } from '../types.ts';

const LoanSection: React.FC<{
  loans: Loan[];
  onAdd: (loan: Omit<Loan, 'id'>) => void;
  onUpdate: (id: string, loan: Omit<Loan, 'id'>) => void;
  onDelete: (id: string) => void;
  onComplete: (title: string, message: string) => void;
  onToggleMonthPaid: (loanId: string, monthKey: string) => void;
}> = ({ loans, onAdd, onUpdate, onDelete, onComplete, onToggleMonthPaid }) => {
  const [name, setName] = useState('');
  const [total, setTotal] = useState('');
  const [emi, setEmi] = useState('');
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const currentMonthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  // Auto-calculate End Date when Total, EMI, or Start Date changes
  useEffect(() => {
    if (total && emi && start) {
      const totalAmt = parseFloat(total);
      const emiAmt = parseFloat(emi);
      if (emiAmt > 0 && totalAmt > 0) {
        const months = Math.ceil(totalAmt / emiAmt);
        const startDate = new Date(start);
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + months, startDate.getDate());
        setEnd(endDate.toISOString().slice(0, 10));
      }
    }
  }, [total, emi, start]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && total && emi && start && end) {
      const parsedTotal = parseFloat(total);
      const parsedEmi = parseFloat(emi);

      if (parsedTotal < 0 || parsedEmi < 0) {
        alert("Amounts cannot be negative.");
        return;
      }

      const payload = {
        name,
        totalAmount: parsedTotal,
        emi: parsedEmi,
        startDate: start,
        endDate: end,
        notes: notes.trim() || undefined,
        paidMonths: editingId ? (loans.find(l => l.id === editingId)?.paidMonths || []) : []
      };
      if (editingId) {
        onUpdate(editingId, payload);
        setEditingId(null);
      } else {
        onAdd(payload);
      }
      resetForm();
    }
  };

  const resetForm = () => {
    setName(''); setTotal(''); setEmi(''); setStart(new Date().toISOString().slice(0, 10)); setEnd('');
    setNotes('');
    setEditingId(null);
  };

  const startEdit = (loan: Loan) => {
    setEditingId(loan.id);
    setName(loan.name);
    setTotal(loan.totalAmount.toString());
    setEmi(loan.emi.toString());
    setStart(loan.startDate);
    setEnd(loan.endDate);
    setNotes(loan.notes || '');
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMonthPaid = (loan: Loan) => {
    const isPaid = loan.paidMonths.includes(currentMonthKey);
    
    if (!isPaid) {
      triggerHaptic('success');
      // Check for completion
      const totalMonthsCount = Math.ceil(loan.totalAmount / loan.emi);
      const currentPaidCount = loan.paidMonths.length + 1;
      if (currentPaidCount >= totalMonthsCount) {
        onComplete("Loan Accomplished!", `You've officially cleared your loan for ${loan.name}. One less weight on your shoulders!`);
      }
    }

    onToggleMonthPaid(loan.id, currentMonthKey);
  };

  const totalEMI = loans.reduce((sum, l) => sum + l.emi, 0);

  const filteredLoans = loans.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.totalAmount.toString().includes(searchTerm) ||
    l.emi.toString().includes(searchTerm) ||
    (l.notes && l.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <Heading>{editingId ? 'Edit Loan' : 'Loan & EMI Tracker'}</Heading>
      
      <Card className={`rounded-[2.5rem] p-8 border-none shadow-sm dark:shadow-none bg-white dark:bg-slate-900 ${editingId ? 'ring-2 ring-blue-500/20' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <SubHeading className="text-[11px] font-black text-slate-400 dark:text-slate-600 tracking-widest uppercase">
            {editingId ? 'EDIT ACTIVE LOAN' : 'ADD ACTIVE LOAN'}
          </SubHeading>
          {editingId && (
            <button onClick={resetForm} className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
              Cancel
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
             <Input 
               placeholder="What is this loan for? (e.g. Bike)" 
               value={name} 
               onChange={e => setName(e.target.value)} 
               className="text-base"
             />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase ml-1 mb-2 block tracking-widest">Total Amount</label>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={total}
                onChange={e => setTotal(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase ml-1 mb-2 block tracking-widest">Monthly EMI</label>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder="0"
                value={emi}
                onChange={e => setEmi(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase ml-1 mb-2 block tracking-widest">Start Date</label>
              <Input 
                type="date" 
                value={start} 
                onChange={e => setStart(e.target.value)} 
                className="appearance-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase ml-1 mb-2 block tracking-widest">End Date (Auto)</label>
              <Input 
                type="date" 
                readOnly
                value={end} 
                className="bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-700 cursor-not-allowed opacity-60" 
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase ml-1 mb-2 block tracking-widest">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bank details, account number, or other info..."
              className="w-full bg-slate-100 dark:bg-slate-800/60 border-none rounded-[1.25rem] px-5 py-4 text-slate-900 dark:text-slate-100 font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-sm min-h-[80px]"
            />
          </div>
          <Button type="submit" variant="primary" className="w-full py-5 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-500/20">
            {editingId ? 'Update Loan' : 'Start Tracking'}
          </Button>
        </form>
      </Card>

      <div className="space-y-4 pt-4">
        <div className="flex justify-between items-center px-2">
          <Heading className="text-xl">Active Installments</Heading>
          <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-2xl uppercase tracking-wider shadow-sm border border-indigo-100 dark:border-indigo-800/40">
            EMI: {formatCurrency(totalEMI)}/mo
          </div>
        </div>

        {/* Search Bar */}
        {loans.length > 0 && (
          <div className="relative group px-1">
            <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-sm group-focus-within:text-indigo-500 transition-colors"></i>
            <input 
              type="text"
              placeholder="Search loans..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl pl-12 pr-10 py-3.5 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
          </div>
        )}

        {loans.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
            <i className="fa-solid fa-landmark text-4xl text-slate-100 dark:text-slate-800 mb-2"></i>
            <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">No active loans found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLoans.map(loan => {
              const status = getLoanStatus(loan);
              const isEditing = editingId === loan.id;
              
              return (
                <Card key={loan.id} className={`relative overflow-hidden group transition-all border-none shadow-lg dark:shadow-none rounded-[2.5rem] p-6 ${isEditing ? 'ring-4 ring-indigo-500/20' : ''}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="font-black text-slate-800 dark:text-slate-100 text-xl leading-tight">{loan.name}</h4>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400 font-bold mt-1">EMI: {formatCurrency(loan.emi)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(loan)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                      {editingId !== loan.id && (
                        <button onClick={() => setDeleteId(loan.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"><i className="fa-solid fa-trash-can text-xs"></i></button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100/50 dark:border-slate-700/50">
                      <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Balance</div>
                      <div className="text-lg font-black text-slate-800 dark:text-slate-100">{formatCurrency(status.remainingAmount)}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-100/50 dark:border-slate-700/50">
                      <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest">Tenure Left</div>
                      <div className="text-lg font-black text-slate-800 dark:text-slate-100">{status.remainingMonths} Mo</div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <span>Progress</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{Math.round(status.progress)}% Paid</span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/30 dark:border-slate-700/30">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(99,102,241,0.4)] dark:shadow-none" 
                        style={{ width: `${status.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${status.isCurrentMonthPaid ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-700 border border-slate-200 dark:border-slate-700'}`}>
                        <i className={`fa-solid ${status.isCurrentMonthPaid ? 'fa-check' : 'fa-clock'} text-xs`}></i>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
                          Current Month ({new Date().toLocaleString('default', { month: 'short' })})
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">
                          Past months auto-calculated
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleMonthPaid(loan)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${status.isCurrentMonthPaid ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60' : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60 shadow-sm active:scale-95'}`}
                    >
                      {status.isCurrentMonthPaid ? 'PAID' : 'MARK PAID'}
                    </button>
                  </div>

                  {loan.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 italic">
                      <i className="fa-solid fa-note-sticky mr-1 opacity-50"></i>
                      {loan.notes}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && onDelete(deleteId)}
        title="Delete Loan Record?"
        message="Are you sure you want to remove this loan? This action is permanent."
      />
    </div>
  );
};

export default LoanSection;