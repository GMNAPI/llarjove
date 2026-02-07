import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { Link } from './Link';

describe('Link', () => {
  it('renders with text and href', () => {
    render(<Link href="/about">About</Link>);
    const link = screen.getByRole('link', { name: 'About' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/about');
  });

  it('applies primary color', () => {
    render(<Link href="/test">Test</Link>);
    expect(screen.getByRole('link').className).toContain('text-primary');
  });

  it('adds hover underline', () => {
    render(<Link href="/test">Test</Link>);
    expect(screen.getByRole('link').className).toContain('hover:underline');
  });

  it('detects external links and adds target/rel', () => {
    render(<Link href="https://example.com">External</Link>);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does not add target for internal links', () => {
    render(<Link href="/internal">Internal</Link>);
    const link = screen.getByRole('link');
    expect(link).not.toHaveAttribute('target');
  });

  it('detects http:// as external', () => {
    render(<Link href="http://example.com">HTTP</Link>);
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLAnchorElement>();
    render(<Link ref={ref} href="/test">Ref</Link>);
    expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it('merges custom className', () => {
    render(<Link href="/test" className="font-bold">Bold</Link>);
    expect(screen.getByRole('link').className).toContain('font-bold');
  });
});
