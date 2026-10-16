import { useEffect, useState, type ReactNode } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { subscribeAppStatus, emitAppStatus, resetAppStatusDedup } from '../lib/appStatus';
import { flushOfflineQueue } from '../lib/offlineQueue';
import { FancyDialog } from './AppDialog';

export function AppStatusProvider({ children }: { children: ReactNode }) {
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [serverOpen, setServerOpen] = useState(false);
  const [maintOpen, setMaintOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | undefined>();
  const [offlineMsg, setOfflineMsg] = useState<string | undefined>();
  const [serverMsg, setServerMsg] = useState<string | undefined>();
  const [maintMsg, setMaintMsg] = useState<string | undefined>();

  useEffect(() => {
    const unsub = subscribeAppStatus((event) => {
      if (event.type === 'offline') {
        setOfflineMsg(event.message);
        setOfflineOpen(true);
      }
      if (event.type === 'server') {
        setServerMsg(event.message);
        setServerOpen(true);
      }
      if (event.type === 'maintenance') {
        setMaintMsg(event.message);
        setMaintOpen(true);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected === false) {
        emitAppStatus({
          type: 'offline',
          message: 'Koneksi terputus. Transaksi baru bisa disimpan offline dan dikirim nanti.',
        });
      } else if (state.isConnected === true && state.isInternetReachable !== false) {
        resetAppStatusDedup();
        void flushOfflineQueue().then((result) => {
          if (result.flushed > 0) {
            setSyncMsg(
              `${result.flushed} transaksi offline berhasil dikirim${
                result.remaining > 0 ? ` (${result.remaining} masih tertunda)` : ''
              }.`
            );
            setSyncOpen(true);
          }
        });
      }
    });
    return () => unsub();
  }, []);

  return (
    <>
      {children}
      <FancyDialog
        visible={offlineOpen}
        variant="offline"
        title="Tidak ada internet"
        message={
          offlineMsg ||
          'Periksa koneksi Wi‑Fi atau data seluler. Transaksi bisa disimpan offline dulu.'
        }
        confirmLabel="Coba lagi"
        cancelLabel="Mengerti"
        showCancel
        onConfirm={() => {
          void NetInfo.fetch().then((s) => {
            if (s.isConnected === false) {
              emitAppStatus({ type: 'offline' });
            }
          });
        }}
        onRequestClose={() => setOfflineOpen(false)}
      />
      <FancyDialog
        visible={syncOpen}
        variant="success"
        title="Sinkron offline"
        message={syncMsg || 'Antrian offline sudah dikirim.'}
        confirmLabel="Baik"
        onRequestClose={() => setSyncOpen(false)}
      />
      <FancyDialog
        visible={serverOpen}
        variant="error"
        title="Server tidak terjangkau"
        message={
          serverMsg ||
          'Tidak bisa terhubung ke server Dompet Tenang. Periksa koneksi internet, lalu coba lagi.'
        }
        confirmLabel="Mengerti"
        onRequestClose={() => setServerOpen(false)}
      />
      <FancyDialog
        visible={maintOpen}
        variant="maintenance"
        title="Sedang maintenance"
        message={
          maintMsg ||
          'Dompet Tenang sementara dalam perawatan. Data kamu aman — silakan coba beberapa saat lagi.'
        }
        confirmLabel="Coba lagi"
        cancelLabel="Mengerti"
        showCancel
        onRequestClose={() => setMaintOpen(false)}
      />
    </>
  );
}
