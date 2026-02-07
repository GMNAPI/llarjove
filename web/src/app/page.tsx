import { Badge, Card, Link } from '@/components/ui';

const Check = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M20 6L9 17l-5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Arrow = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M5 12h14M13 5l7 7-7 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function SectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-2xl">
      {kicker ? (
        <p className="text-sm font-semibold tracking-wide text-primary">
          {kicker}
        </p>
      ) : null}
      <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-foreground">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-base text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-2xl border border-border bg-card p-5 shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span className="font-medium text-foreground">{q}</span>
        <span className="text-muted-foreground transition-transform group-open:rotate-90">
          <Arrow />
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
    </details>
  );
}

import { WaitlistForm } from './WaitlistForm';

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary font-bold text-primary-foreground">
              LJ
            </div>
            <div className="leading-tight">
              <p className="font-semibold">LlarJove</p>
              <p className="text-xs text-muted-foreground">
                Habitatge clar, amb fonts
              </p>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/chat" className="hover:text-foreground font-medium text-primary">
              Probar el chat
            </Link>
            <Link href="#como-funciona" className="hover:text-foreground">
              Cómo funciona
            </Link>
            <Link href="#beneficios" className="hover:text-foreground">
              Beneficios
            </Link>
            <Link href="#fuentes" className="hover:text-foreground">
              Fuentes
            </Link>
            <Link href="#faq" className="hover:text-foreground">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Probar el chat
            </Link>
            <Link
              href="#waitlist"
              className="hidden sm:inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary"
            >
              Únete a la lista
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        id="hero"
        className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:pt-16"
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Fuentes oficiales + fecha</Badge>
              <Badge variant="outline">Privacidad por defecto</Badge>
              <Badge variant="outline">Sin burocratés</Badge>
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Habitatge, <span className="text-primary">sense perdre&apos;t</span>.
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Te guiamos paso a paso para encontrar vivienda en Cataluña y
              entender ayudas y derechos, con información verificable y con
              fuentes.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                Probar el asistente
              </Link>
              <Link
                href="#waitlist"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-base font-semibold text-foreground hover:bg-secondary"
              >
                Únete a la lista
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-base font-semibold text-foreground hover:bg-secondary"
              >
                Ver cómo funciona{' '}
                <span className="ml-2 text-muted-foreground">
                  <Arrow />
                </span>
              </Link>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Información orientativa; no es asesoramiento legal. Para
              decisiones importantes, verifica en la fuente oficial.
            </p>
          </div>

          <div className="relative">
            {/* Chat mockup: colores 100% del tema (secondary=usuario, accent=LlarJove, primary=énfasis) */}
            <Card className="rounded-3xl border-border p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Ejemplo</p>
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-secondary p-4">
                  <p className="text-sm font-medium text-foreground">Tú</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    &quot;Tengo 24 años, busco piso en Barcelona. ¿Qué ayudas y
                    trámites necesito?&quot;
                  </p>
                </div>
                <div className="rounded-xl border border-primary/20 bg-accent p-4">
                  <p className="text-sm font-medium text-foreground">LlarJove</p>
                  <ul className="mt-2 space-y-2 text-sm text-foreground">
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-primary" /> Opciones de
                      ayuda al alquiler (según requisitos)
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-primary" /> Checklist de
                      documentación y pasos
                    </li>
                    <li className="flex gap-2">
                      <Check className="h-5 w-5 text-primary" /> Fuentes
                      citadas y fecha de actualización
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    &quot;Fuente: Agència de l&apos;Habitatge (oficial) ·
                    Actualizado: DD/MM/AAAA&quot;
                  </p>
                </div>
              </div>
            </Card>

            <div className="pointer-events-none absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-8 -z-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="como-funciona"
        className="mx-auto max-w-6xl px-4 py-12"
      >
        <SectionTitle
          kicker="Cómo funciona"
          title="3 pasos. Sin líos."
          subtitle="Te acompañamos desde la duda hasta el siguiente paso concreto, siempre con trazabilidad."
        />

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-sm font-semibold text-primary">Paso 1</p>
            <h3 className="mt-2 text-lg font-semibold">
              Cuéntanos tu situación
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Zona, presupuesto, si estudias o trabajas, y qué necesitas.
            </p>
          </Card>
          <Card className="rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-sm font-semibold text-primary">Paso 2</p>
            <h3 className="mt-2 text-lg font-semibold">
              Te damos opciones y pasos
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ayudas, recursos locales y trámites en un plan accionable.
            </p>
          </Card>
          <Card className="rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-sm font-semibold text-primary">Paso 3</p>
            <h3 className="mt-2 text-lg font-semibold">
              Te mostramos fuentes
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Marcamos si la fuente es oficial y la fecha de la info.
            </p>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="mx-auto max-w-6xl px-4 py-12">
        <SectionTitle
          kicker="Beneficios"
          title="Lo que te resuelve (de verdad)"
          subtitle="Para jóvenes que quieren avanzar sin perder horas en PDFs y ventanillas."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              t: 'Ajudes al lloguer (explicadas claro)',
              d: 'Qué existe, cómo encaja contigo y qué preparar.',
            },
            {
              t: 'Derechos básicos',
              d: 'Fianza, contrato, subidas, reparaciones: lo esencial sin drama.',
            },
            {
              t: 'Trámites y documentación',
              d: 'Listas y pasos para no quedarte a medias.',
            },
            {
              t: 'Recursos locales',
              d: 'Oficines d\'habitatge, bolsas y servicios por zona.',
            },
            {
              t: 'Plantillas y checklists',
              d: 'Mensajes al propietario, lista de visita, documentos.',
            },
            {
              t: 'Privacidad por defecto',
              d: 'Minimizamos datos y te damos control.',
            },
          ].map((x) => (
            <Card
              key={x.t}
              className="rounded-2xl p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-base font-semibold">{x.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Sources */}
      <section id="fuentes" className="mx-auto max-w-6xl px-4 py-12">
        <SectionTitle
          kicker="Fuentes y trazabilidad"
          title="Oficial vs orientativo, siempre marcado"
          subtitle="No mezclamos. Te decimos de dónde sale cada cosa y cuándo se actualizó."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold">✅ Oficial</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Generalitat / Agència de l&apos;Habitatge, ajuntaments, oficinas
              de vivienda, normativa oficial.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              <li className="flex gap-2">
                <Check /> Requisitos y plazos
              </li>
              <li className="flex gap-2">
                <Check /> Procedimientos y formularios
              </li>
              <li className="flex gap-2">
                <Check /> Enlaces directos
              </li>
            </ul>
          </Card>
          <Card className="rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-semibold">ℹ️ Orientativo</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Entidades y guías prácticas reputadas. Útil para contexto, pero
              no sustituye lo oficial.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              <li className="flex gap-2">
                <Check /> Consejos y acompañamiento
              </li>
              <li className="flex gap-2">
                <Check /> Recursos comunitarios
              </li>
              <li className="flex gap-2">
                <Check /> Señalamos posibles sesgos
              </li>
            </ul>
          </Card>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Siempre marcamos si una fuente es oficial y la fecha.
        </p>
      </section>

      {/* Privacy */}
      <section id="privacidad" className="mx-auto max-w-6xl px-4 py-12">
        <SectionTitle
          kicker="Privacidad"
          title="Tu situación es sensible. La tratamos como tal."
          subtitle="Diseñado para pedir lo mínimo y darte control."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold">Minimización</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Solo preguntamos lo necesario para darte pasos útiles.
            </p>
          </Card>
          <Card className="rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold">Sin cuenta (opcional)</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Puedes probarlo sin registrarte; la lista es solo para avisarte.
            </p>
          </Card>
          <Card className="rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold">Borrado fácil</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Control claro sobre lo que guardas y lo que no.
            </p>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-4 py-12">
        <SectionTitle
          kicker="FAQ"
          title="Preguntas habituales"
          subtitle="Si te queda una duda, escríbenos y la añadimos."
        />
        <div className="mt-8 grid gap-3">
          <FAQItem
            q="¿Esto es asesoramiento legal?"
            a="No. Es información orientativa con fuentes y pasos prácticos. Para casos sensibles o decisiones importantes, verifica en la fuente oficial o consulta asesoramiento profesional."
          />
          <FAQItem
            q="¿Cómo sé que está actualizado?"
            a="Mostramos la fuente y la fecha de la información. Si algo no se puede confirmar, lo decimos y te indicamos dónde verificar."
          />
          <FAQItem
            q="¿A quién va dirigido?"
            a="Principalmente a jóvenes en Cataluña que buscan alquiler o habitación y quieren entender ayudas, derechos y trámites sin perderse."
          />
          <FAQItem
            q="¿Qué zonas cubre?"
            a="Cataluña. Priorizamos recursos locales (Barcelona/AMB y resto) según lo que nos indiques."
          />
          <FAQItem
            q="¿Es gratis?"
            a="La beta será gratuita o con acceso prioritario para la lista. Lo comunicaremos con transparencia antes de lanzar."
          />
          <FAQItem
            q="¿Qué pasa con mis datos?"
            a="Pedimos lo mínimo y usamos tus respuestas para darte un plan útil. Tendrás control y opciones de borrado."
          />
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="mx-auto max-w-6xl px-4 py-12">
        <Card className="rounded-3xl border-border p-6 shadow-sm sm:p-10">
          <SectionTitle
            kicker="Beta"
            title="Únete a la lista y te avisamos"
            subtitle="Sin spam. Acceso temprano y posibilidad de influir en el producto."
          />

          <WaitlistForm />
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} LlarJove
          </p>
          <div className="flex gap-5 text-sm text-muted-foreground">
            <Link href="#fuentes" className="hover:text-foreground">
              Fuentes
            </Link>
            <Link href="#privacidad" className="hover:text-foreground">
              Privacidad
            </Link>
            <Link href="#waitlist" className="hover:text-foreground">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
