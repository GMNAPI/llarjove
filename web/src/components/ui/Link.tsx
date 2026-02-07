import { forwardRef, type AnchorHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

function isExternal(href: string): boolean {
  return href.startsWith('http://') || href.startsWith('https://');
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, href, children, ...props }, ref) => {
    const externalProps = isExternal(href)
      ? { target: '_blank' as const, rel: 'noopener noreferrer' }
      : {};

    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          'text-primary underline-offset-4 hover:underline',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm',
          className,
        )}
        {...externalProps}
        {...props}
      >
        {children}
      </a>
    );
  },
);

Link.displayName = 'Link';
