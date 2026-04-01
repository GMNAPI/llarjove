'use client';

import { cn } from '@/lib/cn';

interface ProgressBarProps {
  current: number; // 1-based
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);

  return (
    <div className={cn('w-full', className)} role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Pregunta {current} de {total}
        </span>
        <span className="text-sm text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
