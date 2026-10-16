import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { type ThemeColors } from '../theme';
import { useColors } from '../themeContext';
import { formatIDR } from '../lib/format';

type Operator = '+' | '-' | '×' | '÷';

export type AmountCalculatorProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (amount: number) => void;
  initialValue?: number;
};

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
  visible,
  onClose,
  onApply,
  initialValue,
}: AmountCalculatorProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [fresh, setFresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    const start =
      typeof initialValue === 'number' && Number.isFinite(initialValue) && initialValue > 0
        ? String(Math.round(initialValue))
        : '0';
    setDisplay(start);
    setStored(null);
    setOperator(null);
    setFresh(true);
    setError(null);
  }, [visible, initialValue]);

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
    let value = current;
    if (stored !== null && operator) {
      value = compute(stored, current, operator);
    }
    if (!Number.isFinite(value)) {
      setError('Tidak bisa dibagi 0');
      return;
    }
    const amount = Math.round(Math.abs(value));
    if (amount <= 0) {
      setError('Jumlah harus lebih dari 0');
      return;
    }
    onApply(amount);
    onClose();
  };

  const keys: { label: string; onPress: () => void; tone?: 'accent' | 'danger' | 'primary' }[] = [
    { label: 'C', onPress: clearAll, tone: 'danger' },
    { label: '⌫', onPress: backspace },
    { label: '÷', onPress: () => chooseOperator('÷'), tone: 'accent' },
    { label: '×', onPress: () => chooseOperator('×'), tone: 'accent' },
    { label: '7', onPress: () => appendDigits('7') },
    { label: '8', onPress: () => appendDigits('8') },
    { label: '9', onPress: () => appendDigits('9') },
    { label: '−', onPress: () => chooseOperator('-'), tone: 'accent' },
    { label: '4', onPress: () => appendDigits('4') },
    { label: '5', onPress: () => appendDigits('5') },
    { label: '6', onPress: () => appendDigits('6') },
    { label: '+', onPress: () => chooseOperator('+'), tone: 'accent' },
    { label: '1', onPress: () => appendDigits('1') },
    { label: '2', onPress: () => appendDigits('2') },
    { label: '3', onPress: () => appendDigits('3') },
    { label: '=', onPress: equals, tone: 'primary' },
    { label: '0', onPress: () => appendDigits('0') },
    { label: '000', onPress: () => appendDigits('000') },
    { label: ',', onPress: inputDot },
  ];

  const keyWidth = Math.min(72, (width - 72) / 4);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Kalkulator</Text>
          <View style={styles.displayBox}>
            <Text style={styles.opHint}>
              {stored !== null && operator ? `${stored} ${operator}` : 'Masukkan perhitungan'}
            </Text>
            <Text style={styles.display}>{display}</Text>
            <Text style={styles.preview}>
              ≈ {formatIDR(Math.round(Math.abs(Number.isFinite(current) ? current : 0)))}
            </Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.grid}>
            {keys.map((key) => (
              <Pressable
                key={key.label}
                onPress={key.onPress}
                style={[
                  styles.key,
                  { width: keyWidth },
                  key.tone === 'accent' && styles.keyAccent,
                  key.tone === 'danger' && styles.keyDanger,
                  key.tone === 'primary' && styles.keyPrimary,
                ]}
              >
                <Text
                  style={[
                    styles.keyText,
                    key.tone === 'accent' && styles.keyTextAccent,
                    key.tone === 'primary' && styles.keyTextPrimary,
                    key.tone === 'danger' && styles.keyTextDanger,
                  ]}
                >
                  {key.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Batal</Text>
            </Pressable>
            <Pressable style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyText}>Gunakan</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(7,17,31,0.62)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      padding: 20,
      paddingBottom: 28,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.5)',
      shadowColor: '#07111f',
      shadowOpacity: 0.25,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: -8 },
      elevation: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 12,
      letterSpacing: -0.2,
    },
    displayBox: {
      backgroundColor: colors.brandSoft,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.brandSoftBorder,
      padding: 14,
      marginBottom: 10,
    },
    opHint: { color: colors.muted, fontSize: 12 },
    display: {
      marginTop: 6,
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      textAlign: 'right',
    },
    preview: { marginTop: 4, textAlign: 'right', color: colors.muted, fontSize: 13 },
    error: { color: colors.expense, marginBottom: 8, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    key: {
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    keyAccent: { backgroundColor: colors.brandSoft, borderColor: colors.brandSoftBorder },
    keyDanger: { backgroundColor: colors.dangerBg, borderColor: colors.expenseBorder },
    keyPrimary: { backgroundColor: colors.brand, borderColor: colors.brand },
    keyText: { fontSize: 18, fontWeight: '700', color: colors.text },
    keyTextAccent: { color: colors.brandDark },
    keyTextPrimary: { color: colors.onBrand },
    keyTextDanger: { color: colors.dangerText },
    actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    cancelBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelText: { fontWeight: '700', color: colors.muted },
    applyBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      backgroundColor: colors.brand,
    },
    applyText: { fontWeight: '700', color: colors.onBrand },
  });
}
