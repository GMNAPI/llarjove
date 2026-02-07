import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-primary text-white',
  secondary: 'bg-secondary text-foreground',
  outline: 'border border-border bg-transparent text-foreground',
  destructive: 'bg-destructive text-white',
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-medium',
        'transition-colors',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
