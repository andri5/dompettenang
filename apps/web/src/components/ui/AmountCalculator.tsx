/**
 * Dompet Tenang - Amount Calculator Modal
 */

import { useEffect, useState, type ReactNode } from 'react';
import { Delete, Equal } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { cn, formatCurrency } from '@/lib/utils';

type Operator = '+' | '-' | '×' | '÷';

export interface AmountCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (amount: number) => void;
  initialValue?: number;
}

function formatDisplay(value: string) {
  if (value === '' || value === '-') return value || '0';
  const [intPart, decPart] = value.split('.');
  const negative = intPart.startsWith('-');
  const digits = negative ? intPart.slice(1) : intPart;
  const formatted = Number(digits || '0').toLocaleString('id-ID');
  const withSign = negative ? `-${formatted}` : formatted;
  return decPart !== undefined ? `${withSign},${decPart}` : withSign;
}

function compute(left: number, right: number, op: Operator) {
  switch (op) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '×':
      return left * right;
    case '÷':
      return right === 0 ? NaN : left / right;
  }
}

export function AmountCalculator({
  isOpen,
  onClose,
  onApply,
  initialValue,
}: AmountCalculatorProps) {
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [fresh, setFresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const start =
      typeof initialValue === 'number' && Number.isFinite(initialValue) && initialValue > 0
        ? String(Math.round(initialValue))
        : '0';
    setDisplay(start);
    setStored(null);
    setOperator(null);
    setFresh(true);
    setError(null);
  }, [isOpen, initialValue]);

  const current = Number(display);

  const appendDigits = (digits: string) => {
    setError(null);
    setDisplay((prev) => {
      let next = prev;
      let nextFresh = fresh;
      for (const digit of digits) {
        if (nextFresh || next === '0') {
          next = digit;
          nextFresh = false;
          continue;
        }
        if (next.replace('-', '').replace('.', '').length >= 12) break;
        next += digit;
      }
      setFresh(nextFresh);
      return next;
    });
  };

  const inputDigit = (digit: string) => appendDigits(digit);

  const inputDot = () => {
    setError(null);
    setDisplay((prev) => {
      if (fresh) {
        setFresh(false);
        return '0.';
      }
      if (prev.includes('.')) return prev;
      return `${prev}.`;
    });
  };

  const clearAll = () => {
    setDisplay('0');
    setStored(null);
    setOperator(null);
    setFresh(true);
    setError(null);
  };

  const backspace = () => {
    setError(null);
    setDisplay((prev) => {
      if (fresh || prev.length <= 1 || (prev.length === 2 && prev.startsWith('-'))) {
        setFresh(true);
        return '0';
      }
      return prev.slice(0, -1);
    });
  };

  const chooseOperator = (op: Operator) => {
    setError(null);
    if (stored !== null && operator && !fresh) {
      const result = compute(stored, current, operator);
      if (!Number.isFinite(result)) {
        setError('Tidak bisa dibagi 0');
        return;
      }
      setStored(result);
      setDisplay(String(result));
    } else {
      setStored(current);
    }
    setOperator(op);
    setFresh(true);
  };

  const resolveAmount = (): number | null => {
    let value = current;
    if (stored !== null && operator) {
      value = compute(stored, current, operator);
    }
    if (!Number.isFinite(value)) {
      setError('Tidak bisa dibagi 0');
      return null;
    }
    const amount = Math.round(Math.abs(value));
    if (amount <= 0) {
      setError('Jumlah harus lebih dari 0');
      return null;
    }
    return amount;
  };

  const equals = () => {
    if (stored === null || !operator) return;
    const result = compute(stored, current, operator);
    if (!Number.isFinite(result)) {
      setError('Tidak bisa dibagi 0');
      return;
    }
    setDisplay(String(result));
    setStored(null);
    setOperator(null);
    setFresh(true);
    setError(null);
  };

  const handleApply = () => {
    const amount = resolveAmount();
    if (amount === null) return;
    onApply(amount);
    onClose();
  };

  const keys: {
    label: ReactNode;
    onClick: () => void;
    className?: string;
    wide?: boolean;
  }[] = [
    { label: 'C', onClick: clearAll, className: 'bg-coral-soft text-coral ring-coral/20' },
    {
      label: <Delete className="mx-auto h-5 w-5" />,
      onClick: backspace,
      className: 'bg-mist-deep text-ink',
    },
    { label: '÷', onClick: () => chooseOperator('÷'), className: 'bg-accent-soft text-accent' },
    { label: '×', onClick: () => chooseOperator('×'), className: 'bg-accent-soft text-accent' },
    { label: '7', onClick: () => inputDigit('7') },
    { label: '8', onClick: () => inputDigit('8') },
    { label: '9', onClick: () => inputDigit('9') },
    { label: '−', onClick: () => chooseOperator('-'), className: 'bg-accent-soft text-accent' },
    { label: '4', onClick: () => inputDigit('4') },
    { label: '5', onClick: () => inputDigit('5') },
    { label: '6', onClick: () => inputDigit('6') },
    { label: '+', onClick: () => chooseOperator('+'), className: 'bg-accent-soft text-accent' },
    { label: '1', onClick: () => inputDigit('1') },
    { label: '2', onClick: () => inputDigit('2') },
    { label: '3', onClick: () => inputDigit('3') },
    {
      label: <Equal className="mx-auto h-5 w-5" />,
      onClick: equals,
      className: 'bg-accent text-white hover:brightness-95 ring-accent/20',
    },
    { label: '0', onClick: () => inputDigit('0'), wide: true },
    { label: '000', onClick: () => appendDigits('000'), className: 'text-sm' },
    { label: ',', onClick: inputDot },
  ];

  const preview = Math.round(Math.abs(Number.isFinite(current) ? current : 0));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kalkulator" size="sm" showBrand={false}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-mist/80 px-4 py-3">
          <p className="text-xs font-medium text-muted">
            {stored !== null && operator
              ? `${formatDisplay(String(stored))} ${operator}`
              : 'Masukkan perhitungan'}
          </p>
          <p className="mt-1 break-all text-right font-display text-3xl font-bold tabular text-ink">
            {formatDisplay(display)}
          </p>
          <p className="mt-1 text-right text-sm tabular text-muted">
            ≈ {formatCurrency(preview)}
          </p>
        </div>

        {error && <p className="text-sm font-medium text-coral">{error}</p>}

        <div className="grid grid-cols-4 gap-2">
          {keys.map((key, index) => (
            <button
              key={index}
              type="button"
              onClick={key.onClick}
              className={cn(
                'min-h-12 rounded-2xl bg-surface text-lg font-semibold text-ink ring-1 ring-line transition active:scale-[0.98] hover:bg-mist',
                key.className,
                key.wide && 'col-span-2'
              )}
            >
              {key.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Batal
          </Button>
          <Button type="button" variant="gradient" onClick={handleApply} className="flex-1">
            Gunakan
          </Button>
        </div>
      </div>
    </Modal>
  );
}
