'use client';

import { cn } from '@/lib/cn';
import type { ProgramVerdict } from '../eligibility';

const PROGRAM_META: Record<ProgramVerdict['programId'], {
  name: string;
  shortName: string;
  amount: string;
  url: string;
  window?: string;
}> = {
  nacional: {
    name: 'Bo Alquiler Joven — Estatal',
    shortName: 'MIVAU / Estat',
    amount: '250 €/mes × 24 mesos',
    url: 'https://www.mivau.gob.es/vivienda/ayudas-y-financiacion/bono-alquiler-joven',
    window: undefined,
  },
  barcelona: {
    name: 'Bo Municipal Habitatge Jove — Barcelona',
    shortName: 'Ajuntament BCN',
    amount: '250 €/mes × 24 mesos',
    url: 'https://habitatge.barcelona/ca/tramits-serveis/bo-municipal-habitatge-jove',
    window: '9–13 març 2026',
  },
  generalitat: {
    name: 'Bo Lloguer Jove — Generalitat',
    shortName: 'Generalitat de Catalunya',
    amount: '20–250 €/mes × 24 mesos',
    url: 'https://habitatge.gencat.cat/ca/detalls/Tramits/22866_Bo_lloguer_joves',
    window: '9–13 març 2026',
  },
};

const VERDICT_STYLES: Record<ProgramVerdict['verdict'], {
  border: string;
  badge: string;
  icon: string;
  label: string;
}> = {
  ELIGIBLE: {
    border: 'border-l-4 border-l-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800',
    icon: '✓',
    label: 'Compleixos els requisits',
  },
  POSSIBLE: {
    border: 'border-l-4 border-l-amber-400',
    badge: 'bg-amber-100 text-amber-800',
    icon: '?',
    label: 'Possible (cal confirmar)',
  },
  NOT_ELIGIBLE: {
    border: 'border-l-4 border-l-red-400',
    badge: 'bg-red-100 text-red-800',
    icon: '✗',
    label: 'No compleixos els requisits',
  },
};

interface ProgramVerdictCardProps {
  verdict: ProgramVerdict;
  showUrgency?: boolean;
}

export function ProgramVerdictCard({ verdict, showUrgency }: ProgramVerdictCardProps) {
  const meta = PROGRAM_META[verdict.programId];
  const style = VERDICT_STYLES[verdict.verdict];

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card shadow-sm overflow-hidden',
        style.border,
      )}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{meta.shortName}</p>
            <h3 className="mt-0.5 font-semibold text-foreground text-sm sm:text-base">{meta.name}</h3>
          </div>
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0', style.badge)}>
            <span>{style.icon}</span> {style.label}
          </span>
        </div>

        {/* Amount */}
        {verdict.verdict !== 'NOT_ELIGIBLE' && (
          <p className="mt-2 text-sm text-muted-foreground">
            Ajuda: <span className="font-medium text-foreground">{meta.amount}</span>
          </p>
        )}

        {/* Disqualifier reason */}
        {verdict.verdict === 'NOT_ELIGIBLE' && verdict.disqualifierReason && (
          <p className="mt-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">
            {verdict.disqualifierReason}
          </p>
        )}

        {/* Uncertainties for POSSIBLE */}
        {verdict.verdict === 'POSSIBLE' && verdict.uncertainties.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">Factors pendents de confirmar:</p>
            <ul className="mt-1 space-y-0.5">
              {verdict.uncertainties.map(u => (
                <li key={u} className="text-xs text-amber-700">· {u}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Urgency badge + link */}
        {verdict.verdict !== 'NOT_ELIGIBLE' && (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {meta.window && showUrgency && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700 animate-pulse">
                ⏰ Termini: {meta.window}
              </span>
            )}
            <a
              href={meta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-primary hover:underline"
            >
              Veure informació oficial →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
