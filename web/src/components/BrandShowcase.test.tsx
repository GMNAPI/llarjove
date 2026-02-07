import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrandShowcase } from './BrandShowcase';

describe('BrandShowcase', () => {
  it('renders without crashing', () => {
    render(<BrandShowcase />);
    expect(screen.getByText('LlarJove')).toBeInTheDocument();
  });

  it('has a Color Palette section', () => {
    render(<BrandShowcase />);
    expect(screen.getByText('Color Palette')).toBeInTheDocument();
  });

  it('has a Typography Scale section', () => {
    render(<BrandShowcase />);
    expect(screen.getByText('Typography Scale')).toBeInTheDocument();
  });

  it('has a Buttons section', () => {
    render(<BrandShowcase />);
    expect(screen.getByText('Buttons')).toBeInTheDocument();
  });

  it('has a Badges section', () => {
    render(<BrandShowcase />);
    expect(screen.getByText('Badges')).toBeInTheDocument();
  });

  it('has an Input section', () => {
    render(<BrandShowcase />);
    expect(screen.getByText('Input')).toBeInTheDocument();
  });

  it('has a Card section', () => {
    render(<BrandShowcase />);
    expect(screen.getByText('Card')).toBeInTheDocument();
  });

  it('has a Links section', () => {
    render(<BrandShowcase />);
    expect(screen.getByText('Links')).toBeInTheDocument();
  });
});
