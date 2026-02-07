import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders with children', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText('Default').className).toContain('bg-primary');
  });

  it('applies secondary variant', () => {
    render(<Badge variant="secondary">Info</Badge>);
    expect(screen.getByText('Info').className).toContain('bg-secondary');
  });

  it('applies outline variant', () => {
    render(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline').className).toContain('border');
  });

  it('applies destructive variant', () => {
    render(<Badge variant="destructive">Error</Badge>);
    expect(screen.getByText('Error').className).toContain('bg-destructive');
  });

  it('uses text-xs size', () => {
    render(<Badge>Small</Badge>);
    expect(screen.getByText('Small').className).toContain('text-xs');
  });

  it('uses rounded-sm', () => {
    render(<Badge>Round</Badge>);
    expect(screen.getByText('Round').className).toContain('rounded-sm');
  });

  it('merges custom className', () => {
    render(<Badge className="ml-2">Custom</Badge>);
    expect(screen.getByText('Custom').className).toContain('ml-2');
  });
});
