import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { Input } from './Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText('Type here')).toBeInTheDocument();
  });

  it('applies border-input by default', () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId('input').className).toContain('border-input');
  });

  it('applies destructive border on error', () => {
    render(<Input data-testid="input" error />);
    const input = screen.getByTestId('input');
    expect(input.className).toContain('border-destructive');
    expect(input.className).not.toContain('border-input');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');
    await user.type(input, 'hello');
    expect(input).toHaveValue('hello');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('has minimum touch target of 44px', () => {
    render(<Input data-testid="input" />);
    expect(screen.getByTestId('input').className).toContain('min-h-[44px]');
  });

  it('merges custom className', () => {
    render(<Input data-testid="input" className="w-64" />);
    expect(screen.getByTestId('input').className).toContain('w-64');
  });
});
