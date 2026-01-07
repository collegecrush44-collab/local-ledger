import React, { useEffect, useState, useRef } from 'react';

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm dark:shadow-none border border-slate-100 dark:border-slate-800/60 p-5 ${className}`}>
    {children}
  </div>
);

export const Heading: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <h2 className={`text-xl font-bold text-slate-800 dark:text-slate-100 ${className}`}>{children}</h2>
);

export const SubHeading: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <h3 className={`text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${className}`}>{children}</h3>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & { hasError?: boolean }> = ({ hasError, ...props }) => {
  const isTextArea = (props as any).type === undefined && props.children === undefined && (props as any).rows !== undefined;
  
  const className = `w-full bg-slate-100 dark:bg-slate-800/60 border-none rounded-[1.25rem] px-5 py-4 text-slate-900 dark:text-slate-100 font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${hasError ? 'animate-shake ring-2 ring-rose-500/50' : ''} ${props.className || ''}`;

  if (isTextArea) {
    return <textarea {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} className={className} />;
  }
  return <input {...(props as React.InputHTMLAttributes<HTMLInputElement>)} className={className} />;
};

export const Button: React.FC<{ 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'danger' | 'secondary',
  className?: string,
  type?: 'button' | 'submit',
  isLoading?: boolean,
  isSuccess?: boolean
}> = ({ children, onClick, variant = 'primary', className = '', type = 'button', isSuccess }) => {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 dark:shadow-none',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20 dark:shadow-none',
    secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent dark:border-slate-700/50'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${isSuccess ? 'bg-emerald-500 text-white shadow-emerald-500/20' : styles[variant]} ${className}`}
    >
      {isSuccess ? <i className="fa-solid fa-check animate-coin"></i> : children}
    </button>
  );
};

export const CountUp: React.FC<{ value: number, prefix?: string }> = ({ value, prefix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const countRef = useRef<number>(0);
  const duration = 1000; // ms

  useEffect(() => {
    let startTimestamp: number | null = null;
    const endValue = value;
    const startValue = countRef.current;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = Math.floor(progress * (endValue - startValue) + startValue);
      setDisplayValue(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        countRef.current = endValue;
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(displayValue);

  return <span>{prefix}{formatted}</span>;
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
              Delete Record
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

export const CelebrationOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}> = ({ isOpen, onClose, title, message }) => {
  const [particles, setParticles] = useState<{ id: number, x: number, color: string, delay: number, size: number }[]>([]);

  useEffect(() => {
    if (isOpen) {
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      const newParticles = Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        size: Math.random() * 10 + 5
      }));
      setParticles(newParticles);
      
      const timer = setTimeout(onClose, 6000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-blue-600/95 dark:bg-slate-950/98 backdrop-blur-xl animate-in fade-in duration-500"></div>
      
      <div className="absolute inset-0 pointer-events-none">
        {particles.map(p => (
          <div 
            key={p.id}
            className="absolute top-[-20px] rounded-full animate-confetti"
            style={{
              left: `${p.x}%`,
              backgroundColor: p.color,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${Math.random() * 2 + 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm text-center animate-in zoom-in fade-in duration-500">
        <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center text-white text-5xl mb-8 mx-auto backdrop-blur-xl border border-white/30 shadow-2xl animate-bounce">
          <i className="fa-solid fa-trophy"></i>
        </div>
        
        <h2 className="text-4xl font-black text-white mb-4 tracking-tight drop-shadow-lg">{title}</h2>
        <p className="text-blue-100 text-lg font-bold leading-relaxed mb-12 px-4 drop-shadow-md">
          {message}
        </p>
        
        <button 
          onClick={onClose}
          className="px-12 py-5 bg-white text-blue-600 font-black rounded-3xl shadow-2xl shadow-blue-900/40 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
        >
          FANTASTIC!
        </button>
      </div>

      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation-name: confetti;
          animation-timing-function: cubic-bezier(.37,0,.63,1);
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
};
