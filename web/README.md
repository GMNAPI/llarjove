# LlarJove Web Frontend

> React 19 frontend amb design system complet per al chatbot d'habitatge per a joves.

## Quick Start

```bash
# Desde el directori arrel del projecte
pnpm dev:web      # Dev server a http://localhost:5173
pnpm test:web     # Executar 59 tests
pnpm build:web    # Build de producció
```

## Tech Stack

- **React 19**: Latest stable version amb StrictMode
- **Vite 6**: Build tool ultraràpid amb HMR
- **TypeScript 5.6**: Strict mode amb noUncheckedIndexedAccess
- **Tailwind CSS v4**: CSS-first configuration amb plugin Vite natiu
- **Vitest**: Test runner ràpid amb jsdom
- **React Testing Library**: Component testing amb accessibilitat first

## Estructura

```
web/
├── src/
│   ├── components/
│   │   ├── ui/              # 5 UI primitives
│   │   │   ├── Button.tsx   # 5 variants, 3 sizes
│   │   │   ├── Card.tsx     # Compound components (Header/Content/Footer)
│   │   │   ├── Input.tsx    # Amb error state
│   │   │   ├── Badge.tsx    # 4 variants
│   │   │   └── Link.tsx     # Detecció automàtica externa
│   │   └── BrandShowcase.tsx  # Living style guide
│   ├── styles/
│   │   ├── tokens.css       # Design tokens (colors, spacing, radii)
│   │   └── fonts.css        # Geist font
│   ├── lib/
│   │   └── cn.ts            # Utility per merge de classNames
│   └── test/
│       └── setup.ts         # Config vitest + jest-dom
├── vitest.config.ts
└── vite.config.ts
```

## Design System

### Colors (OKLCH)

| Token | Valor | Ús |
|-------|-------|-----|
| `--color-primary` | `oklch(0.556 0.135 181)` | Teal #00A89D - CTAs, links |
| `--color-secondary` | `oklch(0.968 0.007 247)` | #F5F8FA - Card backgrounds |
| `--color-accent` | `oklch(0.925 0.044 180)` | #D0F4F1 - Hover, highlights |
| `--color-destructive` | `#D85C5C` | Error states |
| `--color-foreground` | `#2B3A50` | Text principal (AAA) |
| `--color-muted-foreground` | `#6B7280` | Text secundari (AA) |

### Typography

**Font**: Geist (Google Fonts)
**Scale**: text-xs → text-4xl (8 nivells)

### Components

Tots els components segueixen el mateix patró:

```tsx
interface ComponentProps extends HTMLAttributes<HTMLElement> {
  variant?: 'primary' | 'secondary' | ...;
  size?: 'sm' | 'md' | 'lg';
}

export const Component = forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <element
      ref={ref}
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    />
  )
);
```

**Característiques clau**:
- `forwardRef` per composició
- Props tipades que extenen HTML natives
- `cn()` per merge de classes
- Accessibility: focus-visible rings, WCAG touch targets (44px)
- Tests complets per variant/state

## Desenvolupament

### Afegir un nou component

1. **Crear el component**:
   ```tsx
   // src/components/ui/NewComponent.tsx
   import { forwardRef } from 'react';
   import { cn } from '@/lib/cn';

   export const NewComponent = forwardRef<HTMLDivElement, Props>(
     ({ className, ...props }, ref) => (
       <div ref={ref} className={cn('base-classes', className)} {...props} />
     )
   );
   ```

2. **Crear tests**:
   ```tsx
   // src/components/ui/NewComponent.test.tsx
   import { render, screen } from '@testing-library/react';
   import { NewComponent } from './NewComponent';

   describe('NewComponent', () => {
     it('renders', () => {
       render(<NewComponent>Content</NewComponent>);
       expect(screen.getByText('Content')).toBeInTheDocument();
     });
   });
   ```

