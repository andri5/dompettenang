/**
 * Splash + short guided tour for newly activated Pro users.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Crown, FileText, PiggyBank, Repeat, Share2, Sparkles } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import {
  PRO_WELCOME_SPLASH,
  PRO_WELCOME_STEPS,
  markProWelcomeSeen,
  type ProWelcomeStep,
} from '@/lib/proWelcome';

const STEP_ICONS: Record<string, typeof Crown> = {
  'budget-alert': AlertTriangle,
  insight: Sparkles,
  pdf: FileText,
  share: Share2,
  recurring: Repeat,
  savings: PiggyBank,
};

type Phase = 'splash' | 'steps';

export function ProWelcomeTour({
  isOpen,
  userId,
  userName,
  onClose,
}: {
  isOpen: boolean;
  userId?: string | null;
  userName?: string | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('splash');
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPhase('splash');
      setStepIndex(0);
    }
  }, [isOpen]);

  const finish = (href?: string) => {
    markProWelcomeSeen(userId);
    setPhase('splash');
    setStepIndex(0);
    onClose();
    if (href) navigate(href);
  };

  const handleClose = () => {
    finish();
  };

  const step: ProWelcomeStep | undefined = PRO_WELCOME_STEPS[stepIndex];
  const isLast = stepIndex >= PRO_WELCOME_STEPS.length - 1;
  const Icon =
    phase === 'steps' && step
      ? STEP_ICONS[step.id] || Sparkles
      : Crown;

  const title =
    phase === 'splash'
      ? PRO_WELCOME_SPLASH.title
      : step?.title || PRO_WELCOME_SPLASH.title;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="sm"
      showBrand
    >
      <div className="space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          <Icon className="h-6 w-6" />
        </div>

        {phase === 'splash' ? (
          <>
            <p className="text-sm leading-relaxed text-muted">
              {userName ? (
                <>
                  Halo{' '}
                  <span className="font-semibold text-ink">
                    {userName.split(' ')[0]}
                  </span>
                  !{' '}
                </>
              ) : null}
              {PRO_WELCOME_SPLASH.message}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="gradient"
                className="w-full"
                onClick={() => {
                  setPhase('steps');
                  setStepIndex(0);
                }}
              >
                {PRO_WELCOME_SPLASH.confirmLabel}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => finish()}
              >
                {PRO_WELCOME_SPLASH.skipLabel}
              </Button>
            </div>
          </>
        ) : step ? (
          <>
            <p className="text-xs font-medium text-muted">
              Langkah {stepIndex + 1} dari {PRO_WELCOME_STEPS.length}
            </p>
            <p className="text-sm leading-relaxed text-muted">{step.message}</p>
            <div className="flex gap-1.5" aria-hidden>
              {PRO_WELCOME_STEPS.map((s, i) => (
                <span
                  key={s.id}
                  className={
                    i === stepIndex
                      ? 'h-1.5 flex-1 rounded-full bg-accent'
                      : 'h-1.5 flex-1 rounded-full bg-line'
                  }
                />
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="gradient"
                className="w-full"
                onClick={() => {
                  if (isLast) {
                    finish(step.href);
                    return;
                  }
                  setStepIndex((i) => i + 1);
                }}
              >
                {step.ctaLabel}
              </Button>
              {!isLast ? (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => finish()}
                >
                  Lewati
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
