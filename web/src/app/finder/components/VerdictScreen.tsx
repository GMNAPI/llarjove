'use client';

import { Button } from '@/components/ui';
import type { EligibilityResult } from '../eligibility';
import type { FinderAnswers } from '../questions';
import { ProgramVerdictCard } from './ProgramVerdictCard';
import { buildChatContext } from '../eligibility';

interface VerdictScreenProps {
  answers: FinderAnswers;
  result: EligibilityResult;
  onRestart: () => void;
  chatBaseUrl?: string;
}

function isWithinUrgencyWindow(): boolean {
  const now = new Date();
  const start = new Date('2026-03-09');
  const end = new Date('2026-03-13T23:59:59');
  return now >= start && now <= end;
}

function getSummaryMessage(result: EligibilityResult): { emoji: string; title: string; subtitle: string } {
  const verdicts = [result.nacional.verdict, result.barcelona.verdict, result.generalitat.verdict];
  const eligible = verdicts.filter(v => v === 'ELIGIBLE').length;
  const possible = verdicts.filter(v => v === 'POSSIBLE').length;

  if (eligible >= 2) {
    return { emoji: '🎉', title: 'Molt bona notícia!', subtitle: `Compleixos els requisits de ${eligible} programa${eligible > 1 ? 's' : ''}.` };
  }
  if (eligible === 1) {
    return { emoji: '✅', title: 'Hi ha opcions per a tu', subtitle: 'Compleixos els requisits d\'un programa. Confirma els detalls.' };
  }
  if (possible > 0) {
    return { emoji: '🔍', title: 'Possible elegibilitat', subtitle: 'Cal confirmar alguns detalls per saber si compleixos els requisits.' };
  }
  return { emoji: '😔', title: 'No compleixos els requisits actuals', subtitle: 'Amb la informació proporcionada no ets elegible. El xat et pot orientar sobre altres opcions.' };
}

export function VerdictScreen({ answers, result, onRestart, chatBaseUrl = '/chat' }: VerdictScreenProps) {
  const showUrgency = isWithinUrgencyWindow();
  const summary = getSummaryMessage(result);

  const chatContext = buildChatContext(answers, result);
  const chatUrl = `${chatBaseUrl}?q=${encodeURIComponent(chatContext)}`;

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="text-center py-2">
        <p className="text-4xl">{summary.emoji}</p>
        <h2 className="mt-3 text-xl font-bold text-foreground">{summary.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{summary.subtitle}</p>
      </div>

      {/* Urgency banner */}
      {showUrgency && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 text-center">
          <p className="font-semibold text-red-700 text-sm">
            ⏰ Finestra de sol·licitud activa: 9–13 març 2026
          </p>
          <p className="mt-1 text-xs text-red-600">
            El termini per Barcelona i Generalitat tanca el 13 de març. No esperes!
          </p>
        </div>
      )}

      {/* Program verdicts */}
      <div className="space-y-3">
        <ProgramVerdictCard verdict={result.nacional} showUrgency={showUrgency} />
        <ProgramVerdictCard verdict={result.barcelona} showUrgency={showUrgency} />
        <ProgramVerdictCard verdict={result.generalitat} showUrgency={showUrgency} />
      </div>

      {/* Chat handoff */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
        <p className="font-semibold text-foreground text-sm">Vol saber com sol·licitar-ho?</p>
        <p className="mt-1 text-xs text-muted-foreground">
          El nostre assistent RAG té documents oficials i pot guiar-te pas a pas amb la teva situació concreta.
        </p>
        <a
          href={chatUrl}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Preguntar al xat →
        </a>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Informació orientativa basada en criteris oficials publicats. Verifica sempre als webs oficials abans de sol·licitar.
      </p>

      {/* Restart */}
      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={onRestart}>
          Tornar a començar
        </Button>
      </div>
    </div>
  );
}
