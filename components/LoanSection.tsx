
import React, { useState } from 'react';
import { Card, Heading, Input, Button, SubHeading, ConfirmModal } from './Shared.tsx';
import { formatCurrency, getLoanStatus, validateAmount, validateString, isTodayOrPast } from '../utils.ts';
import { Loan, LoanType, LoanPayment } from '../types.ts';

const LoanSection: React.FC<{
  loans: Loan[];
  onAdd: (loan: Omit<Loan, 'id'>) => void;
  onUpdate: (id: string, loan: Omit<Loan, 'id'>) => void;
  onDelete: (id: string) => void;
  onCelebrate: (message: string) => void;
}> = ({ loans, onAdd, onUpdate, onDelete, onCelebrate }) => {
  const [showForm, setShowForm] = useState(loans.length === 0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [showPastRecords, setShowPastRecords] = useState(false);
  
  // Loan Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<LoanType>('Personal');
  const [total, setTotal] = useState('');
  const [start, setStart] = useState(new Date().toISOString().slice(0, 10));
  const [emi, setEmi] = useState('');
  const [dueDay, setDueDay] = useState('5');
  const [tenure, setTenure] = useState('12');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);

  // Auto-calculate End Date
  const calculateEndDate = (startDate: string, months: string) => {
    if (!startDate || !months) return '';
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(months));
    return date.toISOString().slice(0, 10);
  };

  const resetForm = () => {
    setName(''); setType('Personal'); setTotal('');
    setStart(todayStr); setEmi(''); setDueDay('5'); setTenure('12'); setNotes('');
    setEditingId(null); setIsSubmitted(false); setShowForm(loans.length === 0);
  };

  const handleLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    const nameVal = validateString(name);
    const totalVal = validateAmount(total);
    const emiVal = validateAmount(emi);
    const tenureVal = validateAmount(tenure);
    
    if (!nameVal.isValid || !totalVal.isValid || !tenureVal.isValid || !emiVal.isValid) return;

    const endDate = calculateEndDate(start, tenure);
    const emiAmount = parseFloat(emi);

    // Auto-calculate past payments
    let initialPayments: LoanPayment[] = [];
    if (!editingId) {
      const today = new Date();
      const startDate = new Date(start);
      // Diff in months including partial current month
      const diffMonths = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
      
      // If diff is positive, mark those previous months as paid automatically
      for (let i = 0; i < diffMonths; i++) {
        const paymentMonthDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, parseInt(dueDay));
        initialPayments.push({
          id: Math.random().toString(36).substring(7),
          amount: emiAmount,
          date: paymentMonthDate.toISOString().slice(0, 10)
        });
      }
    }

    const payload = {
      name: name.trim(),
      type,
      totalAmount: parseFloat(total),
      startDate: start,
      endDate: endDate,
      emiAmount: emiAmount,
      dueDay: parseInt(dueDay),
      tenureMonths: parseInt(tenure),
      payments: editingId ? (loans.find(l => l.id === editingId)?.payments || []) : initialPayments,
      notes: notes.trim() || undefined
    };

    if (editingId) {
      onUpdate(editingId, payload);
    } else {
      onAdd(payload);
    }
    resetForm();
  };

  const togglePayment = (loanId: string, monthKey: string, date: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    const isPaid = loan.payments.some(p => p.date.startsWith(monthKey));
    let updatedPayments;

    if (isPaid) {
      updatedPayments = loan.payments.filter(p => !p.date.startsWith(monthKey));
    } else {
      updatedPayments = [...loan.payments, {
        id: Math.random().toString(36).substring(7),
        amount: loan.emiAmount,
        date: date
      }];
    }

    onUpdate(loanId, { ...loan, payments: updatedPayments });

    // Celebration check
    const newStatus = getLoanStatus({ ...loan, payments: updatedPayments });
    if (!isPaid && newStatus.isCompleted) {
      onCelebrate(`Congratulations! You've fully repaid your ${loan.name} loan!`);
    }
  };

  const startEdit = (loan: Loan) => {
    setEditingId(loan.id);
    setName(loan.name);
    setType(loan.type);
    setTotal(loan.totalAmount.toString());
    setStart(loan.startDate);
    setEmi(loan.emiAmount.toString());
    setDueDay(loan.dueDay.toString());
    setTenure(loan.tenureMonths.toString());
    setNotes(loan.notes || '');
    setShowForm(true);
    setIsSubmitted(false);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loanTypes: LoanType[] = ['Personal', 'Vehicle', 'Home', 'Education', 'Other'];
  const allLoanStatuses = loans.map(l => ({ loan: l, status: getLoanStatus(l) }));
  const activeLoans = allLoanStatuses.filter(l => !l.status.isCompleted);
  const completedLoans = allLoanStatuses.filter(l => l.status.isCompleted);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center px-2">
        <Heading className="text-2xl font-black">Bank Loans</Heading>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
            <i className="fa-solid fa-plus"></i>
          </button>
        )}
      </div>

      {showForm && (
        <Card className="rounded-[2.5rem] border-none shadow-xl p-6 animate-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleLoanSubmit} className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <SubHeading className="text-[10px] font-black">{editingId ? 'UPDATE' : 'NEW'} LOAN</SubHeading>
              {loans.length > 0 && <button type="button" onClick={resetForm} className="text-[10px] font-black text-rose-500 uppercase">Cancel</button>}
            </div>

            <Input placeholder="Lender Name (e.g. HDFC Bank)" value={name} onChange={e => setName(e.target.value)} error={isSubmitted && !name.trim() ? "Name is required" : undefined} />
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loan Type</label>
              <div className="flex flex-wrap gap-2">
                {loanTypes.map(t => (
                  <button key={t} type="button" onClick={() => setType(t)} className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${type === t ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'}`}>{t.toUpperCase()}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Principal Amount" type="number" placeholder="0.00" value={total} onChange={e => setTotal(e.target.value)} error={isSubmitted && !total ? "Required" : undefined} />
              <Input label="Tenure (Months)" type="number" placeholder="12" value={tenure} onChange={e => setTenure(e.target.value)} error={isSubmitted && !tenure ? "Required" : undefined} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Monthly EMI" type="number" placeholder="0.00" value={emi} onChange={e => setEmi(e.target.value)} error={isSubmitted && !emi ? "Required" : undefined} />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Due Day</label>
                <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-xs font-black text-slate-900 dark:text-white outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input label="Start Date" type="date" value={start} onChange={e => setStart(e.target.value)} />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-50">Est. End Date</label>
                <div className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent rounded-2xl px-5 py-4 text-xs font-black text-slate-400 dark:text-slate-600 cursor-not-allowed">
                  {calculateEndDate(start, tenure) || '---'}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full py-4 text-xs tracking-widest">{editingId ? 'UPDATE LOAN' : 'SAVE LOAN'}</Button>
          </form>
        </Card>
      )}

      {/* Active Loans Section */}
      <div className="space-y-4">
        {activeLoans.length > 0 && activeLoans.map(({ loan, status }) => (
          <LoanCard 
            key={loan.id} 
            loan={loan} 
            status={status} 
            onEdit={startEdit} 
            onDelete={setDeleteId} 
            onTogglePayment={togglePayment}
            isExpanded={expandedLoanId === loan.id}
            onToggleExpand={() => setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id)}
          />
        ))}
        
        {loans.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-slate-800 transition-colors">
            <i className="fa-solid fa-landmark text-4xl text-slate-100 dark:text-slate-800 mb-2"></i>
            <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">No active loans found</p>
          </div>
        )}
      </div>

      {/* Completed Loans Section */}
      {completedLoans.length > 0 && (
        <div className="mt-12 space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center px-2">
            <SubHeading className="text-[10px] font-black tracking-widest text-slate-400">PAST RECORDS</SubHeading>
            <button 
              onClick={() => setShowPastRecords(!showPastRecords)}
              className="text-[10px] font-black text-blue-600 uppercase"
            >
              {showPastRecords ? 'Hide History' : `View History (${completedLoans.length})`}
            </button>
          </div>

          {showPastRecords && (
            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
              {completedLoans.map(({ loan, status }) => (
                <LoanCard 
                  key={loan.id} 
                  loan={loan} 
                  status={status} 
                  onEdit={startEdit} 
                  onDelete={setDeleteId} 
                  onTogglePayment={togglePayment}
                  isCompleted 
                  isExpanded={expandedLoanId === loan.id}
                  onToggleExpand={() => setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && onDelete(deleteId)} title="Delete Loan?" message="All payment history for this loan will be wiped." />
    </div>
  );
};

const LoanCard = ({ loan, status, onEdit, onDelete, onTogglePayment, isCompleted, isExpanded, onToggleExpand }: any) => {
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const currentMonthEntry = status.timeline.find((t: any) => t.monthKey === currentMonthKey);

  return (
    <Card className={`p-6 rounded-[2.5rem] border-none shadow-sm transition-all ${isCompleted ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-70 grayscale-[0.3]' : 'bg-white dark:bg-slate-900'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isCompleted ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'}`}>
            <i className={`fa-solid ${loan.type === 'Vehicle' ? 'fa-car' : loan.type === 'Home' ? 'fa-house' : loan.type === 'Education' ? 'fa-graduation-cap' : 'fa-landmark'}`}></i>
          </div>
          <div>
            <h4 className="font-black text-slate-800 dark:text-white leading-tight">{loan.name}</h4>
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{loan.type}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(loan)} className="text-slate-300 hover:text-blue-600"><i className="fa-solid fa-pen text-xs"></i></button>
          <button onClick={() => onDelete(loan.id)} className="text-slate-300 hover:text-rose-500"><i className="fa-solid fa-trash text-xs"></i></button>
        </div>
      </div>

      {!isCompleted && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Paid Amount</div>
                <div className="text-lg font-black text-blue-600">{formatCurrency(status.totalPaid)}</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 text-right">
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining</div>
                <div className="text-lg font-black text-rose-500">{formatCurrency(status.remainingBalance)}</div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
              <span>Payback Progress</span>
              <span className="text-blue-600">{Math.round(status.progress)}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${status.progress}%` }}></div>
            </div>
          </div>

          {/* Quick Pay Current Month */}
          {currentMonthEntry && (
            <div className="mb-4">
              <button 
                onClick={() => onTogglePayment(loan.id, currentMonthEntry.monthKey, currentMonthEntry.date)}
                className={`w-full py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${currentMonthEntry.isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-600 text-white shadow-xl shadow-blue-500/10'}`}
              >
                {currentMonthEntry.isPaid ? (
                  <><i className="fa-solid fa-circle-check"></i> {currentMonthEntry.label} EMI PAID</>
                ) : (
                  <>MARK {currentMonthEntry.label} AS PAID</>
                )}
              </button>
            </div>
          )}

          <button 
            onClick={onToggleExpand}
            className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
          >
            {isExpanded ? 'HIDE PAYMENT TIMELINE' : 'VIEW FULL PAYMENT SCHEDULE'}
            <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
          </button>
        </>
      )}
      
      {isCompleted && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
            <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">LOAN STATUS</div>
            <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
              {status.isPastTenure ? 'MATURED' : 'PAID OFF EARLY'} <i className="fa-solid fa-circle-check ml-1"></i>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Settled</div>
              <div className="text-base font-black text-slate-600 dark:text-slate-400">{formatCurrency(status.totalPaid)}</div>
            </div>
            <div className="text-right">
               <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</div>
               <div className="text-base font-black text-slate-600 dark:text-slate-400">{loan.endDate}</div>
            </div>
          </div>
          <button 
            onClick={onToggleExpand}
            className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest py-2 border-t border-slate-50 dark:border-slate-800"
          >
            {isExpanded ? 'HIDE HISTORY' : 'VIEW PAYMENT HISTORY'}
          </button>
        </div>
      )}

      {/* Payment Schedule Detail View */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center px-1 mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly EMI Log</span>
            <span className="text-[10px] font-black text-blue-600 uppercase">EMI: {formatCurrency(loan.emiAmount)}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {status.timeline.map((item: any) => (
              <div 
                key={item.monthKey}
                onClick={() => onTogglePayment(loan.id, item.monthKey, item.date)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer active:scale-[0.98] ${item.isPaid ? 'bg-emerald-50/30 border-emerald-100 dark:bg-emerald-900/5' : 'bg-slate-50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800'} ${item.status === 'current' ? 'ring-2 ring-blue-500/20 border-blue-200' : ''}`}
              >
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${item.isPaid ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      {item.monthIndex + 1}
                   </div>
                   <div>
                      <div className={`text-xs font-black uppercase ${item.status === 'current' ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>
                        {item.label}
                        {item.status === 'current' && <span className="ml-2 text-[8px] tracking-tight opacity-70">CURRENT</span>}
                      </div>
                   </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${item.isPaid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-slate-700'}`}>
                  {item.isPaid && <i className="fa-solid fa-check text-[10px]"></i>}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[8px] text-center font-black text-slate-300 uppercase tracking-widest mt-4">Tapping a month will toggle its payment status</p>
        </div>
      )}
    </Card>
  );
};

export default LoanSection;
