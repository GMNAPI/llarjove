import type { Metadata } from 'next';
import { FinderWizard } from './FinderWizard';

export const metadata: Metadata = {
  title: 'Comprova les teves ajudes al lloguer | LlarJove',
  description:
    'Descobreix en menys de 3 minuts si ets elegible per al Bo Alquiler Joven, el Bo Municipal de Barcelona o el Bo Lloguer Jove de la Generalitat.',
  openGraph: {
    title: 'Comprova les teves ajudes al lloguer | LlarJove',
    description:
      'Wizard guiat per verificar elegibilitat per a les principals ajudes al lloguer per a joves a Catalunya.',
  },
};

export default function FinderPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Minimal header */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-xs font-bold text-primary-foreground">
              LJ
            </div>
            <span className="font-semibold text-foreground text-sm">LlarJove</span>
          </a>
          <a href="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Inici
          </a>
        </div>
      </header>

      {/* Intro */}
      <div className="mx-auto max-w-xl px-4 pt-8">
        <h2 className="text-2xl font-bold text-foreground">Ajudes Finder</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          8 preguntes per saber si pots rebre fins a <strong className="text-foreground">250 €/mes</strong> d&apos;ajuda al lloguer.
          Sense registre, sense guardar dades.
        </p>
      </div>

      <FinderWizard />
    </main>
  );
}
