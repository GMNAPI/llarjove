export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-4xl font-bold text-foreground">404</h1>
      <p className="text-muted-foreground">Aquesta pàgina no existeix.</p>
      <a
        href="/"
        className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
      >
        Tornar a l&apos;inici
      </a>
    </main>
  );
}
