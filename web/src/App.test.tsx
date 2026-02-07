import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the BrandShowcase', () => {
    render(<App />);
    expect(screen.getByText('LlarJove')).toBeInTheDocument();
    expect(screen.getByText('Brand Identity & Design System')).toBeInTheDocument();
  });
});
