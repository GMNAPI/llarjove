'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/cn';

const selectClassName = cn(
  'flex h-11 min-h-[44px] w-full rounded-md border border-input bg-transparent px-4 py-3 text-sm',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
);

type Status = 'idle' | 'loading' | 'success' | 'error';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('Barcelona');
  const [profile, setProfile] = useState('Estudiante');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, location, profile }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Error desconocido');
      }

      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Algo ha fallado. Inténtalo de nuevo.');
    }
  }

  if (status === 'success') {
    return (
      <div className="mt-8 rounded-2xl border border-border bg-secondary p-8 text-center">
        <p className="text-2xl">✓</p>
        <p className="mt-2 font-medium text-foreground">T&apos;has apuntat!</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Comprova el teu correu — t&apos;hem enviat una confirmació.
        </p>
      </div>
    );
  }

  return (
    <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Email</span>
        <Input
          type="email"
          required
          placeholder="tuemail@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading'}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">¿Dónde buscas?</span>
        <select
          className={selectClassName}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={status === 'loading'}
        >
          <option>Barcelona</option>
          <option>AMB</option>
          <option>Resto de Catalunya</option>
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-foreground">Perfil</span>
        <select
          className={selectClassName}
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          disabled={status === 'loading'}
        >
          <option>Estudiante</option>
          <option>Trabajando</option>
          <option>Otros</option>
        </select>
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-border bg-secondary p-4 md:col-span-2">
        <input type="checkbox" className="mt-1 rounded border-input" required />
        <span className="text-sm text-muted-foreground">
          Acepto recibir un email cuando se abra la beta. Puedo darme de baja en
          cualquier momento.
        </span>
      </label>

      {status === 'error' && (
        <p className="text-sm text-red-600 md:col-span-2">{errorMsg}</p>
      )}

      <Button type="submit" className="md:col-span-2" disabled={status === 'loading'}>
        {status === 'loading' ? 'Enviant...' : 'Apuntarme a la beta'}
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
