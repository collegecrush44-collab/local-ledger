
import React, { useState } from 'react';
import { Card, Heading, Input, Button, SubHeading, ConfirmModal } from './Shared.tsx';
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
}

const ChitSavingsSection: React.FC<ChitSavingsProps> = ({ 
  chitFunds, otherSavings, onAddChit, onUpdateChit, onDeleteChit, onAddChitEntry, onUpdateChitEntry, onDeleteChitEntry,
  onAddSaving, onUpdateSaving, onDeleteSaving, onAddSavingEntry, onDeleteSavingEntry 
}) => {
  const [activeTab, setActiveTab] = useState<'chits' | 'other'>('chits');
  const [showChitForm, setShowChitForm] = useState(false);
  const [showSavingForm, setShowSavingForm] = useState(false);
  const [expandedChitId, setExpandedChitId] = useState<string | null>(null);
  const [expandedSavingId, setExpandedSavingId] = useState<string | null>(null);
  
  // Chit Form State
  const [chitName, setChitName] = useState('');
  const [chitTotal, setChitTotal] = useState('');
  const [chitMonthly, setChitMonthly] = useState('');
  const [chitDuration, setChitDuration] = useState('');
  const [chitStart, setChitStart] = useState(new Date().toISOString().split('T')[0]);
  const [chitDay, setChitDay] = useState('1');
  const [editingChitId, setEditingChitId] = useState<string | null>(null);
  const [chitError, setChitError] = useState<string | null>(null);

  // Saving Form State
  const [savingName, setSavingName] = useState('');
  const [savingType, setSavingType] = useState<any>('Piggy bank');
  const [editingSavingId, setEditingSavingId] = useState<string | null>(null);

  // Chit Entry State
  const [showEntryForm, setShowEntryForm] = useState<{chitId: string, monthLabel: string, date: string} | null>(null);
  const [entryIsTaken, setEntryIsTaken] = useState(false);
  const [entryTakenBy, setEntryTakenBy] = useState('');
  const [entryPaid, setEntryPaid] = useState('');
  const [entryReceived, setEntryReceived] = useState('');
  const [entryWinningBid, setEntryWinningBid] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Saving Entry State
  const [showSavingEntryForm, setShowSavingEntryForm] = useState<string | null>(null);
  const [sEntryAmount, setSEntryAmount] = useState('');
  const [sEntryDate, setSEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [sEntryNotes, setSEntryNotes] = useState('');

  const [deleteChitId, setDeleteChitId] = useState<string | null>(null);
  const [deleteSavingId, setDeleteSavingId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const resetChitForm = () => {
    setChitName(''); setChitTotal(''); setChitMonthly(''); setChitDuration(''); setChitDay('1');
    setChitStart(new Date().toISOString().split('T')[0]); setEditingChitId(null); setShowChitForm(false);
    setChitError(null);
  };

  const handleChitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setChitError(null);
    const totalVal = parseFloat(chitTotal) || 0;
    const monthlyVal = parseFloat(chitMonthly) || 0;

    if (totalVal <= 0) {
      setChitError("Maturity Goal must be greater than zero.");
      return;
    }

    if (monthlyVal > totalVal) {
      setChitError(`Monthly EMI (${formatCurrency(monthlyVal)}) cannot exceed the Maturity Goal (${formatCurrency(totalVal)}).`);
      return;
    }

    const payload = {
      name: chitName,
      totalChitAmount: totalVal,
      monthlyContribution: monthlyVal,
      totalMonths: parseInt(chitDuration) || 1,
      startDate: chitStart,
      chitDay: parseInt(chitDay) || 1
    };
    if (editingChitId) {
      const existing = chitFunds.find(c => c.id === editingChitId);
      onUpdateChit(editingChitId, { ...payload, entries: existing?.entries || [] });
    } else {
      onAddChit(payload);
      setTimeout(() => {
        document.getElementById('chits-list-header')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    resetChitForm();
  };

  const resetEntryForm = () => {
    setEntryIsTaken(false); setEntryTakenBy('');
    setEntryPaid(''); setEntryReceived(''); setEntryWinningBid('');
    setShowEntryForm(null); setEditingEntryId(null);
    setEntryError(null);
  };

  const handleEntrySubmit = () => {
    if (!showEntryForm) return;
    setEntryError(null);
    const { chitId, date } = showEntryForm;
    const winningBid = parseFloat(entryWinningBid) || 0;
    const paid = parseFloat(entryPaid) || 0;
    
    const chit = chitFunds.find(c => c.id === chitId);
    if (chit && paid > chit.totalChitAmount) {
      setEntryError(`Monthly paid amount cannot exceed total chit value (${formatCurrency(chit.totalChitAmount)}).`);
      return;
    }

    const payload = {
      date: date,
      isTaken: entryIsTaken,
      takenBy: entryTakenBy || undefined,
      amountPaid: paid,
      amountReceived: entryIsTaken ? (parseFloat(entryReceived) || winningBid) : 0,
      winningBid: winningBid
    };
    if (editingEntryId) {
      onUpdateChitEntry(chitId, editingEntryId, payload);
    } else {
      onAddChitEntry(chitId, payload);
    }
    resetEntryForm();
  };

  const handleSavingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: savingName, type: savingType };
    if (editingSavingId) {
      const existing = otherSavings.find(s => s.id === editingSavingId);
      onUpdateSaving(editingSavingId, { ...payload, entries: existing?.entries || [] });
    } else {
      onAddSaving(payload);
      setTimeout(() => {
        document.getElementById('savings-list-header')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    setSavingName(''); setEditingSavingId(null); setShowSavingForm(false);
  };

  const handleSavingEntrySubmit = (savingId: string) => {
    onAddSavingEntry(savingId, { amount: parseFloat(sEntryAmount), date: sEntryDate, notes: sEntryNotes || undefined });
    setSEntryAmount(''); setSEntryNotes(''); setShowSavingEntryForm(null);
  };

  const generateChitSchedule = (chit: ChitFund) => {
    const schedule = [];
    const startDate = new Date(chit.startDate);
    const today = new Date();
    const currentMonthKey = today.toISOString().slice(0, 7);

    for (let i = 0; i < chit.totalMonths; i++) {
      const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, chit.chitDay);
      const monthKey = monthDate.toISOString().slice(0, 7);
      const isPast = monthDate < today && monthKey !== currentMonthKey;
      const isCurrent = monthKey === currentMonthKey;
      const isFuture = monthDate > today && monthKey !== currentMonthKey;

      const entry = chit.entries.find(e => e.date.slice(0, 7) === monthKey);
      
      schedule.push({
        monthNumber: i + 1,
        date: monthDate.toISOString().slice(0, 10),
        monthLabel: monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        status: isCurrent ? 'current' : isPast ? 'past' : 'future',
        entry
      });
    }
    return schedule;
  };

  const startEditChit = (chit: ChitFund) => {
    setEditingChitId(chit.id);
    setChitName(chit.name);
    setChitTotal(chit.totalChitAmount.toString());
    setChitMonthly(chit.monthlyContribution.toString());
    setChitDuration(chit.totalMonths.toString());
    setChitDay(chit.chitDay.toString());
    setChitStart(chit.startDate);
    setShowChitForm(true);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEditSaving = (saving: OtherSaving) => {
    setEditingSavingId(saving.id);
    setSavingName(saving.name);
    setSavingType(saving.type);
    setShowSavingForm(true);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalInBuckets = otherSavings.reduce((sum, s) => sum + s.entries.reduce((subSum, e) => subSum + e.amount, 0), 0);
  const totalChitInvestment = chitFunds.reduce((sum, c) => sum + c.entries.reduce((subSum, e) => subSum + e.amountPaid, 0), 0);
  const totalChitPayouts = chitFunds.reduce((sum, c) => sum + c.entries.reduce((subSum, e) => subSum + e.amountReceived, 0), 0);
  const netChitValue = totalChitPayouts - totalChitInvestment;

  return (
    <div className="space-y-6 pb-20 overflow-x-hidden">
      {/* Summary Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-6 flex justify-between items-center shadow-sm">
        <div className="space-y-1">
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Net Savings</div>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            {formatCurrency(totalInBuckets + (totalChitPayouts > 0 ? netChitValue : 0))}
          </div>
          <div className="text-[9px] font-bold text-slate-400 flex gap-2">
            <span>Buckets: {formatCurrency(totalInBuckets)}</span>
            <span>•</span>
            <span>Chit Net: {formatCurrency(netChitValue)}</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl border border-blue-100 dark:border-blue-800">
          <i className="fa-solid fa-sack-dollar"></i>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm mx-1">
        <button 
          onClick={() => setActiveTab('chits')}
          className={`flex-1 py-3.5 rounded-[1.6rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'chits' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 dark:text-slate-600'}`}
        >
          Chit Funds
        </button>
        <button 
          onClick={() => setActiveTab('other')}
          className={`flex-1 py-3.5 rounded-[1.6rem] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'other' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 dark:text-slate-600'}`}
        >
          Other Savings
        </button>
      </div>

      {activeTab === 'chits' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <Heading className="dark:text-white">Active Chits</Heading>
            {!showChitForm && (
              <button 
                onClick={() => setShowChitForm(true)}
                className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            )}
          </div>

          {showChitForm && (
            <Card className="animate-in slide-in-from-top-4 duration-300 rounded-[2.5rem] border-blue-100 dark:border-blue-900">
              <form onSubmit={handleChitSubmit} className="space-y-5">
                <SubHeading className="mb-2 text-center">{editingChitId ? 'Update Chit Fund' : 'New Chit Fund'}</SubHeading>
                
                <div className="space-y-1">
                  <Input placeholder="Chit Fund Name" value={chitName} onChange={e => setChitName(e.target.value)} required />
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase ml-2 tracking-tight">A unique name for this chit group</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Input type="number" placeholder="Total Amount" value={chitTotal} onChange={e => setChitTotal(e.target.value)} required />
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase ml-2 tracking-tight">Maturity goal</p>
                  </div>
                  <div className="space-y-1">
                    <Input type="number" placeholder="Monthly EMI" value={chitMonthly} onChange={e => setChitMonthly(e.target.value)} required />
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase ml-2 tracking-tight">Fixed contribution</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Input type="number" placeholder="Duration (Months)" value={chitDuration} onChange={e => setChitDuration(e.target.value)} />
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase ml-2 tracking-tight">Total months (optional)</p>
                  </div>
                  <div className="space-y-1">
                    <Input 
                      type="number" 
                      placeholder="Auction Day (1-31)" 
                      value={chitDay} 
                      min="1"
                      max="31"
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        if (isNaN(val)) setChitDay('');
                        else if (val > 31) setChitDay('31');
                        else if (val < 1) setChitDay('1');
                        else setChitDay(e.target.value);
                      }} 
                    />
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase ml-2 tracking-tight">Monthly date (optional)</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Input type="date" value={chitStart} onChange={e => setChitStart(e.target.value)} required />
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase ml-2 tracking-tight">First collection date</p>
                </div>

                {chitError && (
                  <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 p-4 rounded-2xl flex gap-3 animate-in slide-in-from-left-2 duration-300">
                    <i className="fa-solid fa-circle-exclamation text-rose-500 mt-0.5"></i>
                    <p className="text-xs font-bold text-rose-600 dark:text-rose-400 leading-tight">{chitError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" className="flex-1 py-4" onClick={resetChitForm}>Cancel</Button>
                  <Button type="submit" className="flex-[2] py-4 uppercase tracking-widest text-xs">Save Chit Fund</Button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-4" id="chits-list-header">
            {chitFunds.length === 0 ? (
              <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-sack-dollar text-2xl text-slate-200 dark:text-slate-700"></i>
                </div>
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-1 uppercase tracking-tight">No chit funds tracked</h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs px-12 leading-relaxed">Add your group savings and monthly auctions to see your investment grow here.</p>
              </div>
            ) : (
              chitFunds.map(chit => {
                const totalPaid = chit.entries.reduce((sum, e) => sum + e.amountPaid, 0);
                const totalReceived = chit.entries.reduce((sum, e) => sum + e.amountReceived, 0);
                const isExpanded = expandedChitId === chit.id;
                const schedule = generateChitSchedule(chit);
                
                return (
                  <Card key={chit.id} className="rounded-[2.5rem] overflow-hidden p-6 border-none shadow-lg dark:shadow-none bg-white dark:bg-slate-900">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-black text-xl text-slate-800 dark:text-slate-100 leading-tight">{chit.name}</h4>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">
                          Started: {new Date(chit.startDate).toLocaleDateString()} • Goal: {formatCurrency(chit.totalChitAmount)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => startEditChit(chit)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-blue-600 transition-all flex items-center justify-center"><i className="fa-solid fa-pen text-[10px]"></i></button>
                         {!editingChitId && (
                           <button onClick={() => setDeleteChitId(chit.id)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center"><i className="fa-solid fa-trash text-[10px]"></i></button>
                         )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                       <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-700/50">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Paid</div>
                          <div className="text-lg font-black text-blue-600">{formatCurrency(totalPaid)}</div>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-700/50 text-right">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Payout</div>
                          <div className="text-lg font-black text-emerald-600">{formatCurrency(totalReceived)}</div>
                       </div>
                    </div>

                    <div className="flex justify-between items-center mb-6 px-1">
                       <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                          Progress: <span className="text-blue-600">{chit.entries.length}</span> / {chit.totalMonths} Mo
                       </div>
                       <div className={`text-[11px] font-black uppercase px-2 py-0.5 rounded-lg ${totalReceived > totalPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                          PROFIT: {formatCurrency(Math.abs(totalReceived - totalPaid))}
                       </div>
                    </div>

                    <div className="space-y-3">
                      <button 
                        onClick={() => setExpandedChitId(isExpanded ? null : chit.id)}
                        className={`w-full py-4 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl ${isExpanded ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 shadow-none' : 'bg-blue-600 text-white shadow-blue-500/20'}`}
                      >
                        {isExpanded ? 'CLOSE SCHEDULE' : 'MANAGE MONTHLY PAYMENTS'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Timeline</div>
                        <div className="grid grid-cols-1 gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                          {schedule.map(item => (
                            <div 
                              key={item.monthNumber} 
                              onClick={() => {
                                if (item.status === 'future') return;

                                setShowEntryForm({ chitId: chit.id, monthLabel: item.monthLabel, date: item.date });
                                if (item.entry) {
                                  setEditingEntryId(item.entry.id);
                                  setEntryIsTaken(item.entry.isTaken);
                                  setEntryTakenBy(item.entry.takenBy || '');
                                  setEntryPaid(item.entry.amountPaid.toString());
                                  setEntryReceived(item.entry.amountReceived.toString());
                                  setEntryWinningBid(item.entry.winningBid?.toString() || '');
                                } else {
                                  setEntryPaid(chit.monthlyContribution.toString());
                                  setEntryWinningBid('');
                                }
                              }}
                              className={`flex items-center justify-between p-4 rounded-3xl border transition-all ${item.status === 'future' ? 'opacity-40 bg-slate-50/30 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50 cursor-default' : 'cursor-pointer active:scale-95'} ${item.status === 'current' ? 'border-blue-500 bg-white ring-2 ring-blue-500/10' : item.entry ? 'border-emerald-100 bg-emerald-50/5 dark:bg-emerald-900/10' : 'border-slate-100 dark:border-slate-800'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black ${item.entry ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : item.status === 'current' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                                  {item.monthNumber}
                                </div>
                                <div>
                                   <div className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{item.monthLabel}</div>
                                   <div className="text-[9px] font-bold text-slate-400 mt-0.5 flex items-center gap-2">
                                      {item.status === 'current' ? (
                                        <span className="text-blue-600 font-black tracking-widest">• CURRENT MONTH</span>
                                      ) : item.status === 'future' ? (
                                        <span className="uppercase tracking-widest opacity-60">UPCOMING</span>
                                      ) : null}
                                      {item.entry && (
                                        <>
                                          <span className="text-emerald-500 font-black">PAID: {formatCurrency(item.entry.amountPaid)}</span>
                                          {item.entry.isTaken && <span className="text-indigo-600 font-black bg-indigo-50 dark:bg-indigo-900/40 px-1 rounded">TAKEN <i className="fa-solid fa-circle-check"></i></span>}
                                        </>
                                      )}
                                   </div>
                                </div>
                              </div>
                              {item.status !== 'future' && (
                                <i className={`fa-solid ${item.entry ? 'fa-circle-check text-emerald-500' : 'fa-circle-plus text-slate-300'} text-lg`}></i>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'other' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <Heading className="dark:text-white">Your Savings</Heading>
            {!showSavingForm && (
              <button 
                onClick={() => setShowSavingForm(true)}
                className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
              >
                <i className="fa-solid fa-plus"></i>
              </button>
            )}
          </div>

          {showSavingForm && (
            <Card className="animate-in slide-in-from-top-4 duration-300 rounded-[2.5rem] border-blue-100 dark:border-blue-900">
              <form onSubmit={handleSavingSubmit} className="space-y-4">
                <SubHeading>{editingSavingId ? 'Update Saving' : 'New Saving Goal/Bucket'}</SubHeading>
                <Input placeholder="Saving Name (e.g. Gold Fund)" value={savingName} onChange={e => setSavingName(e.target.value)} required />
                <select 
                   value={savingType} 
                   onChange={e => setSavingType(e.target.value)} 
                   className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold"
                >
                  <option>Piggy bank</option>
                  <option>Daily</option>
                  <option>Monthly</option>
                  <option>Gold</option>
                  <option>Informal</option>
                  <option>Other</option>
                </select>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1" onClick={() => setShowSavingForm(false)}>Cancel</Button>
                  <Button type="submit" className="flex-[2]">Add Bucket</Button>
                </div>
              </form>
            </Card>
          )}

          <div className="space-y-4" id="savings-list-header">
            {otherSavings.length === 0 ? (
              <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fa-solid fa-sack-dollar text-2xl text-slate-200 dark:text-slate-700"></i>
                </div>
                <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm mb-1 uppercase tracking-tight">Start saving today!</h4>
                <p className="text-slate-400 dark:text-slate-500 text-xs px-12 leading-relaxed">Create buckets for your goals—emergency funds, travel, or big purchases. Watch your money grow month by month.</p>
              </div>
            ) : (
              otherSavings.map(saving => {
                const totalAmount = saving.entries.reduce((sum, e) => sum + e.amount, 0);
                const isExpanded = expandedSavingId === saving.id;

                return (
                  <Card key={saving.id} className="rounded-[2.5rem] border-none shadow-lg dark:shadow-none p-6 overflow-hidden bg-white dark:bg-slate-900">
                    <div className="flex justify-between items-center mb-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-2xl flex items-center justify-center">
                             <i className={`fa-solid ${saving.type === 'Gold' ? 'fa-coins' : 'fa-sack-dollar'} text-xl`}></i>
                          </div>
                          <div>
                            <h4 className="font-black text-lg text-slate-800 dark:text-slate-100 leading-tight">{saving.name}</h4>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{saving.type}</span>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => startEditSaving(saving)} className="w-8 h-8 rounded-lg text-slate-300 hover:text-blue-600 transition-all flex items-center justify-center"><i className="fa-solid fa-pen text-[10px]"></i></button>
                          {!editingSavingId && (
                            <button onClick={() => setDeleteSavingId(saving.id)} className="w-8 h-8 rounded-lg text-slate-300 hover:text-rose-500 transition-all flex items-center justify-center"><i className="fa-solid fa-trash text-[10px]"></i></button>
                          )}
                       </div>
                    </div>

                    <div className="mb-6">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Current Balance</div>
                       <div className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(totalAmount)}</div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => setShowSavingEntryForm(saving.id)}
                        className="w-full py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        ADD SAVING ENTRY
                      </button>
                      <button 
                        onClick={() => setExpandedSavingId(isExpanded ? null : saving.id)}
                        className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest py-1 flex items-center justify-center gap-2"
                      >
                        {isExpanded ? 'HIDE HISTORY' : 'VIEW HISTORY'}
                        <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 space-y-2 animate-in slide-in-from-top-2">
                        {saving.entries.length === 0 ? (
                           <div className="text-center py-4 text-[10px] text-slate-400">No entries yet</div>
                        ) : (
                          [...saving.entries].reverse().map(e => (
                            <div key={e.id} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                              <div>
                                 <div className="text-xs font-black text-slate-800 dark:text-slate-100">{formatCurrency(e.amount)}</div>
                                 <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{new Date(e.date).toLocaleDateString()} {e.notes && `• ${e.notes}`}</div>
                              </div>
                              <button onClick={() => onDeleteSavingEntry(saving.id, e.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"><i className="fa-solid fa-trash text-[9px]"></i></button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Chit Entry Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={resetEntryForm}></div>
          <Card className="relative z-10 w-full max-w-xs p-8 rounded-[2.5rem] animate-in zoom-in duration-300 bg-white dark:bg-slate-900 border-none shadow-2xl">
            <SubHeading className="mb-2 text-center text-blue-600 font-black">{showEntryForm.monthLabel.toUpperCase()}</SubHeading>
            <Heading className="mb-8 text-center text-2xl font-black text-slate-800 dark:text-white">Update Payment</Heading>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Monthly Paid Amount</label>
                <input 
                  type="number" 
                  placeholder="5000" 
                  value={entryPaid} 
                  onChange={e => setEntryPaid(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-black text-xl placeholder:opacity-30 outline-none"
                />
              </div>
              
              <div className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                 <input 
                  type="checkbox" 
                  checked={entryIsTaken} 
                  onChange={e => setEntryIsTaken(e.target.checked)} 
                  className="w-6 h-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                 />
                 <span className="text-[11px] font-black text-slate-600 dark:text-slate-200 uppercase tracking-tight">Did you take the chit?</span>
              </div>

              {entryIsTaken ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                   <div>
                      <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 mb-2 block">Your Payout Received</label>
                      <Input type="number" placeholder="Actual Amount Received" value={entryReceived} onChange={e => setEntryReceived(e.target.value)} className="border-indigo-100 dark:border-indigo-900/30 text-lg font-black" />
                   </div>
                   <Input placeholder="Auction Notes (Optional)" value={entryTakenBy} onChange={e => setEntryTakenBy(e.target.value)} className="text-sm font-bold" />
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Chit Auction Amount (Taken by others)</label>
                      <Input type="number" placeholder="Winning Bid Amount" value={entryWinningBid} onChange={e => setEntryWinningBid(e.target.value)} className="text-lg font-black" />
                   </div>
                </div>
              )}

              {entryError && (
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight text-center animate-bounce">{entryError}</p>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <button onClick={handleEntrySubmit} className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-500/30 active:scale-95 transition-all">
                  Confirm Record
                </button>
                <button onClick={resetEntryForm} className="w-full py-4 text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 hover:text-slate-600 transition-colors">
                  CANCEL
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Saving Entry Modal */}
      {showSavingEntryForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowSavingEntryForm(null)}></div>
          <Card className="relative z-10 w-full max-w-xs p-8 rounded-[2.5rem] animate-in zoom-in duration-300 bg-white dark:bg-slate-900">
            <SubHeading className="mb-2 text-center text-emerald-600 tracking-widest">SAVING BUCKET</SubHeading>
            <Heading className="mb-6 text-center text-xl uppercase font-black">Deposit Money</Heading>
            <div className="space-y-4">
              <Input type="number" placeholder="Amount to add" value={sEntryAmount} onChange={e => setSEntryAmount(e.target.value)} autoFocus className="text-2xl text-center" />
              <Input type="date" value={sEntryDate} max={todayStr} onChange={e => setSEntryDate(e.target.value)} />
              <Input placeholder="Note (Optional)" value={sEntryNotes} onChange={e => setSEntryNotes(e.target.value)} />
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowSavingEntryForm(null)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Cancel</button>
                <button onClick={() => handleSavingEntrySubmit(showSavingEntryForm)} className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">Add Savings</button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteChitId}
        onClose={() => setDeleteChitId(null)}
        onConfirm={() => deleteChitId && onDeleteChit(deleteChitId)}
        title="Delete Chit Fund?"
        message="Permanently remove this chit fund and its entire history? This action cannot be undone."
      />

      <ConfirmModal 
        isOpen={!!deleteSavingId}
        onClose={() => setDeleteSavingId(null)}
        onConfirm={() => deleteSavingId && onDeleteSaving(deleteSavingId)}
        title="Delete Bucket?"
        message="Permanently remove this saving bucket and all its history?"
      />
    </div>
  );
};

export default ChitSavingsSection;
