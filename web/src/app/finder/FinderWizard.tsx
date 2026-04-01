'use client';

import { useState, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui';
import { cn } from '@/lib/cn';
import { ProgressBar } from './components/ProgressBar';
import { OptionButton } from './components/OptionButton';
import { VerdictScreen } from './components/VerdictScreen';
import {
  QUESTION_ORDER,
  QUESTIONS,
  getRentOptions,
  type FinderAnswers,
  type QuestionId,
} from './questions';
import { computeEligibility } from './eligibility';

interface WizardState {
  stepIndex: number; // index into QUESTION_ORDER
  answers: FinderAnswers;
  showVerdict: boolean;
}

const INITIAL_STATE: WizardState = {
  stepIndex: 0,
  answers: {},
  showVerdict: false,
};

export function FinderWizard() {
  const [restartCount, setRestartCount] = useState(0);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);

  const currentQuestionId = QUESTION_ORDER[state.stepIndex] as QuestionId;
  const currentQuestion = QUESTIONS[currentQuestionId];

  // Build dynamic options for the rent question
  const options =
    currentQuestionId === 'rent'
      ? getRentOptions(state.answers.location, state.answers.contractType)
      : currentQuestion.options;

  const handleAnswer = useCallback(
    (value: string) => {
      const newAnswers = { ...state.answers, [currentQuestionId]: value } as FinderAnswers;

      // Check early-exit: after answering, are all programs already disqualified?
      const result = computeEligibility(newAnswers);
      if (result.allDisqualified) {
        setState({ stepIndex: state.stepIndex, answers: newAnswers, showVerdict: true });
        return;
      }

      // Advance to next question or show verdict if we've answered the last question
      const nextIndex = state.stepIndex + 1;
      if (nextIndex >= QUESTION_ORDER.length) {
        setState({ stepIndex: state.stepIndex, answers: newAnswers, showVerdict: true });
      } else {
        setState({ stepIndex: nextIndex, answers: newAnswers, showVerdict: false });
      }
    },
    [state, currentQuestionId],
  );

  const handleBack = useCallback(() => {
    if (state.showVerdict) {
      setState(prev => ({ ...prev, showVerdict: false }));
      return;
    }
    if (state.stepIndex > 0) {
      setState(prev => ({ ...prev, stepIndex: prev.stepIndex - 1 }));
    }
  }, [state]);

  const handleRestart = useCallback(() => {
    setState({ stepIndex: 0, answers: {}, showVerdict: false });
    setRestartCount(c => c + 1);
  }, []);

  const currentAnswerValue = state.answers[currentQuestionId] as string | undefined;

  // Total steps: we show taxCurrent as part of the last screen in a 2-step "specifics" question
  // For progress, we count only QUESTION_ORDER (familyLandlord is Q8, taxCurrent is shown last)
  const totalSteps = QUESTION_ORDER.length;
  const displayStep = state.stepIndex + 1;

  if (state.showVerdict) {
    const result = computeEligibility(state.answers);
    return (
      <div key={`verdict-${restartCount}`} className="mx-auto max-w-xl px-4 py-8">
        <VerdictScreen
          answers={state.answers}
          result={result}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  return (
    <div key={`wizard-${restartCount}`} className="mx-auto max-w-xl px-4 py-8">
      <ProgressBar current={displayStep} total={totalSteps} className="mb-6" />

      <Card className="rounded-2xl shadow-md">
        <CardHeader className="pb-2">
          <h1 className="text-xl font-bold text-foreground">{currentQuestion.title}</h1>
          {currentQuestion.subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{currentQuestion.subtitle}</p>
          )}
        </CardHeader>

        <CardContent>
          {/* Tax current question injected before the last question (familyLandlord) */}
          {currentQuestionId === 'familyLandlord' && !state.answers.taxCurrent && (
            <TaxCurrentInject
              onAnswer={(v) => setState(prev => ({ ...prev, answers: { ...prev.answers, taxCurrent: v as FinderAnswers['taxCurrent'] } }))}
            />
          )}

          <div className="space-y-3 mt-2">
            {options.map((opt) => (
              <OptionButton
                key={opt.value}
                label={opt.label}
                sublabel={opt.sublabel}
                selected={currentAnswerValue === opt.value}
                onClick={() => handleAnswer(opt.value)}
              />
            ))}
          </div>

          {/* Back navigation */}
          {(state.stepIndex > 0 || state.showVerdict) && (
            <button
              type="button"
              onClick={handleBack}
              className={cn(
                'mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded',
              )}
            >
              ← Enrere
            </button>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Les teves respostes no s&apos;emmagatzemen. Informació orientativa, no assessorament legal.
      </p>
    </div>
  );
}

// ─── TaxCurrent sub-question (shown before familyLandlord) ──────────────────
// We inject it inline so the user experiences it as one flow without a separate step index

function TaxCurrentInject({ onAnswer }: { onAnswer: (v: string) => void }) {
  const q = QUESTIONS['taxCurrent'];
  const [answered, setAnswered] = useState(false);

  if (answered) return null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-secondary/50 p-4">
      <p className="font-medium text-foreground text-sm">{q.title}</p>
      {q.subtitle && <p className="text-xs text-muted-foreground mt-0.5 mb-3">{q.subtitle}</p>}
      <div className="space-y-2">
        {q.options.map(opt => (
          <OptionButton
            key={opt.value}
            label={opt.label}
            sublabel={opt.sublabel}
            onClick={() => {
              setAnswered(true);
              onAnswer(opt.value);
            }}
          />
        ))}
      </div>
    </div>
  );
}
