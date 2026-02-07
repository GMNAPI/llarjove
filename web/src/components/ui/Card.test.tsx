import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from './Card';

describe('Card', () => {
  it('renders with children', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies border and shadow styles', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card.className).toContain('border');
    expect(card.className).toContain('shadow-sm');
    expect(card.className).toContain('rounded-lg');
  });

  it('merges custom className', () => {
    render(<Card className="my-custom">Content</Card>);
    expect(screen.getByText('Content').className).toContain('my-custom');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Card ref={ref}>Content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardHeader', () => {
  it('renders with padding', () => {
    render(<CardHeader data-testid="header">Title</CardHeader>);
    expect(screen.getByTestId('header').className).toContain('p-6');
  });
});

describe('CardContent', () => {
  it('renders with padding and no top padding', () => {
    render(<CardContent data-testid="content">Body</CardContent>);
    const content = screen.getByTestId('content');
    expect(content.className).toContain('p-6');
    expect(content.className).toContain('pt-0');
  });
});

describe('CardFooter', () => {
  it('renders with flex layout', () => {
    render(<CardFooter data-testid="footer">Actions</CardFooter>);
    expect(screen.getByTestId('footer').className).toContain('flex');
  });
});

describe('Card composition', () => {
  it('renders all sub-components together', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
