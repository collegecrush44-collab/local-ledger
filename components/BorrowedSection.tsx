import React, { useState, useRef } from 'react';
import { Card, Heading, Input, Button, SubHeading, ConfirmModal, CountUp } from './Shared.tsx';
import { formatCurrency, getBorrowedStatus } from '../utils.ts';
import { BorrowedMoney, Payment } from '../types.ts';

interface BorrowedProps {
  borrowed: BorrowedMoney[];
  onAdd: (entry: Omit<BorrowedMoney, 'id'>) => void;
  onUpdate: (id: string, entry: Omit<BorrowedMoney, 'id'>) => void;
  onDelete: (id: string) => void;
  onComplete: (title: string, message: string) => void;
}

const BorrowedSection: React.FC<BorrowedProps> = ({ borrowed, onAdd, onUpdate, onDelete, onComplete }) => {
  const [person, setPerson] = useState('');
  const [total, setTotal] = useState('');
  const [paidNow, setPaidNow] = useState('');
  const [start, setStart] = useState(new Date().toISOString().split('T')[0]);
  const [entryImage, setEntryImage] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [isPaySuccess, setIsPaySuccess] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [deletePaymentId, setDeletePaymentId] = useState<{debtId: string, paymentId: string} | null>(null);
  
  const [recordAmount, setRecordAmount] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [recordImage, setRecordImage] = useState<string | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewImage, setViewImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recordFileRef = useRef<HTMLInputElement>(null);
  const recordCameraRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | undefined) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (person && total && start) {
      const parsedTotal = parseFloat(total);
      const parsedPaidNow = parseFloat(paidNow) || 0;

      if (parsedTotal < 0 || parsedPaidNow < 0) {
        setFormError(true);
        setTimeout(() => setFormError(false), 500);
        return;
      }

      const initialPayments: Payment[] = parsedPaidNow > 0 ? [{ id: Math.random().toString(36).substring(7), amount: parsedPaidNow, date: start }] : [];
      
      const payload = {
        personName: person,
        totalAmount: parsedTotal || 0,
        totalPaid: parsedPaidNow,
        startDate: start,
        payments: initialPayments,
        imageUrl: entryImage
      };
      if (editingId) {
        const existing = borrowed.find(b => b.id === editingId);
        onUpdate(editingId, { ...payload, payments: existing?.payments || initialPayments, imageUrl: entryImage || existing?.imageUrl });
        setEditingId(null);
      } else {
        onAdd(payload);
        if (parsedPaidNow >= parsedTotal) {
           onComplete("Instantly Paid!", `You just recorded and cleared a debt for ${person}. Great speed!`);
        }
      }
      resetForm();
    } else {
      setFormError(true);
      setTimeout(() => setFormError(false), 500);
    }
  };

  const resetForm = () => {
    setPerson(''); setTotal(''); setPaidNow(''); setStart(new Date().toISOString().split('T')[0]);
    setEntryImage(undefined);
    setEditingId(null);
  };

  const startEdit = (item: BorrowedMoney) => {
    setEditingId(item.id);
    setPerson(item.personName);
    setTotal(item.totalAmount.toString());
    setPaidNow(item.totalPaid.toString());
    setStart(item.startDate);
    setEntryImage(item.imageUrl);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRecordPayment = () => {
    if (!payingId || !recordAmount) return;
    const parsedAmount = parseFloat(recordAmount);

    if (parsedAmount < 0) {
      return;
    }

    const entry = borrowed.find(b => b.id === payingId);
    if (entry) {
      const amount = parsedAmount || 0;
      let newTotalPaid = entry.totalPaid;
      
      if (editingPaymentId) {
        const updatedPayments = entry.payments.map(p => 
          p.id === editingPaymentId 
            ? { ...p, amount, date: recordDate, imageUrl: recordImage } 
            : p
        );
        newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
        
        onUpdate(payingId, {
          ...entry,
          totalPaid: newTotalPaid,
          payments: updatedPayments
        });
      } else {
        const newPayment: Payment = {
          id: Math.random().toString(36).substring(7),
          amount,
          date: recordDate,
          imageUrl: recordImage
        };
        newTotalPaid = entry.totalPaid + amount;

        onUpdate(payingId, {
          ...entry,
          totalPaid: newTotalPaid,
          payments: [...(entry.payments || []), newPayment]
        });
      }
      
      setIsPaySuccess(true);
      setTimeout(() => {
        setIsPaySuccess(false);
        setPayingId(null);
        setEditingPaymentId(null);
        setRecordAmount('');
        setRecordDate(new Date().toISOString().split('T')[0]);
        setRecordImage(undefined);
        if (newTotalPaid >= entry.totalAmount) {
           onComplete("Debt Cleared!", `Nicely done! You've finished paying back ${entry.personName}.`);
        }
      }, 600);
    }
  };

  const totalBalanceLeft = borrowed.reduce((sum, b) => sum + getBorrowedStatus(b).remainingBalance, 0);
  const filteredBorrowed = borrowed.filter(b => 
    b.personName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.totalAmount.toString().includes(searchTerm) ||
    b.totalPaid.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6 pb-12">
      <Heading className="dark:text-white">Borrowed Money</Heading>
      
      <Card className={`border-slate-100 dark:border-slate-800 ring-4 ring-slate-50/50 dark:ring-slate-900/10 ${editingId ? 'border-blue-500 ring-blue-50 dark:ring-blue-900/30' : ''} animate-slide-up`}>
        <div className="flex justify-between items-center mb-4">
          <SubHeading className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            {editingId ? 'UPDATING DEBT ENTRY' : 'NEW ENTRY (PERSON/INDIV.)'}
          </SubHeading>
          {editingId && (
            <button onClick={resetForm} className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-950 px-2 py-1 rounded border border-rose-100 dark:border-rose-900">
              CANCEL
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Person Name"
            value={person}
            hasError={formError && !person}
            onChange={e => setPerson(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="Total Borrowed"
              value={total}
              hasError={formError && !total}
              onChange={e => setTotal(e.target.value)}
            />
            <Input
              type="number"
              min="0"
              step="any"
              placeholder="Paid Now"
              value={paidNow}
              onChange={e => setPaidNow(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase ml-1 block tracking-widest">Start Date</label>
            <Input
              type="date"
              value={start}
              max={todayStr}
              onChange={e => setStart(e.target.value)}
              className="appearance-none"
            />
          </div>

          <Button type="submit" className="w-full py-4 text-base font-black">
            {editingId ? 'Update Entry' : 'Add Entry'}
          </Button>
        </form>
      </Card>

      <div className="bg-slate-900 dark:bg-slate-900 border border-transparent dark:border-slate-800 p-6 rounded-[2rem] text-white flex justify-between items-center transition-colors animate-slide-up delay-1">
        <div>
          <div className="text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest mb-1">Total Balance Left</div>
          <div className="text-3xl font-black tracking-tight">
            <CountUp value={totalBalanceLeft} prefix="₹" />
          </div>
        </div>
        <div className="w-12 h-12 bg-white/10 dark:bg-white/5 rounded-2xl flex items-center justify-center text-xl backdrop-blur-md border border-white/5">
          <i className="fa-solid fa-handshake"></i>
        </div>
      </div>

      <div className="space-y-4">
        {filteredBorrowed.map((item, idx) => {
          const status = getBorrowedStatus(item);
          const isEditing = editingId === item.id;
          const isExpanded = expandedId === item.id;
          
          return (
            <Card key={item.id} className={`border-none shadow-lg dark:shadow-none rounded-[2.5rem] relative overflow-hidden transition-all animate-slide-up delay-${Math.min(idx+1, 4)} ${isEditing ? 'ring-4 ring-blue-500/20 scale-[0.98]' : ''}`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-xl leading-tight">{item.personName}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5">START: {item.startDate}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(item)} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center"><i className="fa-solid fa-pen-to-square text-xs"></i></button>
                  <button onClick={() => setDeleteId(item.id)} className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:text-rose-500"><i className="fa-solid fa-trash text-xs"></i></button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-3xl border border-emerald-100/50 dark:border-emerald-900/40 text-center">
                  <div className="text-[10px] font-black text-emerald-600 uppercase mb-2 opacity-60">Total Paid</div>
                  <div className="text-lg font-black text-emerald-600 leading-none">
                    <CountUp value={item.totalPaid} prefix="₹" />
                  </div>
                </div>
                <div className="bg-rose-50/50 dark:bg-rose-950/20 p-5 rounded-3xl border border-rose-100/50 dark:border-rose-900/40 text-center">
                  <div className="text-[10px] font-black text-rose-500 uppercase mb-2 opacity-60">Remaining</div>
                  <div className="text-lg font-black text-rose-500 leading-none">
                    <CountUp value={status.remainingBalance} prefix="₹" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                  <span>Repayment Progress</span>
                  <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-600">{Math.round(status.progress)}%</span>
                </div>
                <div className="h-3 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-100/50">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(37,99,235,0.4)]" 
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
              </div>

              <button 
                onClick={() => {
                  setPayingId(item.id);
                  setEditingPaymentId(null);
                  setRecordAmount('');
                  setRecordDate(new Date().toISOString().split('T')[0]);
                }}
                className="w-full py-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black text-[13px] rounded-2xl border border-blue-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-plus"></i>
                RECORD PAYMENT
              </button>
            </Card>
          );
        })}
      </div>

      {payingId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => { setPayingId(null); setEditingPaymentId(null); }}></div>
          <Card className="relative z-10 w-full max-w-xs rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-300 border dark:border-slate-800">
            <Heading className="text-center text-xl mb-4 dark:text-white">New Repayment</Heading>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="0.00"
                autoFocus
                value={recordAmount}
                onChange={e => setRecordAmount(e.target.value)}
                className="text-lg font-black text-center"
              />
              <Input type="date" value={recordDate} max={todayStr} onChange={e => setRecordDate(e.target.value)} />
              <Button onClick={handleRecordPayment} isSuccess={isPaySuccess} className="w-full py-4 font-black uppercase tracking-widest text-xs">
                Confirm Payment
              </Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && onDelete(deleteId)}
        title="Delete Record?"
        message="Permanently remove this entry?"
      />
    </div>
  );
};

export default BorrowedSection;