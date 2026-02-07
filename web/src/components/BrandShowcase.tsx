import {
  Button,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Input,
  Badge,
  Link,
} from '@/components/ui';

const colors = [
  { name: 'Primary', var: '--color-primary', className: 'bg-primary' },
  { name: 'Secondary', var: '--color-secondary', className: 'bg-secondary' },
  { name: 'Accent', var: '--color-accent', className: 'bg-accent' },
  { name: 'Destructive', var: '--color-destructive', className: 'bg-destructive' },
  { name: 'Background', var: '--color-background', className: 'bg-background' },
  { name: 'Foreground', var: '--color-foreground', className: 'bg-foreground' },
  { name: 'Muted', var: '--color-muted-foreground', className: 'bg-muted-foreground' },
  { name: 'Border', var: '--color-border', className: 'bg-border' },
] as const;

const typographyScale = [
  { label: 'text-4xl', className: 'text-4xl font-bold' },
  { label: 'text-3xl', className: 'text-3xl font-bold' },
  { label: 'text-2xl', className: 'text-2xl font-semibold' },
  { label: 'text-xl', className: 'text-xl font-semibold' },
  { label: 'text-lg', className: 'text-lg font-medium' },
  { label: 'text-base', className: 'text-base' },
  { label: 'text-sm', className: 'text-sm' },
  { label: 'text-xs', className: 'text-xs' },
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold text-foreground mb-6 pb-2 border-b border-border">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function BrandShowcase() {
  return (
    <div className="min-h-screen bg-background p-8 max-w-5xl mx-auto">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-primary">LlarJove</h1>
        <p className="mt-2 text-muted-foreground text-lg">
          Brand Identity & Design System
        </p>
      </header>

      <Section title="Color Palette">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {colors.map(({ name, var: cssVar, className }) => (
            <div key={name} className="text-center">
              <div
                className={`${className} h-20 rounded-lg border border-border mb-2`}
              />
              <p className="text-sm font-medium">{name}</p>
              <p className="text-xs text-muted-foreground">{cssVar}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography Scale">
        <div className="space-y-4">
          {typographyScale.map(({ label, className }) => (
            <div key={label} className="flex items-baseline gap-4">
              <code className="text-xs text-muted-foreground w-20 shrink-0">
                {label}
              </code>
              <span className={className}>Ajuda per trobar habitatge</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled>Disabled</Button>
          </div>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </Section>

      <Section title="Input">
        <div className="max-w-sm space-y-4">
          <Input placeholder="Default input" />
          <Input placeholder="Error state" error />
          <Input placeholder="Disabled" disabled />
        </div>
      </Section>

      <Section title="Card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Bono Alquiler Joven</h3>
              <p className="text-sm text-muted-foreground">
                Ajuda estatal per a joves de 18 a 35 anys
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                250€/mes durant 2 anys per ajudar amb el lloguer. Ingressos
                màxims: 3 vegades l'IPREM.
              </p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Sol·licitar</Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Prestacions habitatge</h3>
              <Badge variant="secondary">Obert</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Ajudes de la Generalitat per al pagament de l'habitatge habitual.
              </p>
            </CardContent>
            <CardFooter>
              <Link href="https://habitatge.gencat.cat">Més informació</Link>
            </CardFooter>
          </Card>
        </div>
      </Section>

      <Section title="Links">
        <div className="space-y-2">
          <p>
            <Link href="/internal">Internal link (no target)</Link>
          </p>
          <p>
            <Link href="https://habitatge.gencat.cat">
              External link (opens in new tab)
            </Link>
          </p>
        </div>
      </Section>
    </div>
  );
}
