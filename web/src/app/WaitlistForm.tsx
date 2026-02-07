'use client';

import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/cn';

const selectClassName = cn(
  'flex h-11 min-h-[44px] w-full rounded-md border border-input bg-transparent px-4 py-3 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
);

export function WaitlistForm() {
  return (
    <form
      className="mt-8 grid gap-4 md:grid-cols-2"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Email</span>
        <Input
          type="email"
          required
          placeholder="tuemail@ejemplo.com"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">
          ¿Dónde buscas?
        </span>
        <select className={selectClassName}>
          <option>Barcelona</option>
          <option>AMB</option>
          <option>Resto de Catalunya</option>
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Perfil</span>
        <select className={selectClassName}>
          <option>Estudiante</option>
          <option>Trabajando</option>
          <option>Otros</option>
        </select>
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-border bg-secondary p-4 md:col-span-2">
        <input
          type="checkbox"
          className="mt-1 rounded border-input"
          required
        />
        <span className="text-sm text-muted-foreground">
          Acepto recibir un email cuando se abra la beta. Puedo darme de baja en
          cualquier momento.
        </span>
      </label>

      <Button type="submit" className="md:col-span-2">
        Apuntarme a la beta
      </Button>

      <p className="text-xs text-muted-foreground md:col-span-2">
        Te avisamos cuando abramos la beta. Sin spam.
      </p>
      <p className="text-xs text-muted-foreground md:col-span-2">
        Consejo: para dudas urgentes (desahucio, amenazas, etc.), busca ayuda
        profesional y canales oficiales.
      </p>
    </form>
  );
}
