import React, { useState } from 'react';
import { Card, Heading, Input, Button, SubHeading, ConfirmModal, CountUp } from './Shared.tsx';
import { formatCurrency } from '../utils.ts';
import { ChitFund, OtherSaving, ChitFundEntry, OtherSavingEntry } from '../types.ts';

interface ChitSavingsProps {
  chitFunds: ChitFund[];
  otherSavings: OtherSaving[];
  onAddChit: (chit: Omit<ChitFund, 'id' | 'entries'>) => void;
  onUpdateChit: (id: string, chit: Omit<ChitFund, 'id'>) => void;
  onDeleteChit: (id: string) => void;
  onAddChitEntry: (chitId: string, entry: Omit<ChitFundEntry, 'id'>) => void;
  onUpdateChitEntry: (chitId: string, entryId: string, entry: Omit<ChitFundEntry, 'id'>) => void;
  onDeleteChitEntry: (chitId: string, entryId: string) => void;
  onAddSaving: (saving: Omit<OtherSaving, 'id' | 'entries'>) => void;
  onUpdateSaving: (id: string, saving: Omit<OtherSaving, 'id'>) => void;
  onDeleteSaving: (id: string) => void;
  onAddSavingEntry: (savingId: string, entry: Omit<OtherSavingEntry, 'id'>) => void;
  onDeleteSavingEntry: (savingId: string, entryId: string) => void;
  onComplete: (title: string, message: string) => void;
}

const ChitSavingsSection: React.FC<ChitSavingsProps> = ({ 
  chitFunds, otherSavings, onAddChit, onUpdateChit, onDeleteChit, onAddChitEntry, onUpdateChitEntry, onDeleteChitEntry,
  onAddSaving, onUpdateSaving, onDeleteSaving, onAddSavingEntry, onDeleteSavingEntry,
  onComplete
}) => {
  const [activeTab, setActiveTab] = useState<'chits' | 'other'>('chits');
  const [expandedChitId, setExpandedChitId] = useState<string | null>(null);
  const [expandedSavingId, setExpandedSavingId] = useState<string | null>(null);
  const [animatingBucketId, setAnimatingBucketId] = useState<string | null>(null);

  const totalInBuckets = otherSavings.reduce((sum, s) => sum + s.entries.reduce((subSum, e) => subSum + e.amount, 0), 0);
  const totalChitInvestment = chitFunds.reduce((sum, c) => sum + c.entries.reduce((subSum, e) => subSum + e.amountPaid, 0), 0);
  const totalChitPayouts = chitFunds.reduce((sum, c) => sum + c.entries.reduce((subSum, e) => subSum + e.amountReceived, 0), 0);
  const netChitValue = totalChitPayouts - totalChitInvestment;

  return (
    <div className="space-y-6 pb-20 overflow-x-hidden">
      {/* Summary Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-6 flex justify-between items-center shadow-sm animate-slide-up">
        <div className="space-y-1">
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Net Savings</div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            <CountUp value={totalInBuckets + (totalChitPayouts > 0 ? netChitValue : 0)} prefix="₹" />
          </div>
        </div>
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 text-xl border border-blue-100 animate-pulse-subtle">
          <i className="fa-solid fa-sack-dollar"></i>
        </div>
      </div>

      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm mx-1 animate-slide-up delay-1">
        <button onClick={() => setActiveTab('chits')} className={`flex-1 py-3.5 rounded-[1.6rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'chits' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>Chit Funds</button>
        <button onClick={() => setActiveTab('other')} className={`flex-1 py-3.5 rounded-[1.6rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'other' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>Other Savings</button>
      </div>

      <div className="space-y-4 animate-slide-up delay-2">
        {activeTab === 'chits' ? (
          chitFunds.map((chit, idx) => (
            <Card key={chit.id} className="rounded-[2.5rem] p-6 border-none shadow-lg animate-slide-up delay-1">
               <div className="flex justify-between items-center mb-4">
                  <Heading className="text-lg">{chit.name}</Heading>
                  <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Live Chit
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4 mb-6">
                 <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                   <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Paid</div>
                   <div className="text-lg font-black text-blue-600"><CountUp value={chit.entries.reduce((s, e) => s + e.amountPaid, 0)} prefix="₹" /></div>
                 </div>
                 <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl">
                   <div className="text-[10px] font-black text-emerald-500 uppercase mb-1">Payout</div>
                   <div className="text-lg font-black text-emerald-600"><CountUp value={chit.entries.reduce((s, e) => s + e.amountReceived, 0)} prefix="₹" /></div>
                 </div>
               </div>
               <button 
                 onClick={() => setExpandedChitId(expandedChitId === chit.id ? null : chit.id)}
                 className="w-full py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all shadow-xl shadow-blue-500/20"
               >
                 {expandedChitId === chit.id ? 'Hide Timeline' : 'View Monthly Timeline'}
               </button>
            </Card>
          ))
        ) : (
          otherSavings.map((saving, idx) => (
            <Card key={saving.id} className={`rounded-[2.5rem] p-6 border-none shadow-lg transition-transform duration-300 ${animatingBucketId === saving.id ? 'scale-105' : 'scale-100'}`}>
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center animate-coin">
                        <i className={`fa-solid ${saving.type === 'Gold' ? 'fa-coins' : 'fa-piggy-bank'} text-xl`}></i>
                     </div>
                     <Heading className="text-lg">{saving.name}</Heading>
                  </div>
               </div>
               <div className="mb-6 bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl text-center border border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Bucket Total</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    <CountUp value={saving.entries.reduce((s, e) => s + e.amount, 0)} prefix="₹" />
                  </div>
               </div>
               <button 
                onClick={() => {
                  setAnimatingBucketId(saving.id);
                  setTimeout(() => setAnimatingBucketId(null), 500);
                  onAddSavingEntry(saving.id, { amount: 500, date: new Date().toISOString().split('T')[0] });
                }}
                className="w-full py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all shadow-xl shadow-emerald-500/20"
               >
                 Add ₹500 Quick Save
               </button>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ChitSavingsSection;