import React, { useState } from 'react';
import LoanSection from './LoanSection.tsx';
import BorrowedSection from './BorrowedSection.tsx';
import { Loan, BorrowedMoney } from '../types.ts';

interface LiabilitiesProps {
  loans: Loan[];
  borrowed: BorrowedMoney[];
  onAddLoan: (loan: Omit<Loan, 'id'>) => void;
  onUpdateLoan: (id: string, loan: Omit<Loan, 'id'>) => void;
  onDeleteLoan: (id: string) => void;
  onToggleLoanMonthPaid: (loanId: string, monthKey: string) => void;
  onAddBorrowed: (entry: Omit<BorrowedMoney, 'id'>) => void;
  onUpdateBorrowed: (id: string, entry: Omit<BorrowedMoney, 'id'>) => void;
  onDeleteBorrowed: (id: string) => void;
  onComplete: (title: string, message: string) => void;
}

const LiabilitiesSection: React.FC<LiabilitiesProps> = ({
  loans, borrowed, 
  onAddLoan, onUpdateLoan, onDeleteLoan, onToggleLoanMonthPaid,
  onAddBorrowed, onUpdateBorrowed, onDeleteBorrowed,
  onComplete
}) => {
  const [activeTab, setActiveTab] = useState<'loans' | 'debts'>('loans');

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative z-10">
        <button 
          onClick={() => setActiveTab('loans')}
          className={`flex-1 py-3.5 rounded-[1.6rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'loans' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 dark:text-slate-600'}`}
        >
          Bank Loans
        </button>
        <button 
          onClick={() => setActiveTab('debts')}
          className={`flex-1 py-3.5 rounded-[1.6rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'debts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 dark:text-slate-600'}`}
        >
          Personal Debts
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
        {activeTab === 'loans' ? (
          <LoanSection loans={loans} onAdd={onAddLoan} onUpdate={onUpdateLoan} onDelete={onDeleteLoan} onComplete={onComplete} onToggleMonthPaid={onToggleLoanMonthPaid} />
        ) : (
          <BorrowedSection borrowed={borrowed} onAdd={onAddBorrowed} onUpdate={onUpdateBorrowed} onDelete={onDeleteBorrowed} onComplete={onComplete} />
        )}
      </div>
    </div>
  );
};

export default LiabilitiesSection;