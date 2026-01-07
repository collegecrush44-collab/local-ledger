import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from './hooks/useFinance.ts';
import { ViewType, UserSettings } from './types.ts';
import Dashboard from './components/Dashboard.tsx';
import IncomeSection from './components/IncomeSection.tsx';
import ExpenseSection from './components/ExpenseSection.tsx';
import LiabilitiesSection from './components/LiabilitiesSection.tsx';
import RemindersSection from './components/RemindersSection.tsx';
import ProfileSection from './components/ProfileSection.tsx';
import OnboardingFlow from './components/OnboardingFlow.tsx';
import ChitSavingsSection from './components/ChitSavingsSection.tsx';
import { Heading, CelebrationOverlay } from './components/Shared.tsx';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLocked, setIsLocked] = useState(false);
  const [pinEntry, setPinEntry] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const scrollContainerRef = useRef<HTMLElement>(null);
  
  const [celebration, setCelebration] = useState<{show: boolean, title: string, message: string}>({
    show: false,
    title: '',
    message: ''
  });

  const { 
    data, totals, selectedMonth, setSelectedMonth, remainingBalance, 
    updateProfile, updateSettings, resetData, importData,
    addIncome, updateIncome, deleteIncome,
    addExpense, updateExpense, deleteExpense, 
    addLoan, updateLoan, deleteLoan, toggleLoanMonthPaid,
    addBorrowed, updateBorrowed, deleteBorrowed,
    addReminder, updateReminder, deleteReminder, markReminderAsPaid,
    addChitFund, updateChitFund, deleteChitFund, addChitEntry, updateChitEntry, deleteChitEntry,
    addOtherSaving, updateOtherSaving, deleteOtherSaving, addSavingEntry, deleteSavingEntry,
    addCustomIncomeCategory, addCustomExpenseCategory, addCustomReminderType
  } = useFinance();

  const theme = data.settings.theme || 'light';
  const todayStr = new Date().toISOString().slice(0, 10);
  const urgentRemindersCount = data.reminders.filter(r => !r.isCompleted && r.dueDate <= todayStr).length;

  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [activeView]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsInputFocused(true);
      }
    };
    const handleBlur = () => {
      setTimeout(() => {
        const active = document.activeElement;
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA')) {
          setIsInputFocused(false);
        }
      }, 50);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);

    if (data.settings.hasCompletedOnboarding && data.settings.appLockEnabled && data.settings.appLockPin) {
      setIsLocked(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, [data.settings.hasCompletedOnboarding]);

  const handleUnlock = () => {
    if (pinEntry === data.settings.appLockPin) {
      setIsLocked(false);
      setPinEntry('');
    } else {
      setPinEntry('');
    }
  };

  const triggerCelebration = (title: string, message: string) => {
    setCelebration({ show: true, title, message });
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard data={data} totals={totals} remainingBalance={remainingBalance} selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} borrowed={data.borrowed} reminders={data.reminders} onViewAlerts={() => setActiveView('reminders')} onNavigate={setActiveView} />;
      case 'income':
        return <IncomeSection incomes={data.incomes} selectedMonth={selectedMonth} customCategories={data.settings.customIncomeCategories} onAdd={addIncome} onUpdate={updateIncome} onDelete={deleteIncome} onAddCustomCategory={addCustomIncomeCategory} />;
      case 'expenses':
        return <ExpenseSection expenses={data.expenses} selectedMonth={selectedMonth} customCategories={data.settings.customExpenseCategories} onAdd={addExpense} onUpdate={updateExpense} onDelete={deleteExpense} onAddCustomCategory={addCustomExpenseCategory} />;
      case 'loans':
        return <LiabilitiesSection loans={data.loans} borrowed={data.borrowed} onAddLoan={addLoan} onUpdateLoan={updateLoan} onDeleteLoan={deleteLoan} onToggleLoanMonthPaid={toggleLoanMonthPaid} onAddBorrowed={addBorrowed} onUpdateBorrowed={updateBorrowed} onDeleteBorrowed={deleteBorrowed} onComplete={triggerCelebration} />;
      case 'reminders':
        return <RemindersSection reminders={data.reminders} loans={data.loans} borrowed={data.borrowed} customTypes={data.settings.customReminderTypes} onAdd={addReminder} onUpdate={updateReminder} onDelete={deleteReminder} onMarkPaid={markReminderAsPaid} onAddCustomType={addCustomReminderType} />;
      case 'chits':
        return <ChitSavingsSection chitFunds={data.chitFunds} otherSavings={data.otherSavings} onAddChit={addChitFund} onUpdateChit={updateChitFund} onDeleteChit={deleteChitFund} onAddChitEntry={addChitEntry} onUpdateChitEntry={updateChitEntry} onDeleteChitEntry={deleteChitEntry} onAddSaving={addOtherSaving} onUpdateSaving={updateOtherSaving} onDeleteSaving={deleteOtherSaving} onAddSavingEntry={addSavingEntry} onDeleteSavingEntry={deleteSavingEntry} onComplete={triggerCelebration} />;
      case 'profile':
        return <ProfileSection data={data} onUpdateProfile={updateProfile} onUpdateSettings={updateSettings} onResetData={() => { resetData(); setActiveView('dashboard'); }} onImportData={importData} />;
      default:
        return null;
    }
  };

  if (!data.settings.hasCompletedOnboarding) {
    return <OnboardingFlow currentSettings={data.settings} onComplete={(p, s) => { updateProfile(p); updateSettings(s); }} />;
  }

  if (isLocked) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-8 transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-950' : 'bg-blue-600'}`}>
        <div className="w-20 h-20 bg-white/20 rounded-[2.5rem] flex items-center justify-center text-white text-4xl mb-8 backdrop-blur-xl border border-white/30 shadow-2xl animate-pulse-subtle"><i className="fa-solid fa-lock"></i></div>
        <Heading className="text-white text-3xl font-black mb-2 tracking-tight">App Locked</Heading>
        <div className="w-full max-w-xs space-y-6">
          <input type="password" placeholder="••••" value={pinEntry} autoFocus onChange={e => setPinEntry(e.target.value)} className="w-full bg-white/10 border border-white/30 rounded-3xl px-6 py-6 text-white text-4xl text-center font-black tracking-[0.5em] outline-none" />
          <button onClick={handleUnlock} className="w-full py-5 bg-white text-blue-600 font-black rounded-3xl shadow-2xl active:scale-95 transition-all text-xs uppercase tracking-[0.2em]">UNLOCK</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen bg-slate-50 dark:bg-slate-950 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-x-hidden transition-colors`}>
      <CelebrationOverlay isOpen={celebration.show} onClose={() => setCelebration(prev => ({ ...prev, show: false }))} title={celebration.title} message={celebration.message} />
      
      <header className="flex-none sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2" onClick={() => setActiveView('dashboard')} style={{ cursor: 'pointer' }}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg"><i className="fa-solid fa-wallet"></i></div>
          <span className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Local Ledger</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`}></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{isOnline ? 'SAFE' : 'OFFLINE'}</span>
          </div>
          <button onClick={() => setActiveView('reminders')} className={`w-10 h-10 rounded-full flex items-center justify-center relative ${activeView === 'reminders' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}><i className={`fa-solid fa-bell ${urgentRemindersCount > 0 ? 'animate-bell' : ''}`}></i>{urgentRemindersCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 border-2 border-white rounded-full"></span>}</button>
          <button onClick={() => setActiveView('profile')} className={`w-10 h-10 rounded-full flex items-center justify-center ${activeView === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}><i className="fa-solid fa-user"></i></button>
        </div>
      </header>
      <main ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 pt-6 pb-24 relative">
        <div key={activeView} className="animate-screen-entry">{renderContent()}</div>
      </main>

      {!isInputFocused && (
        <nav className="flex-none fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-around items-center px-2 py-3 safe-bottom z-50 transition-all duration-300 transform translate-y-0 opacity-100">
          <NavItem active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} icon="fa-house-chimney" label="HOME" />
          <NavItem active={activeView === 'income'} onClick={() => setActiveView('income')} icon="fa-circle-plus" label="INFLOW" />
          <NavItem active={activeView === 'expenses'} onClick={() => setActiveView('expenses')} icon="fa-receipt" label="BILLS" />
          <NavItem active={activeView === 'chits'} onClick={() => setActiveView('chits')} icon="fa-sack-dollar" label="SAVINGS" />
          <NavItem active={activeView === 'loans'} onClick={() => setActiveView('loans')} icon="fa-building-columns" label="LOANS" />
        </nav>
      )}
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
    <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform ${active ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-transparent scale-100'}`}><i className={`fa-solid ${icon} ${active ? 'text-lg' : 'text-xl'}`}></i></div>
    <span className={`text-[8px] font-black tracking-tighter uppercase ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
  </button>
);

export default App;