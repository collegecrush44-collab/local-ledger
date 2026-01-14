
import React, { useState, useRef } from 'react';
import { Card, Heading, Button, SubHeading, ConfirmModal, Input } from './Shared.tsx';
import { UserProfile, UserSettings, FinanceData, FinancialReminder, ReminderType, ReminderFrequency } from '../types.ts';
import { formatCurrency } from '../utils.ts';

interface ProfileSectionProps {
  data: FinanceData;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateSettings: (settings: UserSettings) => void;
  onResetData: () => void;
  onImportData: (data: FinanceData) => void;
  onInstall?: () => void;
  onAddReminder: (reminder: Omit<FinancialReminder, 'id' | 'isCompleted'>) => void;
  onUpdateReminder: (id: string, reminder: Omit<FinancialReminder, 'id'>) => void;
  onDeleteReminder: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onAddCustomCategory: (category: string) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ 
  data, onUpdateProfile, onUpdateSettings, onResetData, onImportData, onInstall,
  onAddReminder, onUpdateReminder, onDeleteReminder, onMarkPaid, onAddCustomCategory
}) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(data.profile.name);
  const [profileImage, setProfileImage] = useState(data.profile.profileImage);
  const [dob, setDob] = useState(data.profile.dob || '');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<FinanceData | null>(null);
  
  // App Lock Setup state
  const [showLockSetup, setShowLockSetup] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Reminders Management State
  const [showReminders, setShowReminders] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  // Form State
  const [rTitle, setRTitle] = useState('');
  const [rType, setRType] = useState<ReminderType>('Payment');
  const [rCategory, setRCategory] = useState('Subscription');
  const [rAmount, setRAmount] = useState('');
  const [rDueDate, setRDueDate] = useState('');
  const [rReminderDate, setRReminderDate] = useState('');
  const [rFrequency, setRFrequency] = useState<ReminderFrequency>('Monthly');
  const [rNotes, setRNotes] = useState('');
  const [rEditingId, setREditingId] = useState<string | null>(null);
  
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const profileCameraRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const dobInputRef = useRef<HTMLInputElement>(null);
  const todayStr = new Date().toISOString().slice(0, 10);

  const baseCategories = ['Subscription', 'Payments', 'Renewal', 'Loan', 'Rent', 'Credit Card', 'Chit Fund', 'Others'];
  const allCategories = [...baseCategories, ...data.settings.customReminderCategories];

  const resetForm = () => {
    setRTitle(''); setRType('Payment'); setRCategory('Subscription'); setRAmount('');
    setRDueDate(''); setRReminderDate(''); setRFrequency('Monthly');
    setRNotes(''); setREditingId(null); setShowAddForm(false); setShowAddCategory(false);
    setSubmitted(false);
  };

  // Add missing startEdit function to populate form for editing
  const startEdit = (rem: FinancialReminder) => {
    setREditingId(rem.id);
    setRTitle(rem.title);
    setRType(rem.type);
    setRCategory(rem.category);
    setRAmount(rem.amount?.toString() || '');
    setRDueDate(rem.dueDate);
    setRReminderDate(rem.reminderDate || rem.dueDate);
    setRFrequency(rem.frequency);
    setRNotes(rem.notes || '');
    setShowAddForm(true);
    // Smooth scroll to top of the scrollable main container
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReminderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!rTitle.trim() || !rDueDate || !rReminderDate) return;

    const payload = {
      title: rTitle,
      type: rType,
      category: rCategory,
      amount: rAmount ? parseFloat(rAmount) : undefined,
      dueDate: rDueDate,
      reminderDate: rReminderDate,
      frequency: rFrequency,
      notes: rNotes.trim() || undefined
    };
    if (rEditingId) {
      const existing = data.reminders.find(r => r.id === rEditingId);
      onUpdateReminder(rEditingId, { ...payload, isCompleted: existing?.isCompleted || false });
    } else {
      onAddReminder(payload);
    }
    resetForm();
  };

  const toggleLock = () => {
    if (data.settings.appLockEnabled) {
      onUpdateSettings({ ...data.settings, appLockEnabled: false });
    } else {
      setShowLockSetup(true);
      setPinError('');
    }
  };

  const handleLockSetup = () => {
    setPinError('');
    
    // Check if Security Key (DOB) is set
    if (!dob) {
      setPinError('Security Key (DOB) is required to enable App Lock.');
      dobInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (newPin.length !== 4) {
      setPinError('PIN must be 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match.');
      return;
    }

    onUpdateSettings({ 
      ...data.settings, 
      appLockEnabled: true, 
      appLockPin: newPin 
    });
    setShowLockSetup(false);
    setNewPin('');
    setConfirmPin('');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `local_ledger_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.href = url;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.profile && json.settings && Array.isArray(json.incomes)) {
          setImportFile(json);
          setShowImportModal(true);
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Error reading file. Make sure it is a valid JSON backup.");
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  return (
    <div className="space-y-6 pb-20 px-2">
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-4xl shadow-lg border border-blue-200 dark:border-blue-800/40 overflow-hidden">
            {profileImage ? <img src={profileImage} className="w-full h-full object-cover" alt="Profile" /> : <i className="fa-solid fa-user"></i>}
          </div>
          <button onClick={() => profileCameraRef.current?.click()} className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-slate-50 dark:border-slate-950 active:scale-90 transition-all">
            <i className="fa-solid fa-camera text-sm"></i>
          </button>
          <input type="file" ref={profileCameraRef} className="hidden" accept="image/*" onChange={(e) => {
             const file = e.target.files?.[0];
             if (file) {
               const reader = new FileReader();
               reader.onloadend = () => {
                 const base64Image = reader.result as string;
                 setProfileImage(base64Image);
                 onUpdateProfile({ ...data.profile, profileImage: base64Image });
               };
               reader.readAsDataURL(file);
             }
          }} />
        </div>
        <div className="text-center">
          <Input 
            value={name} 
            onChange={e => { setName(e.target.value); onUpdateProfile({...data.profile, name: e.target.value}); }} 
            className="text-center text-xl font-black bg-transparent border-none focus:ring-0 !py-2" 
            placeholder="Your Name"
          />
        </div>
      </div>

      <Card className="rounded-[2.5rem] p-6 shadow-xl border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-xl flex items-center justify-center"><i className="fa-solid fa-bell"></i></div>
              <div className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Reminders</div>
           </div>
           <button onClick={() => setShowReminders(!showReminders)} className="text-xs font-black text-blue-600 dark:text-blue-400">
              {showReminders ? 'HIDE' : 'MANAGE'}
           </button>
        </div>
        {showReminders && (
          <div className="space-y-4 animate-in slide-in-from-top-2">
             {showAddForm ? (
               <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                  <Input 
                    label="Purpose" 
                    placeholder="e.g. Broadband, Netflix" 
                    value={rTitle} 
                    onChange={e => setRTitle(e.target.value)} 
                    error={submitted && !rTitle.trim() ? "Required" : ""} 
                  />
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                      value={rCategory} 
                      onChange={e => setRCategory(e.target.value)} 
                      className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-inner appearance-none min-h-[58px]"
                    >
                      {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frequency</label>
                      <select 
                        value={rFrequency} 
                        onChange={e => setRFrequency(e.target.value as ReminderFrequency)} 
                        className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-inner appearance-none min-h-[58px]"
                      >
                        <option value="One-time">One-time</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option><option value="Yearly">Yearly</option>
                      </select>
                    </div>
                    <Input label="Amount" type="number" placeholder="₹ Amount" value={rAmount} onChange={e => setRAmount(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Payment Date" type="date" value={rDueDate} min={todayStr} onChange={e => setRDueDate(e.target.value)} className="text-xs" />
                    <Input label="Alert Date" type="date" value={rReminderDate} min={todayStr} onChange={e => setRReminderDate(e.target.value)} className="text-xs" />
                  </div>

                  <Input 
                    label="Notes" 
                    placeholder="Account ID, special terms..." 
                    value={rNotes} 
                    onChange={e => setRNotes(e.target.value)} 
                    className="text-xs font-normal" 
                  />

                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button onClick={resetForm} variant="secondary" className="py-4 text-[10px] uppercase tracking-widest">Cancel</Button>
                    <Button onClick={handleReminderSubmit} className="py-4 text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/10">
                      {rEditingId ? 'Update' : 'Save'}
                    </Button>
                  </div>
               </div>
             ) : (
               <>
                 <button onClick={() => setShowAddForm(true)} className="w-full py-5 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl text-[11px] font-black text-slate-400 hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 uppercase tracking-widest">+ Add New Reminder</button>
                 <div className="space-y-3">
                    {data.reminders.map(rem => (
                       <div key={rem.id} className="p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-300 shadow-sm"><i className="fa-solid fa-bell"></i></div>
                             <div>
                                <div className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{rem.title}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{rem.category || 'Payment'} • {rem.dueDate}</div>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             {!rem.isCompleted && <button onClick={() => onMarkPaid(rem.id)} className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center active:scale-90 transition-all"><i className="fa-solid fa-check text-[10px]"></i></button>}
                             <button onClick={() => startEdit(rem)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-500 flex items-center justify-center active:scale-90 transition-all"><i className="fa-solid fa-pen text-[9px]"></i></button>
                             <button onClick={() => onDeleteReminder(rem.id)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-rose-500 flex items-center justify-center active:scale-90 transition-all"><i className="fa-solid fa-trash text-[9px]"></i></button>
                          </div>
                       </div>
                    ))}
                 </div>
               </>
             )}
          </div>
        )}
      </Card>

      <Card className="rounded-[2.5rem] p-6 shadow-xl border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex items-center gap-3 mb-2">
           <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-database"></i></div>
           <div className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest">Data Management</div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <button onClick={handleExport} className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 active:scale-95 transition-all group">
            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
              <i className="fa-solid fa-file-export"></i>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-200">Export</div>
              <div className="text-[8px] font-bold uppercase text-slate-400 mt-0.5">Save Backup</div>
            </div>
          </button>
          
          <button onClick={handleImportClick} className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 active:scale-95 transition-all group">
            <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <i className="fa-solid fa-file-import"></i>
            </div>
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-200">Import</div>
              <div className="text-[8px] font-bold uppercase text-slate-400 mt-0.5">Restore Data</div>
            </div>
            <input type="file" ref={importInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
          </button>
        </div>
      </Card>

      <Card className="rounded-[2.5rem] p-6 shadow-xl border-slate-100 dark:border-slate-800 space-y-6">
        <SubHeading className="text-[11px] font-black text-slate-400 tracking-widest uppercase">Security Settings</SubHeading>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center"><i className="fa-solid fa-lock"></i></div>
            <div className="text-sm font-black text-slate-700 dark:text-slate-200">App Lock (PIN)</div>
          </div>
          <button onClick={toggleLock} className={`w-12 h-6 rounded-full transition-all relative ${data.settings.appLockEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.settings.appLockEnabled ? 'right-1' : 'left-1'}`}></div>
          </button>
        </div>

        {showLockSetup && (
          <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-[2.5rem] border border-blue-200 dark:border-blue-900/50 space-y-5 animate-in slide-in-from-top-2 shadow-inner">
            <SubHeading className="text-center mb-1 text-blue-600">Set 4-Digit PIN</SubHeading>
            <div className="grid grid-cols-2 gap-4">
               <Input 
                type="password" 
                maxLength={4} 
                placeholder="New PIN" 
                value={newPin} 
                onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0,4))} 
                className="text-center text-lg !py-4 tracking-widest placeholder:text-[10px] placeholder:tracking-normal" 
               />
               <Input 
                type="password" 
                maxLength={4} 
                placeholder="Confirm" 
                value={confirmPin} 
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0,4))} 
                className="text-center text-lg !py-4 tracking-widest placeholder:text-[10px] placeholder:tracking-normal" 
               />
            </div>

            <div className={`space-y-1 pt-2 transition-all ${!dob ? 'ring-2 ring-rose-500/20 bg-rose-50/10 dark:bg-rose-900/5 p-4 rounded-3xl' : ''}`}>
              <div className="flex flex-col gap-0.5 ml-1">
                <label className={`text-[10px] font-black uppercase tracking-widest ${!dob ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                  DATE OF BIRTH (SECURITY KEY)
                </label>
                {!dob && <span className="text-rose-600 text-[9px] font-black uppercase tracking-tight">MANDATORY FOR LOCK</span>}
              </div>
              <Input 
                ref={dobInputRef}
                type="date" 
                value={dob} 
                max={todayStr}
                onChange={e => { setDob(e.target.value); onUpdateProfile({...data.profile, dob: e.target.value}); }} 
                className={!dob ? 'border-rose-400 animate-pulse' : ''}
              />
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-tight ml-2">Used for PIN recovery if forgotten</p>
            </div>

            {pinError && <p className="text-[10px] font-black text-rose-500 text-center uppercase leading-tight animate-pulse">{pinError}</p>}
            <Button onClick={handleLockSetup} className="w-full uppercase tracking-widest text-[10px] py-4">Enable Lock</Button>
            <button onClick={() => setShowLockSetup(false)} className="w-full py-1 text-[10px] text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Cancel</button>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-xl flex items-center justify-center"><i className={`fa-solid ${data.settings.theme === 'dark' ? 'fa-moon' : 'fa-sun'}`}></i></div>
            <div className="text-sm font-black text-slate-700 dark:text-slate-200">Dark Mode</div>
          </div>
          <button onClick={() => onUpdateSettings({ ...data.settings, theme: data.settings.theme === 'light' ? 'dark' : 'light' })} className={`w-12 h-6 rounded-full transition-all relative ${data.settings.theme === 'dark' ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.settings.theme === 'dark' ? 'right-1' : 'left-1'}`}></div>
          </button>
        </div>
      </Card>

      <div className="px-2 pt-4">
        <button onClick={() => setShowResetModal(true)} className="w-full py-5 bg-white dark:bg-slate-900/40 text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-3xl border border-rose-100 dark:border-rose-900/30 active:scale-95 transition-all shadow-sm">
          <i className="fa-solid fa-trash-can"></i> WIPE ALL APP DATA
        </button>
      </div>

      <ConfirmModal 
        isOpen={showResetModal} 
        onClose={() => setShowResetModal(false)} 
        onConfirm={onResetData} 
        title="Wipe Data?" 
        message="This will permanently delete all records on this device." 
      />
      
      <ConfirmModal 
        isOpen={showImportModal} 
        onClose={() => { setShowImportModal(false); setImportFile(null); }} 
        onConfirm={() => { if(importFile) onImportData(importFile); setShowImportModal(false); setImportFile(null); }} 
        title="Restore Backup?" 
        message="This will overwrite your current data with the selected backup file. This cannot be undone." 
      />
    </div>
  );
};

export default ProfileSection;
