
import React, { useState, useRef } from 'react';
import { Card, Heading, Input, Button, SubHeading, ConfirmModal } from './Shared.tsx';
import { formatCurrency, getBorrowedStatus, validateAmount, validateString, isTodayOrPast } from '../utils.ts';
import { BorrowedMoney, Payment } from '../types.ts';

interface BorrowedProps {
  borrowed: BorrowedMoney[];
  onAdd: (entry: Omit<BorrowedMoney, 'id'>) => void;
  onUpdate: (id: string, entry: Omit<BorrowedMoney, 'id'>) => void;
  onDelete: (id: string) => void;
  onCelebrate: (message: string) => void;
}

const BorrowedSection: React.FC<BorrowedProps> = ({ borrowed, onAdd, onUpdate, onDelete, onCelebrate }) => {
  const [person, setPerson] = useState('');
  const [total, setTotal] = useState('');
  const [paidNow, setPaidNow] = useState('');
  const [start, setStart] = useState(new Date().toISOString().split('T')[0]);
  const [entryImages, setEntryImages] = useState<string[]>(['', '', '']);
  const [notes, setNotes] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [recordAmount, setRecordAmount] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordImages, setRecordImages] = useState<string[]>(['', '', '']);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPaymentSubmitted, setIsPaymentSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(borrowed.length === 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<number | null>(null);

  const handleSlotClick = (index: number) => {
    activeSlotRef.current = index;
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const index = activeSlotRef.current;
    if (file && index !== null) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (payingId) {
          setRecordImages(prev => {
            const next = [...prev];
            next[index] = result;
            return next;
          });
        } else {
          setEntryImages(prev => {
            const next = [...prev];
            next[index] = result;
            return next;
          });
        }
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (payingId) {
      setRecordImages(prev => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
    } else {
      setEntryImages(prev => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
    }
  };

  const nameVal = validateString(person);
  const totalVal = validateAmount(total);
  const dateVal = isTodayOrPast(start);
  
  const isFormValid = nameVal.isValid && totalVal.isValid && dateVal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    if (!isFormValid) return;

    const initialPaid = parseFloat(paidNow || '0');
    const initialPayments: Payment[] = initialPaid > 0 ? [{ 
      id: Math.random().toString(36).substring(7), 
      amount: initialPaid, 
      date: start,
      imageUrls: entryImages.filter(img => !!img)
    }] : [];
    
    const payload = {
      personName: person.trim(),
      totalAmount: parseFloat(total),
      totalPaid: initialPayments.reduce((s,p) => s + p.amount, 0),
      startDate: start,
      payments: initialPayments,
      imageUrls: entryImages.filter(img => !!img),
      notes: notes.trim() || undefined
    };

    if (editingId) {
      const existing = borrowed.find(b => b.id === editingId);
      onUpdate(editingId, { 
        ...payload, 
        payments: existing?.payments || initialPayments, 
        totalPaid: (existing?.payments || initialPayments).reduce((s,p) => s + p.amount, 0),
        imageUrls: entryImages.filter(img => !!img) 
      });
    } else {
      onAdd(payload);
    }
    resetForm();
    setShowForm(false);
  };

  const resetForm = () => {
    setPerson(''); setTotal(''); setPaidNow(''); setStart(new Date().toISOString().split('T')[0]);
    setEntryImages(['', '', '']); setNotes('');
    setEditingId(null); setIsSubmitted(false);
  };

  const startEdit = (item: BorrowedMoney) => {
    setEditingId(item.id);
    setPerson(item.personName);
    setTotal(item.totalAmount.toString());
    setPaidNow('');
    setStart(item.startDate);
    const existingImgs = [...(item.imageUrls || [])];
    while(existingImgs.length < 3) existingImgs.push('');
    setEntryImages(existingImgs.slice(0,3));
    setNotes(item.notes || '');
    setIsSubmitted(false);
    setShowForm(true);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentDebt = borrowed.find(b => b.id === payingId);
  const pAmountVal = validateAmount(recordAmount);
  const pDateVal = isTodayOrPast(recordDate);
  
  let pOverpaymentError = '';
  if (currentDebt && pAmountVal.isValid) {
    const amt = parseFloat(recordAmount);
    if (amt + currentDebt.totalPaid > currentDebt.totalAmount) {
      pOverpaymentError = `Cannot exceed total of ${formatCurrency(currentDebt.totalAmount)}`;
    }
  }

  const handleRecordPayment = () => {
    setIsPaymentSubmitted(true);
    if (!currentDebt || !pAmountVal.isValid || !pDateVal || pOverpaymentError) return;

    const amount = parseFloat(recordAmount);
    const validImgs = recordImages.filter(img => !!img);

    const updatedPayments = [...(currentDebt.payments || []), { id: Math.random().toString(36).substring(7), amount, date: recordDate, imageUrls: validImgs }];
    const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    onUpdate(payingId!, { ...currentDebt, totalPaid: newTotalPaid, payments: updatedPayments });

    if (newTotalPaid >= currentDebt.totalAmount) {
      onCelebrate(`Fully repaid your debt to ${currentDebt.personName}!`);
    }
    
    setPayingId(null);
    setRecordAmount('');
    setRecordImages(['', '', '']);
    setIsPaymentSubmitted(false);
  };

  const totalBalanceLeft = borrowed.reduce((sum, b) => sum + getBorrowedStatus(b).remainingBalance, 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center px-2">
        <Heading className="text-2xl font-black">Personal Debts</Heading>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all">
            <i className="fa-solid fa-plus"></i>
          </button>
        )}
      </div>

      {showForm && (
        <Card className={`rounded-[2.5rem] p-6 animate-in slide-in-from-top-4 duration-300 ${editingId ? 'border-blue-500 ring-2 ring-blue-50 dark:ring-blue-900/10' : ''}`}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex justify-between items-center mb-2">
              <SubHeading className="text-[10px] font-black">{editingId ? 'EDIT' : 'NEW'} DEBT</SubHeading>
              {borrowed.length > 0 && <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="text-[10px] font-black text-rose-500 uppercase">Cancel</button>}
            </div>

            <Input
              label="Lender Name"
              placeholder="Friend/Bank..."
              value={person}
              onChange={e => setPerson(e.target.value)}
              error={isSubmitted ? nameVal.error : undefined}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total Amount"
                type="number"
                placeholder="0.00"
                value={total}
                onChange={e => setTotal(e.target.value)}
                error={isSubmitted ? totalVal.error : undefined}
                required
              />
              <Input
                label="Paid Already"
                type="number"
                placeholder="0.00"
                value={paidNow}
                onChange={e => setPaidNow(e.target.value)}
                disabled={!!editingId}
              />
            </div>
            
            <Input
              label="Started On"
              type="date"
              value={start}
              max={todayStr}
              onChange={e => setStart(e.target.value)}
              error={isSubmitted && !dateVal ? "Cannot be in future" : undefined}
              required
            />

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Proof Photos</label>
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleSlotClick(idx)}
                    className={`aspect-square rounded-2xl border-2 border-dashed flex items-center justify-center relative overflow-hidden transition-all group cursor-pointer ${entryImages[idx] ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30'}`}
                  >
                    {entryImages[idx] ? (
                      <>
                        <img src={entryImages[idx]} className="w-full h-full object-cover" onClick={(e) => { e.stopPropagation(); setViewImage(entryImages[idx]); }} />
                        <button 
                          onClick={(e) => removeImage(idx, e)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg active:scale-90 transition-all z-10"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </>
                    ) : (
                      <i className="fa-solid fa-camera text-xl text-slate-300"></i>
                    )}
                  </div>
                ))}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>

            <Button type="submit" className="w-full py-4 uppercase tracking-widest text-xs">
              {editingId ? 'Update Record' : 'Save Record'}
            </Button>
          </form>
        </Card>
      )}

      <div className="bg-slate-800 dark:bg-slate-900 p-6 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl shadow-slate-200/50 dark:shadow-none mx-1">
        <div>
          <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Balance Left</div>
          <div className="text-4xl font-black">{formatCurrency(totalBalanceLeft)}</div>
        </div>
        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl backdrop-blur-md border border-white/10">
          <i className="fa-solid fa-handshake"></i>
        </div>
      </div>

      <div className="space-y-4">
        {borrowed.map(item => {
           const status = getBorrowedStatus(item);
           const isExpanded = expandedId === item.id;
           const isCompleted = status.remainingBalance <= 0;
           return (
             <Card key={item.id} className={`p-6 rounded-[2.5rem] border-none shadow-sm transition-all ${isCompleted ? 'bg-slate-50/50 dark:bg-slate-900/40 opacity-70 grayscale-[0.3]' : 'bg-white dark:bg-slate-900'}`}>
                <div className="flex justify-between items-start mb-4">
                   <div className="flex gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isCompleted ? 'bg-slate-100 text-slate-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600'}`}>
                        <i className="fa-solid fa-handshake-angle"></i>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 dark:text-white leading-tight">{item.personName}</h4>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Since {new Date(item.startDate).toLocaleDateString()}</span>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => startEdit(item)} className="text-slate-300 hover:text-blue-500"><i className="fa-solid fa-pen text-xs"></i></button>
                      <button onClick={() => setDeleteId(item.id)} className="text-slate-300 hover:text-rose-500"><i className="fa-solid fa-trash text-xs"></i></button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                   <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Paid</div>
                      <div className="text-lg font-black text-blue-600">{formatCurrency(status.paidTillDate)}</div>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 text-right">
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance</div>
                      <div className="text-lg font-black text-rose-500">{formatCurrency(status.remainingBalance)}</div>
                   </div>
                </div>

                {!isCompleted && (
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase">
                      <span>Payback Progress</span>
                      <span className="text-blue-600">{Math.round(status.progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${status.progress}%` }}></div>
                    </div>
                  </div>
                )}

                {isCompleted && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between mb-4">
                    <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">DEBT STATUS</div>
                    <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">CLEARED <i className="fa-solid fa-circle-check ml-1"></i></div>
                  </div>
                )}

                {!isCompleted && (
                  <button 
                    onClick={() => setPayingId(item.id)}
                    className="w-full py-4 bg-blue-600 text-white font-black rounded-[1.8rem] text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-500/10 mb-4"
                  >
                    ADD REPAYMENT
                  </button>
                )}

                <button 
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity"
                >
                  {isExpanded ? 'HIDE DETAILS' : 'VIEW PAYMENT HISTORY'}
                  <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                </button>

                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 space-y-4 animate-in slide-in-from-top-2">
                    {item.notes && <p className="text-[10px] text-slate-500 italic mb-2">"{item.notes}"</p>}
                    <div className="space-y-2">
                      {item.payments.length === 0 ? (
                        <p className="text-[10px] text-center text-slate-400 py-4 uppercase font-black">No payments logged yet</p>
                      ) : (
                        item.payments.map((p, idx) => (
                          <div key={p.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-[10px] font-black">
                                  {idx + 1}
                               </div>
                               <div>
                                  <div className="text-xs font-black text-slate-800 dark:text-slate-100">{formatCurrency(p.amount)}</div>
                                  <div className="text-[8px] font-bold text-slate-400 uppercase">{p.date}</div>
                               </div>
                            </div>
                            {p.imageUrls && p.imageUrls.length > 0 && (
                              <button onClick={() => setViewImage(p.imageUrls![0])} className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100">
                                <img src={p.imageUrls[0]} className="w-full h-full object-cover" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
             </Card>
           );
        })}
      </div>

      {payingId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-xs p-8 rounded-[2.5rem] relative animate-in zoom-in duration-200 shadow-2xl">
            <button onClick={() => { setPayingId(null); setRecordImages(['', '', '']); }} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500"><i className="fa-solid fa-xmark text-lg"></i></button>
            <SubHeading className="text-center mb-1">Repayment</SubHeading>
            <Heading className="text-center mb-6 text-2xl font-black text-slate-800 dark:text-white">Record Payment</Heading>
            <div className="space-y-5">
              <Input
                label="Amount"
                type="number"
                value={recordAmount}
                onChange={e => setRecordAmount(e.target.value)}
                error={isPaymentSubmitted ? (pOverpaymentError || pAmountVal.error) : undefined}
              />
              <Input
                label="Date"
                type="date"
                value={recordDate}
                max={todayStr}
                onChange={e => setRecordDate(e.target.value)}
              />
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proof Photos</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((idx) => (
                    <div 
                      key={idx}
                      onClick={() => handleSlotClick(idx)}
                      className={`aspect-square rounded-xl border-2 border-dashed flex items-center justify-center relative overflow-hidden transition-all group cursor-pointer ${recordImages[idx] ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30'}`}
                    >
                      {recordImages[idx] ? (
                        <>
                          <img src={recordImages[idx]} className="w-full h-full object-cover" onClick={(e) => { e.stopPropagation(); setViewImage(recordImages[idx]); }} />
                          <button 
                            onClick={(e) => removeImage(idx, e)}
                            className="absolute top-1 right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] shadow-lg"
                          >
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </>
                      ) : (
                        <i className="fa-solid fa-plus text-slate-300"></i>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleRecordPayment} className="w-full py-4 uppercase text-xs tracking-widest">Confirm Payment</Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && onDelete(deleteId)} title="Delete Debt?" message="Repayment history will be lost." />
      
      {viewImage && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[250] flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
          <img src={viewImage} className="max-w-full max-h-[80vh] rounded-3xl shadow-2xl" />
        </div>
      )}
    </div>
  );
};

export default BorrowedSection;
