/**
 * In-app birthday greeting shown once per year on the user's birth day.
 */

import { Cake } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import { BIRTHDAY_POPUP, markBirthdaySeen } from '@/lib/birthdayWelcome';

export function BirthdayPopup({
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
  const firstName = userName?.trim().split(/\s+/)[0];

  const handleClose = () => {
    markBirthdaySeen(userId);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={BIRTHDAY_POPUP.title}
      size="sm"
      showBrand={false}
    >
      <div className="mx-auto flex w-full max-w-[22rem] flex-col items-center gap-4 pb-1 text-center sm:gap-5 sm:pb-0">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-accent sm:h-12 sm:w-12"
          aria-hidden
        >
          <Cake className="h-7 w-7 sm:h-6 sm:w-6" />
        </div>

        <p className="text-pretty text-[15px] leading-relaxed text-muted sm:text-sm">
          {firstName ? (
            <>
              Halo{' '}
              <span className="font-semibold text-ink">{firstName}</span>!{' '}
            </>
          ) : null}
          {BIRTHDAY_POPUP.message}
        </p>

        <Button
          variant="gradient"
          size="lg"
          className="mt-1 w-full max-w-sm touch-manipulation"
          onClick={handleClose}
        >
          {BIRTHDAY_POPUP.confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
