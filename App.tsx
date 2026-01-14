import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from './hooks/useFinance.ts';
import { ViewType, UserSettings, FinancialReminder, NotificationEntry } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import IncomeSection from './components/IncomeSection.tsx';
import ExpenseSection from './components/ExpenseSection.tsx';
import LiabilitiesSection from './components/LiabilitiesSection.tsx';
import ProfileSection from './components/ProfileSection.tsx';
import OnboardingFlow from './components/OnboardingFlow.tsx';
import ChitSavingsSection from './components/ChitSavingsSection.tsx';
import { Heading, Card, CelebrationOverlay, Button, Input, SubHeading } from './components/Shared.tsx';
import { getLoanStatus, getBorrowedStatus } from './utils.ts';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLocked, setIsLocked] = useState(false);
  const [pinEntry, setPinEntry] = useState('');
  const [pinError, setPinError] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryDob, setRecoveryDob] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [celebration, setCelebration] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [notificationTab, setNotificationTab] = useState<'alerts' | 'history'>('alerts');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const scrollContainerRef = useRef<HTMLElement>(null);

  const { 
    data, 
    isHydrated,
    totals, 
    remainingBalance, 
    updateProfile,
    updateSettings,
    addCustomIncomeCategory,
    addCustomExpenseCategory,
    addCustomReminderCategory,
    resetData,
    clearNotificationHistory,
    importData,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense, 
    addLoan, updateLoan, deleteLoan, 
    addBorrowed, updateBorrowed, deleteBorrowed,
    addReminder, updateReminder, deleteReminder, markReminderAsPaid,
    addChitFund, updateChitFund, deleteChitFund, addChitEntry, updateChitEntry, deleteChitEntry,
    addOtherSaving, updateOtherSaving, deleteOtherSaving, addSavingEntry, deleteSavingEntry
  } = useFinance();

  const theme = data.settings.theme || 'light';
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const triggeredReminders = data.reminders.filter(r => !r.isCompleted && r.reminderDate <= todayStr);
  const systemAlerts: any[] = [];
  data.loans.forEach(loan => {
    if (!getLoanStatus(loan).isCurrentMonthPaid) systemAlerts.push({ title: `Loan EMI: ${loan.name}`, type: 'Loan' });
  });
  data.borrowed.forEach(b => {
    if (getBorrowedStatus(b).remainingBalance > 0) systemAlerts.push({ title: `Debt: ${b.personName}`, type: 'Debt' });
  });

  const totalNotifications = triggeredReminders.length + systemAlerts.length;

  useEffect(() => {
    const handleUpdate = () => setShowUpdateToast(true);
    window.addEventListener('sw-update-available', handleUpdate);
    return () => window.removeEventListener('sw-update-available', handleUpdate);
  }, []);

  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) setIsKeyboardVisible(true);
    };
    const handleFocusOut = () => setTimeout(() => {
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) setIsKeyboardVisible(false);
    }, 100);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);
    return () => {
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  useEffect(() => { if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0; }, [activeView]);
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    if (isHydrated && data.settings.hasCompletedOnboarding && data.settings.appLockEnabled && data.settings.appLockPin) {
      setIsLocked(true);
    }
  }, [isHydrated, data.settings.hasCompletedOnboarding]);

  const handleUnlock = () => {
    setPinError('');
    if (pinEntry === data.settings.appLockPin) { 
      setIsLocked(false); 
      setPinEntry(''); 
    } else { 
      setPinError('Incorrect PIN entered.');
      setPinEntry(''); 
    }
  };

  const handleRecovery = () => {
    setRecoveryError('');
    if (data.profile.dob && recoveryDob === data.profile.dob) {
      setIsLocked(false);
      setRecoveryMode(false);
      setPinEntry('');
      setRecoveryDob('');
      alert('Security key verified. App unlocked.');
    } else {
      setRecoveryError('Verification failed. Incorrect Date of Birth entered.');
    }
  };

  const onToggleTheme = () => updateSettings({ ...data.settings, theme: theme === 'light' ? 'dark' : 'light' });
  const triggerCelebration = (message: string) => setCelebration({ isOpen: true, message });

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard': return <Dashboard data={data} totals={totals} remainingBalance={remainingBalance} borrowed={data.borrowed} reminders={data.reminders} onViewAlerts={() => { setShowNotificationCenter(true); setNotificationTab('alerts'); }} onToggleTheme={onToggleTheme} onNavigate={setActiveView} />;
      case 'income': return <IncomeSection incomes={data.incomes} customCategories={data.settings.customIncomeCategories} onAdd={addIncome} onUpdate={updateIncome} onDelete={deleteIncome} onAddCustomCategory={addCustomIncomeCategory} />;
      case 'expenses': return <ExpenseSection expenses={data.expenses} customCategories={data.settings.customExpenseCategories} onAdd={addExpense} onUpdate={updateExpense} onDelete={deleteExpense} onAddCustomCategory={addCustomExpenseCategory} />;
      case 'loans': return <LiabilitiesSection loans={data.loans} borrowed={data.borrowed} onAddLoan={addLoan} onUpdateLoan={updateLoan} onDeleteLoan={deleteLoan} onAddBorrowed={addBorrowed} onUpdateBorrowed={updateBorrowed} onDeleteBorrowed={deleteBorrowed} onCelebrate={triggerCelebration} />;
      case 'chits': return <ChitSavingsSection chitFunds={data.chitFunds} otherSavings={data.otherSavings} onAddChit={addChitFund} onUpdateChit={updateChitFund} onDeleteChit={deleteChitFund} onAddChitEntry={addChitEntry} onUpdateChitEntry={updateChitEntry} onDeleteChitEntry={deleteChitEntry} onAddSaving={addOtherSaving} onUpdateSaving={updateOtherSaving} onDeleteSaving={deleteOtherSaving} onAddSavingEntry={addSavingEntry} onDeleteSavingEntry={deleteSavingEntry} />;
      case 'profile': return <ProfileSection data={data} onUpdateProfile={updateProfile} onUpdateSettings={updateSettings} onResetData={() => { resetData(); setActiveView('dashboard'); }} onImportData={importData} onAddReminder={addReminder} onUpdateReminder={updateReminder} onDeleteReminder={deleteReminder} onMarkPaid={markReminderAsPaid} onAddCustomCategory={addCustomReminderCategory} />;
      default: return null;
    }
  };

  if (!isHydrated) return <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="animate-pulse text-blue-600 font-black">L O A D I N G . . .</div></div>;
  if (!data.settings.hasCompletedOnboarding) return <OnboardingFlow currentSettings={data.settings} onComplete={(profile, settings) => { updateProfile(profile); updateSettings(settings); }} />;
  
  if (isLocked) return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-8 transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950' : 'bg-blue-600'}`}>
      <div className="w-20 h-20 bg-white/20 rounded-[2.5rem] flex items-center justify-center text-white text-4xl mb-8 backdrop-blur-xl border border-white/30 shadow-2xl"><i className="fa-solid fa-lock"></i></div>
      <Heading className="text-white text-2xl font-black mb-8 text-center uppercase tracking-tight">{recoveryMode ? 'Verification' : 'Locked'}</Heading>
      
      {!recoveryMode ? (
        <div className="w-full max-w-xs space-y-6">
          <div className="space-y-2">
            <input 
              type="password" 
              placeholder="••••" 
              value={pinEntry} 
              autoFocus 
              maxLength={4} 
              onChange={e => { setPinEntry(e.target.value.replace(/\D/g, '').slice(0,4)); setPinError(''); }} 
              className={`w-full bg-white/10 border ${pinError ? 'border-rose-400 animate-shake' : 'border-white/30'} rounded-3xl px-6 py-6 text-white text-4xl text-center font-black tracking-[0.5em] outline-none backdrop-blur-md transition-all`} 
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()} 
            />
            {pinError && <p className="text-center text-rose-300 text-[10px] font-black uppercase tracking-widest animate-pulse">{pinError}</p>}
          </div>
          <button onClick={handleUnlock} className="w-full py-5 bg-white text-blue-600 font-black rounded-3xl active:scale-95 transition-all text-xs uppercase tracking-widest shadow-xl">UNLOCK</button>
          <button onClick={() => { setRecoveryMode(true); setPinError(''); setPinEntry(''); }} className="w-full text-white/60 font-black text-[10px] uppercase tracking-widest mt-4">Forgot PIN?</button>
        </div>
      ) : (
        <div className="w-full max-w-xs space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <SubHeading className="text-white/60 text-center">Your Date of Birth</SubHeading>
              <input 
                type="date" 
                value={recoveryDob} 
                max={todayStr}
                onChange={e => { setRecoveryDob(e.target.value); setRecoveryError(''); }} 
                className={`w-full bg-white/10 border ${recoveryError ? 'border-rose-400' : 'border-white/30'} rounded-3xl px-6 py-4 text-white font-black text-center outline-none backdrop-blur-md transition-all`} 
              />
              <p className="text-[8px] text-center text-white/40 font-black uppercase tracking-tight mt-1">Verification key set during app setup</p>
            </div>
            {recoveryError && <p className="text-center text-rose-300 text-[10px] font-black uppercase tracking-widest animate-pulse leading-relaxed px-4">{recoveryError}</p>}
          </div>
          <button onClick={handleRecovery} className="w-full py-5 bg-emerald-500 text-white font-black rounded-3xl active:scale-95 transition-all text-xs uppercase tracking-widest shadow-xl">VERIFY IDENTITY</button>
          <button onClick={() => { setRecoveryMode(false); setRecoveryError(''); setRecoveryDob(''); }} className="w-full text-white/60 font-black text-[10px] uppercase tracking-widest">Back to Pin Entry</button>
        </div>
      )}
    </div>
  );

  return (
    <div className={`h-screen bg-slate-50 dark:bg-slate-950 flex flex-col max-w-md mx-auto relative overflow-hidden transition-colors duration-500`}>
      {showUpdateToast && (
        <div className="absolute top-16 left-6 right-6 z-[100] bg-blue-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <span className="text-xs font-bold">New update available!</span>
          <button onClick={() => window.location.reload()} className="bg-white text-blue-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase">REFRESH</button>
        </div>
      )}

      <CelebrationOverlay isOpen={celebration.isOpen} onClose={() => setCelebration({ ...celebration, isOpen: false })} message={celebration.message} />
      
      {showNotificationCenter && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="absolute inset-x-0 top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 rounded-b-[2.5rem] shadow-2xl animate-in slide-in-from-top duration-300 max-h-[85vh] overflow-y-auto pb-8">
            <div className="px-6 py-6 flex items-center justify-between sticky top-0 bg-inherit z-20">
              <Heading className="text-xl font-black">Notification Hub</Heading>
              <button onClick={() => setShowNotificationCenter(false)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center active:scale-90 transition-all"><i className="fa-solid fa-xmark"></i></button>
            </div>
            <div className="px-6 mb-6">
               <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <button onClick={() => setNotificationTab('alerts')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${notificationTab === 'alerts' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>Alerts ({totalNotifications})</button>
                  <button onClick={() => setNotificationTab('history')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${notificationTab === 'history' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}>Past Activity</button>
               </div>
            </div>
            <div className="px-6 space-y-6">
              {notificationTab === 'alerts' ? (
                totalNotifications === 0 ? (
                  <div className="text-center py-12"><p className="text-slate-400 font-black text-sm uppercase">No pending alerts!</p></div>
                ) : (
                  <>
                    {triggeredReminders.length > 0 && <NotificationGroup title="REMINDERS" items={triggeredReminders} color="rose" onClick={() => { setActiveView('profile'); setShowNotificationCenter(false); }} />}
                    {systemAlerts.length > 0 && <NotificationGroup title="SYSTEM ALERTS" items={systemAlerts} color="indigo" onClick={() => { setActiveView('loans'); setShowNotificationCenter(false); }} />}
                  </>
                )
              ) : (
                <div className="space-y-4">
                  {data.notificationHistory.map((entry) => (
                    <div key={entry.id} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0"><i className="fa-solid fa-info-circle"></i></div>
                      <div className="flex-1">
                        <p className="text-[11px] font-black uppercase">{entry.title}</p>
                        <p className="text-[10px] text-slate-500 mt-1">{entry.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="flex-none sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2" onClick={() => setActiveView('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><i className="fa-solid fa-wallet"></i></div>
          <span className="text-xl font-black tracking-tight text-blue-600 dark:text-white">Local Ledger</span>
        </div>
        <div className="flex items-center gap-2">
          {!isOnline && <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold">OFFLINE</div>}
          <button onClick={() => setShowNotificationCenter(true)} className="relative w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400">
            <i className="fa-solid fa-bell"></i>
            {totalNotifications > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center">{totalNotifications}</span>}
          </button>
          <button onClick={() => setActiveView('profile')} className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-2 ${activeView === 'profile' ? 'border-blue-600' : 'border-slate-100 dark:border-slate-800'}`}>
            {data.profile.profileImage ? <img src={data.profile.profileImage} className="w-full h-full object-cover" /> : <i className="fa-solid fa-user text-slate-400"></i>}
          </button>
        </div>
      </header>

      <main ref={scrollContainerRef} className={`flex-1 overflow-y-auto px-6 pt-6 relative ${!isKeyboardVisible ? 'pb-24' : 'pb-6'}`}>
        <div key={activeView} className="animate-screen-entry">{renderContent()}</div>
      </main>

      {!isKeyboardVisible && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-around items-center px-2 py-3 safe-bottom z-50">
          <NavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon="fa-house-chimney" label="HOME" />
          <NavItem active={activeView === 'income'} onClick={() => setActiveView('income')} icon="fa-circle-plus" label="INFLOW" />
          <NavItem active={activeView === 'expenses'} onClick={() => setActiveView('expenses')} icon="fa-receipt" label="BILLS" />
          <NavItem active={activeView === 'chits'} onClick={() => setActiveView('chits')} icon="fa-sack-dollar" label="SAVINGS" />
          <NavItem active={activeView === 'loans'} onClick={() => setActiveView('loans')} icon="fa-building-columns" label="LIABILITIES" />
        </nav>
      )}
    </div>
  );
};

const NotificationGroup = ({ title, items, color, onClick }: any) => (
  <div className="space-y-2">
    <p className={`text-[10px] font-black tracking-widest uppercase ml-2 ${color === 'rose' ? 'text-rose-500' : 'text-indigo-500'}`}>{title}</p>
    {items.map((item: any, i: number) => (
      <div key={i} onClick={item.onClick || onClick} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between cursor-pointer">
        <span className="text-xs font-bold">{item.title}</span>
        <i className="fa-solid fa-chevron-right text-slate-300 text-[10px]"></i>
      </div>
    ))}
  </div>
);

const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
    <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'bg-transparent'}`}><i className={`fa-solid ${icon} ${active ? 'text-lg' : 'text-xl'}`}></i></div>
    <span className={`text-[8px] font-black tracking-tighter uppercase ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default App;