3. **Exportar**:
   ```tsx
   // src/components/ui/index.ts
   export { NewComponent } from './NewComponent';
   ```

4. **Afegir al showcase**:
   ```tsx
   // src/components/BrandShowcase.tsx
   <Section title="NewComponent">
     <NewComponent>Demo</NewComponent>
   </Section>
   ```

### Modificar design tokens

Edita `src/styles/tokens.css`:

```css
:root {
  --color-primary: oklch(0.556 0.135 181);  /* Canvia aquí */
}

@theme inline {
  --color-primary: var(--color-primary);    /* Mapeja a Tailwind */
}
```

Tailwind auto-genera utilitats: `bg-primary`, `text-primary`, etc.

### Testing

```bash
pnpm test:web              # Run once
pnpm test:web -- --watch   # Watch mode
pnpm test:web -- --ui      # Visual UI
pnpm test:web -- --coverage # Coverage report
```

**Què testar**:
- ✅ Render bàsic
- ✅ Totes les variants/sizes
- ✅ Estats disabled/error
- ✅ Events (onClick, onChange)
- ✅ forwardRef funciona
- ✅ className merge correcte
- ✅ Accessibility (touch targets, focus)

## Tailwind v4 Notes

**Diferències vs v3**:
- ❌ No `tailwind.config.js`
- ✅ `@theme inline` a CSS per configuració
- ✅ Plugin Vite natiu (més ràpid que PostCSS)
- ✅ OKLCH colors suportades nativament

**Pattern shadcn/ui**:
```css
/* 1. Define CSS variables */
:root {
  --color-primary: oklch(...);
}

/* 2. Map to Tailwind */
@theme inline {
  --color-primary: var(--color-primary);
}

/* 3. Use utilities */
<button className="bg-primary">...</button>
```

## Brand Showcase

Visita http://localhost:5173 després de `pnpm dev:web` per veure:

- ✅ Paleta de colors completa
- ✅ Escala tipogràfica
- ✅ Tots els components amb variants
- ✅ Exemples reals de Cards amb contingut

## Scripts Disponibles

| Script | Descripció |
|--------|------------|
| `pnpm dev` | Dev server amb HMR |
| `pnpm build` | Build TypeScript + Vite |
| `pnpm preview` | Preview build local |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Tests en watch mode |

## Decisions Tècniques

### Per què Tailwind v4?

- **CSS-first**: Més intuïtiu que JS config
- **Vite plugin natiu**: Build més ràpid
- **OKLCH suportat**: Colors perceptualment uniformes
- **No breaking changes**: Migració zero-cost (greenfield)

### Per què no usar una UI library?

- **Tailwind**: Full control sobre styles
- **Accessibilitat**: WCAG built-in desde dia 1
- **Bundle size**: 5 components vs 50+ no utilitzats
- **Learning**: Patró escalable per futures features

### Per què vitest?

- **Velocitat**: 10x més ràpid que Jest
- **Vite native**: Mateix config que dev
- **ESM first**: No transforms, natiu Node
- **DX**: UI mode, watch intel·ligent

## Testing Coverage

**59 tests** a 8 fitxers:

| Component | Tests | Coverage |
|-----------|-------|----------|
| Button | 13 | 100% |
| Card | 8 | 100% |
| Input | 8 | 100% |
| Badge | 8 | 100% |
| Link | 8 | 100% |
| BrandShowcase | 8 | 100% |
| cn() | 5 | 100% |
| App | 1 | 100% |

## Roadmap Frontend

- [x] Design system base (colors, typography)
- [x] UI components primitius
- [x] Living style guide
- [ ] Integració amb API backend
- [ ] Chat interface
- [ ] Loading/error states
- [ ] Responsive mobile
- [ ] Dark mode (preparació feta amb CSS vars)

## Recursos

- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs/v4-beta)
- [React Testing Library](https://testing-library.com/react)
- [Vitest](https://vitest.dev)
- [OKLCH Color Picker](https://oklch.com)
