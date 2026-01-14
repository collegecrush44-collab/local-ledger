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
  onAddBorrowed: (entry: Omit<BorrowedMoney, 'id'>) => void;
  onUpdateBorrowed: (id: string, entry: Omit<BorrowedMoney, 'id'>) => void;
  onDeleteBorrowed: (id: string) => void;
  onCelebrate: (message: string) => void;
}

const LiabilitiesSection: React.FC<LiabilitiesProps> = ({
  loans, borrowed, 
  onAddLoan, onUpdateLoan, onDeleteLoan,
  onAddBorrowed, onUpdateBorrowed, onDeleteBorrowed,
  onCelebrate
}) => {
  const [activeTab, setActiveTab] = useState<'loans' | 'debts'>('loans');

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[2.5rem] border border-slate-50 dark:border-slate-800 shadow-sm relative z-10 mx-2">
        <button 
          onClick={() => setActiveTab('loans')}
          className={`flex-1 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'loans' ? 'bg-[#7c7cfc] text-white shadow-xl shadow-indigo-200/50 dark:shadow-none' : 'text-slate-300 dark:text-slate-600'}`}
        >
          Bank Loans
        </button>
        <button 
          onClick={() => setActiveTab('debts')}
          className={`flex-1 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'debts' ? 'bg-[#7c7cfc] text-white shadow-xl shadow-indigo-200/50 dark:shadow-none' : 'text-slate-300 dark:text-slate-600'}`}
        >
          Personal Debts
        </button>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
        {activeTab === 'loans' ? (
          <LoanSection loans={loans} onAdd={onAddLoan} onUpdate={onUpdateLoan} onDelete={onDeleteLoan} onCelebrate={onCelebrate} />
        ) : (
          <BorrowedSection borrowed={borrowed} onAdd={onAddBorrowed} onUpdate={onUpdateBorrowed} onDelete={onDeleteBorrowed} onCelebrate={onCelebrate} />
        )}
      </div>
    </div>
  );
};

export default LiabilitiesSection;