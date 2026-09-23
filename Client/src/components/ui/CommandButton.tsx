import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

interface CommandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const CommandButton: React.FC<CommandButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className,
  disabled,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-mono text-xs uppercase tracking-wider rounded-lg transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-sky-400 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-semibold';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs gap-2',
    lg: 'px-5 py-2.5 text-sm gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-blue-600/25 text-sky-300 border border-blue-500/50 hover:bg-blue-600/40 hover:border-sky-400 hover:text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.5)] active:scale-95',
    secondary:
      'bg-slate-800/80 text-slate-200 border border-slate-700 hover:bg-slate-700/80 hover:border-slate-600 active:scale-95',
    danger:
      'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 hover:border-red-400 hover:shadow-[0_0_15px_rgba(239,68,68,0.35)] active:scale-95',
    ghost:
      'text-slate-400 hover:text-slate-200 hover:bg-blue-950/40',
    outline:
      'border border-blue-900/60 text-slate-300 hover:border-sky-400/60 hover:text-sky-300 hover:bg-blue-950/30 active:scale-95',
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
      ) : icon ? (
        <span className="flex items-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

