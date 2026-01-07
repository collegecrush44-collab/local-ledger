
import React, { useState, useRef, useEffect } from 'react';
import { Card, Heading, Button, SubHeading, ConfirmModal } from './Shared.tsx';
import { UserProfile, UserSettings, FinanceData } from '../types.ts';

interface ProfileSectionProps {
  data: FinanceData;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateSettings: (settings: UserSettings) => void;
  onResetData: () => void;
  onImportData: (data: FinanceData) => void;
}

type PinStep = 'verify' | 'new' | 'confirm';

const ProfileSection: React.FC<ProfileSectionProps> = ({ data, onUpdateProfile, onUpdateSettings, onResetData, onImportData }) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [name, setName] = useState(data.profile.name);
  const [showResetModal, setShowResetModal] = useState(false);
  
  // PIN Modal States
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinStep, setPinStep] = useState<PinStep>('new');
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3) return;
    onUpdateProfile({ name: name.trim() });
    setEditingProfile(false);
  };

  const isNameValid = name.trim().length >= 3;

  const openPinModal = () => {
    setPinError('');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    if (data.settings.appLockPin) {
      setPinStep('verify');
    } else {
      setPinStep('new');
    }
    setShowPinModal(true);
  };

  const handlePinAction = () => {
    setPinError('');
    
    if (pinStep === 'verify') {
      if (currentPinInput === data.settings.appLockPin) {
        setPinStep('new');
      } else {
        setPinError('Incorrect current PIN');
        setCurrentPinInput('');
      }
    } else if (pinStep === 'new') {
      if (newPinInput.length >= 4) {
        setPinStep('confirm');
      } else {
        setPinError('PIN must be at least 4 digits');
      }
    } else if (pinStep === 'confirm') {
      if (confirmPinInput === newPinInput) {
        onUpdateSettings({ ...data.settings, appLockPin: newPinInput, appLockEnabled: true });
        setShowPinModal(false);
        // Reset states
        setCurrentPinInput('');
        setNewPinInput('');
        setConfirmPinInput('');
      } else {
        setPinError('PINs do not match');
        setConfirmPinInput('');
      }
    }
  };

  const toggleAppLock = () => {
    if (!data.settings.appLockEnabled && !data.settings.appLockPin) {
      openPinModal();
    } else {
      onUpdateSettings({ ...data.settings, appLockEnabled: !data.settings.appLockEnabled });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const today = new Date().toISOString().slice(0, 10);
    const exportFileDefaultName = `LocalLedger_Backup_${today}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    // Update last backup date
    onUpdateSettings({ ...data.settings, lastBackupDate: today });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target?.result as string);
          if (importedData.incomes || importedData.expenses) {
            onImportData(importedData);
            alert('Data imported successfully!');
          } else {
            alert('Invalid data format.');
          }
        } catch (error) {
          alert('Error parsing JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const lastBackup = data.settings.lastBackupDate;
  const daysSinceBackup = lastBackup ? Math.floor((new Date().getTime() - new Date(lastBackup).getTime()) / (1000 * 3600 * 24)) : null;

  // Check if there is actual data to back up
  const hasData = 
    data.incomes.length > 0 || 
    data.expenses.length > 0 || 
    data.loans.length > 0 || 
    data.borrowed.length > 0 || 
    data.chitFunds.length > 0 || 
    data.otherSavings.length > 0 ||
    data.reminders.length > 0;

  // Only show warning if data exists and hasn't been backed up recently
  const showBackupWarning = hasData && (!lastBackup || (daysSinceBackup !== null && daysSinceBackup > 7));

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-blue-600 dark:text-blue-400 text-3xl shadow-lg shadow-blue-50 dark:shadow-none border border-blue-200 dark:border-blue-800/40">
          <i className="fa-solid fa-user"></i>
        </div>
        <div>
          <Heading className="text-2xl font-black">{data.profile.name}</Heading>
          {lastBackup && (
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
               Last Backup: {new Date(lastBackup).toLocaleDateString()}
             </div>
          )}
        </div>
      </div>

      {/* Backup Health Warning - Only appears when data exists */}
      {showBackupWarning && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 p-4 rounded-3xl flex items-center gap-4 animate-pulse">
          <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div>
            <div className="text-[11px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-tight">Security Alert</div>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-500/80 font-bold leading-tight">
              {!lastBackup ? "You haven't backed up your data yet." : `It's been ${daysSinceBackup} days since your last backup.`} Export now to keep your data safe.
            </p>
          </div>
        </div>
      )}

      {/* Profile Details Card */}
      <Card className="rounded-[2.5rem] border-none shadow-sm dark:shadow-none p-6">
        <div className="flex justify-between items-center mb-6">
          <SubHeading className="text-[11px] font-black text-slate-400 dark:text-slate-600 tracking-widest">PERSONAL DETAILS</SubHeading>
          <button 
            onClick={() => {
              setEditingProfile(!editingProfile);
              setName(data.profile.name);
            }}
            className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl uppercase tracking-widest transition-colors"
          >
            {editingProfile ? 'CANCEL' : 'EDIT'}
          </button>
        </div>

        {editingProfile ? (
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">Full Name</label>
              <input 
                autoFocus
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-100 font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
              />
              {!isNameValid && (
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1 mt-1">Minimum 3 characters required</p>
              )}
            </div>
            <button 
              type="submit" 
              disabled={!isNameValid}
              className={`w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl dark:shadow-none shadow-blue-100 uppercase tracking-widest text-xs transition-all ${!isNameValid ? 'opacity-40 grayscale' : ''}`}
            >
              Save Changes
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800/60">
              <span className="text-sm font-bold text-slate-400 dark:text-slate-600">Name</span>
              <span className="text-sm font-black text-slate-700 dark:text-slate-200">{data.profile.name}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Security Card */}
      <Card className="rounded-[2.5rem] border-none shadow-sm dark:shadow-none p-6">
        <SubHeading className="text-[11px] font-black text-slate-400 dark:text-slate-600 mb-6 tracking-widest uppercase">SECURITY & PRIVACY</SubHeading>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-lock"></i>
              </div>
              <div>
                <div className="text-sm font-black text-slate-700 dark:text-slate-200">App PIN Lock</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">Require PIN on startup</div>
              </div>
            </div>
            <button 
              onClick={toggleAppLock}
              className={`w-12 h-6 rounded-full transition-all relative ${data.settings.appLockEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.settings.appLockEnabled ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 text-purple-500 dark:text-purple-400 rounded-xl flex items-center justify-center">
                <i className="fa-solid fa-fingerprint"></i>
              </div>
              <div>
                <div className="text-sm font-black text-slate-700 dark:text-slate-200">Biometric Unlock</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">FaceID / Fingerprint</div>
              </div>
            </div>
            <button 
              onClick={() => onUpdateSettings({ ...data.settings, biometricsEnabled: !data.settings.biometricsEnabled })}
              className={`w-12 h-6 rounded-full transition-all relative ${data.settings.biometricsEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.settings.biometricsEnabled ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>

          {(data.settings.appLockEnabled || data.settings.appLockPin) && (
            <button 
              onClick={openPinModal}
              className="w-full py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-colors"
            >
              CHANGE PASSWORD / PIN
            </button>
          )}
        </div>
      </Card>

      {/* Data Management Card */}
      <Card className="rounded-[2.5rem] border-none shadow-sm dark:shadow-none p-6 bg-white dark:bg-slate-900 transition-colors">
        <SubHeading className="text-[11px] font-black text-slate-400 dark:text-slate-600 mb-6 tracking-widest uppercase">DATA MANAGEMENT</SubHeading>
        
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleExport}
            className="flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm dark:shadow-none active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-xl">
              <i className="fa-solid fa-file-export"></i>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Export</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-3 p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[2rem] shadow-sm dark:shadow-none active:scale-95 transition-all"
          >
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center text-xl">
              <i className="fa-solid fa-file-import"></i>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Import</span>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
          </button>
        </div>
      </Card>

      {/* Reset Button */}
      <div className="pt-4 flex justify-center">
        <button 
          onClick={() => setShowResetModal(true)}
          className="px-6 py-2 text-rose-500 font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2 hover:opacity-70 transition-all"
        >
          <i className="fa-solid fa-trash-can"></i>
          RESET ALL APP DATA
        </button>
      </div>

      {/* PIN Setup/Change Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowPinModal(false)}></div>
          <Card className="relative z-10 w-full max-w-xs rounded-[2.5rem] p-8 animate-in zoom-in duration-300 dark:border dark:border-slate-800 shadow-2xl dark:shadow-none">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto">
              <i className="fa-solid fa-key"></i>
            </div>
            
            <Heading className="text-center mb-1">
              {pinStep === 'verify' ? 'Verify Current PIN' : pinStep === 'new' ? 'Enter New PIN' : 'Confirm New PIN'}
            </Heading>
            
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold text-center uppercase tracking-widest mb-6">
              {pinStep === 'verify' ? 'Step 1 of 3' : pinStep === 'new' ? (data.settings.appLockPin ? 'Step 2 of 3' : 'Step 1 of 2') : (data.settings.appLockPin ? 'Step 3 of 3' : 'Step 2 of 2')}
            </p>

            <input 
              type="password"
              placeholder="••••"
              value={pinStep === 'verify' ? currentPinInput : pinStep === 'new' ? newPinInput : confirmPinInput}
              autoFocus
              maxLength={8}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (pinStep === 'verify') setCurrentPinInput(val);
                else if (pinStep === 'new') setNewPinInput(val);
                else setConfirmPinInput(val);
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-5 text-center text-2xl font-black tracking-[0.5em] mb-2 focus:ring-4 focus:ring-blue-50 dark:focus:ring-blue-900/20 outline-none text-slate-900 dark:text-slate-100 transition-all"
            />
            
            {pinError && (
              <p className="text-rose-500 text-[9px] font-black text-center uppercase tracking-widest mb-4 animate-bounce">
                {pinError}
              </p>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowPinModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black rounded-2xl text-[10px] uppercase tracking-widest transition-colors">CANCEL</button>
              <button 
                onClick={handlePinAction} 
                disabled={
                  (pinStep === 'verify' && currentPinInput.length < 4) ||
                  (pinStep === 'new' && newPinInput.length < 4) ||
                  (pinStep === 'confirm' && confirmPinInput.length < 4)
                }
                className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl dark:shadow-none shadow-blue-200 text-[10px] uppercase tracking-widest disabled:opacity-50 transition-all"
              >
                {pinStep === 'confirm' ? 'SAVE PIN' : 'NEXT'}
              </button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmModal 
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={onResetData}
        title="Wipe All Data?"
        message="This will permanently delete all your financial records, profile info, and settings. This cannot be undone."
      />
    </div>
  );
};

export default ProfileSection;
