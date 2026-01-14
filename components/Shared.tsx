
import React, { useEffect, useState } from 'react';

export const CountUp: React.FC<{ value: number, prefix?: string }> = ({ value, prefix = '' }) => {
  const [displayValue, setDisplayValue] = React.useState(0);
  
  React.useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const duration = 1000;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setDisplayValue(Math.floor(progress * (value - startValue) + startValue));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString('en-IN')}</span>;
};

export const CelebrationOverlay: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  message: string;
}> = ({ isOpen, onClose, message }) => {
  const [confetti, setConfetti] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const newConfetti = Array.from({ length: 50 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      }));
      setConfetti(newConfetti);
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-blue-600/90 dark:bg-slate-950/95 backdrop-blur-md overflow-hidden animate-in fade-in duration-300">
      {confetti.map(c => (
        <div 
          key={c.id} 
          className="confetti" 
          style={{ 
            left: `${c.left}%`, 
            backgroundColor: c.color, 
            animationDelay: `${c.delay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
          }}
        />
      ))}
      <div className="relative z-10 text-center animate-pop">
        <div className="w-24 h-24 bg-white text-blue-600 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto mb-8 shadow-2xl">
          <i className="fa-solid fa-trophy"></i>
        </div>
        <h2 className="text-4xl font-black text-white mb-4 tracking-tight uppercase">Goal Achieved!</h2>
        <p className="text-blue-100 text-lg font-bold max-w-xs mx-auto leading-relaxed">{message}</p>
        <button 
          onClick={onClose}
          className="mt-12 px-10 py-4 bg-white text-blue-600 font-black rounded-3xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest"
        >
          GREAT!
        </button>
      </div>
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800/60 p-5 ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </div>
);

export const Heading: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-xl font-bold text-slate-800 dark:text-slate-100 ${className}`}>{children}</h2>
);

export const SubHeading: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${className}`}>{children}</h3>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  error?: string;
  label?: string;
  rows?: number;
}

export const Input: React.FC<InputProps> = ({ error, label, ...props }) => {
  const isTextArea = (props as any).rows !== undefined;
  
  // Standardized height and padding to prevent font clipping of bold text
  const baseClass = `w-full bg-slate-50/50 dark:bg-slate-950/50 border rounded-2xl px-5 py-4 text-slate-900 dark:text-slate-100 font-bold placeholder:text-slate-300 dark:placeholder:text-slate-700 focus:outline-none focus:ring-2 transition-all shadow-inner dark:shadow-none leading-[1.2] min-h-[58px] flex items-center`;
  const stateClass = error 
    ? 'border-rose-500 ring-rose-500/10 focus:ring-rose-500/30' 
    : 'border-slate-100 dark:border-slate-800 focus:ring-blue-500';

  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest ml-1">{label}</label>}
      {isTextArea ? (
        <textarea {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} className={`${baseClass} ${stateClass} ${props.className || ''}`} />
      ) : (
        <input {...(props as React.InputHTMLAttributes<HTMLInputElement>)} className={`${baseClass} ${stateClass} ${props.className || ''}`} />
      )}
      {error && <p className="text-[10px] font-black text-rose-500 uppercase tracking-tight ml-2">{error}</p>}
    </div>
  );
};

export const Button: React.FC<{ 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'danger' | 'secondary',
  className?: string,
  type?: 'button' | 'submit',
  disabled?: boolean
}> = ({ children, onClick, variant = 'primary', className = '', type = 'button', disabled }) => {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 dark:shadow-none',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 dark:shadow-none',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700/50'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export const ConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}></div>
      <div className="relative z-10 w-full max-w-xs bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl dark:shadow-none animate-in zoom-in fade-in duration-200 border dark:border-slate-800/50">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center text-2xl mb-4">
            <i className="fa-solid fa-trash-can"></i>
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
            {message}
          </p>
          <div className="flex flex-col w-full gap-2">
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className="w-full py-3.5 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 active:scale-95 transition-all shadow-lg shadow-rose-100 dark:shadow-none"
            >
              Confirm
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
