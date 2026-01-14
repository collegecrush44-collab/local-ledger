
import React, { useState } from 'react';
import { Card, Heading, Button, SubHeading } from './Shared.tsx';
import { UserProfile, UserSettings } from '../types.ts';

interface OnboardingFlowProps {
  onComplete: (profile: UserProfile, settings: UserSettings) => void;
  currentSettings: UserSettings;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, currentSettings }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => Math.max(0, prev - 1));

  const handleFinish = () => {
    if (name.trim().length < 3) return;
    onComplete(
      { name: name || 'Guest User' },
      { ...currentSettings, hasCompletedOnboarding: true }
    );
  };

  const steps = [
    // Welcome
    {
      title: "Private. Offline. Simple.",
      content: "Welcome to Local Ledger. Manage your financial life without the cloud, without tracking, and without stress.",
      icon: "fa-wallet",
      color: "bg-blue-600"
    },
    // Privacy & Offline
    {
      title: "100% Offline First",
      content: "No internet? No problem. Local Ledger works entirely without a connection. Your data never leaves this device.",
      icon: "fa-shield-halved",
      color: "bg-emerald-600"
    },
    // Features
    {
      title: "Full Control",
      content: "Track recurring bills, manage bank loans, and keep tabs on money borrowed from friends—all in one place.",
      icon: "fa-chart-pie",
      color: "bg-indigo-600"
    },
    // Registration
    {
      title: "What's your name?",
      content: "We only store this on your phone to personalize your dashboard.",
      icon: "fa-user-tag",
      color: "bg-blue-600",
      isForm: true
    },
    // Crucial Info
    {
      title: "Crucial Information",
      content: "Before we begin, please keep these points in mind:",
      icon: "fa-circle-info",
      color: "bg-amber-500",
      isSummary: true
    }
  ];

  const current = steps[step];
  const isNameValid = name.trim().length >= 3;

  return (
    <div className="fixed inset-0 z-[200] bg-white dark:bg-slate-950 overflow-y-auto safe-bottom">
      <div className="min-h-screen flex flex-col p-8 max-w-md mx-auto">
        
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-800'}`}
            ></div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center text-center animate-screen-entry">
          <div className={`${current.color} w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white text-4xl mb-8 shadow-2xl shadow-blue-900/10 dark:shadow-none`}>
            <i className={`fa-solid ${current.icon}`}></i>
          </div>

          <Heading className="text-3xl font-black mb-4 dark:text-white leading-tight">{current.title}</Heading>
          <p className="text-slate-500 dark:text-slate-400 text-base font-medium leading-relaxed mb-8">
            {current.content}
          </p>

          {current.isForm && (
            <div className="w-full space-y-4">
              <input 
                autoFocus
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-900 border ${!isNameValid && name ? 'border-rose-300' : 'border-slate-200 dark:border-slate-800'} rounded-3xl px-6 py-5 text-slate-900 dark:text-white font-black text-center focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none transition-all`}
              />
              {!isNameValid && name && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest animate-pulse">Name must be at least 3 letters</p>
              )}
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">No email or phone number required</p>
            </div>
          )}

          {current.isSummary && (
            <div className="w-full space-y-3 text-left">
              <InfoItem icon="fa-plane" text="Works completely offline without cloud syncing." />
              <InfoItem icon="fa-mobile-screen" text="All data is stored securely on your local device storage." />
              <InfoItem icon="fa-triangle-exclamation" text="You are responsible for backups via the 'Export' feature." />
              <InfoItem icon="fa-clock" text="Reminders rely on your local device system time." />
              <InfoItem icon="fa-lock" text="Optional PIN & Biometrics available for added privacy." />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-3 mt-12">
          {step < steps.length - 1 ? (
            <button 
              onClick={nextStep}
              className={`w-full py-5 ${current.isForm && !isNameValid ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-xl shadow-blue-500/20 active:scale-95'} font-black rounded-3xl transition-all text-xs uppercase tracking-[0.2em]`}
              disabled={current.isForm && !isNameValid}
            >
              CONTINUE
            </button>
          ) : (
            <button 
              onClick={handleFinish}
              className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
            >
              GET STARTED
            </button>
          )}
          
          {step > 0 && (
            <button 
              onClick={prevStep}
              className="w-full py-4 text-slate-400 dark:text-slate-600 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-400 transition-colors"
            >
              GO BACK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, text }: { icon: string, text: string }) => (
  <div className="flex items-start gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
    <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm shadow-sm flex-shrink-0">
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-normal">{text}</span>
  </div>
);

export default OnboardingFlow;
