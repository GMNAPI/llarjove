'use client';

import { cn } from '@/lib/cn';

interface OptionButtonProps {
  label: string;
  sublabel?: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function OptionButton({ label, sublabel, selected, onClick, disabled }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left rounded-xl border px-5 py-4 transition-all duration-150',
        'min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        selected
          ? 'border-primary bg-primary/10 text-foreground shadow-sm'
          : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary',
      )}
      aria-pressed={selected}
    >
      <span className={cn('block font-medium text-base', selected && 'text-primary')}>{label}</span>
      {sublabel && (
        <span className="block mt-0.5 text-sm text-muted-foreground">{sublabel}</span>
      )}
    </button>
  );
}
