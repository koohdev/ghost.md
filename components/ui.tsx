import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../utils';
import { Check, X, Palette, ChevronDown } from 'lucide-react';

// --- Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'cyber';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-[#181a1f]',
      secondary: 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] text-white',
      ghost: 'bg-transparent hover:bg-[var(--bg-tertiary)] text-[var(--fg-primary)]',
      cyber: 'bg-[#0aff0a] hover:bg-[#08cc08] text-black font-bold shadow-[0_0_10px_rgba(10,255,10,0.3)]',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 text-lg',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-sm transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-[var(--accent-primary)] disabled:opacity-50 disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// --- Theme Toggle ---
export const ThemeToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('gruvbox');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ghost-md-theme') || 'gruvbox';
    setCurrentTheme(saved);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (theme: string) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ghost-md-theme', theme);
    setCurrentTheme(theme);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-sm hover:bg-[var(--bg-tertiary)] text-[var(--fg-primary)] transition-colors text-xs font-medium"
        title="Change Color Theme"
      >
        <Palette className="w-4 h-4 text-[var(--accent-primary)]" />
        <span className="hidden sm:inline">
          {currentTheme === 'gruvbox' ? 'Gruvbox Dark' : 'One Dark Pro'}
        </span>
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-md shadow-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 text-[10px] font-bold text-[var(--fg-secondary)] uppercase tracking-wider">
            Select Theme
          </div>
          
          <button
            onClick={() => handleThemeChange('gruvbox')}
            className={cn(
              "w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-[var(--accent-primary)] hover:text-[#181a1f] transition-colors",
              currentTheme === 'gruvbox' ? "bg-[var(--bg-tertiary)] text-[var(--fg-primary)]" : "text-[var(--fg-secondary)]"
            )}
          >
            <span>Gruvbox Dark</span>
            {currentTheme === 'gruvbox' && <Check className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => handleThemeChange('one-dark')}
            className={cn(
              "w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-[var(--accent-primary)] hover:text-[#181a1f] transition-colors",
              currentTheme === 'one-dark' ? "bg-[var(--bg-tertiary)] text-[var(--fg-primary)]" : "text-[var(--fg-secondary)]"
            )}
          >
            <span>One Dark Pro</span>
            {currentTheme === 'one-dark' && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
};

// --- Toast System ---
type ToastType = 'success' | 'error' | 'info';

interface ToastEvent {
  id: string;
  message: string;
  type: ToastType;
}

const listeners: ((toasts: ToastEvent[]) => void)[] = [];
let toasts: ToastEvent[] = [];

export const toast = {
  show: (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { id, message, type };
    toasts = [...toasts, newToast];
    listeners.forEach((l) => l(toasts));
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      listeners.forEach((l) => l(toasts));
    }, 3000);
  },
  success: (msg: string) => toast.show(msg, 'success'),
  error: (msg: string) => toast.show(msg, 'error'),
};

export const Toaster = () => {
  const [activeToasts, setActiveToasts] = useState<ToastEvent[]>([]);

  useEffect(() => {
    const handler = (t: ToastEvent[]) => setActiveToasts(t);
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
      {activeToasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-2 px-4 py-3 rounded shadow-lg border-l-4 min-w-[300px] animate-in slide-in-from-right-full fade-in duration-300',
            t.type === 'success' ? 'bg-[var(--bg-secondary)] border-[#0aff0a] text-white' :
            t.type === 'error' ? 'bg-[var(--bg-secondary)] border-red-500 text-white' :
            'bg-[var(--bg-secondary)] border-[var(--accent-primary)] text-white'
          )}
        >
          {t.type === 'success' && <Check className="w-4 h-4 text-[#0aff0a]" />}
          {t.type === 'error' && <X className="w-4 h-4 text-red-500" />}
          <span className="text-sm font-medium">{t.message}</span>
        </div>
      ))}
    </div>
  );
};