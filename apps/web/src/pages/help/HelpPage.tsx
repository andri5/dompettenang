/**
 * Dompet Tenang - Help / Bantuan Page
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Receipt,
  FolderOpen,
  Settings,
  Sparkles,
  Calculator,
  Paperclip,
  Palette,
  KeyRound,
  Camera,
  ChevronDown,
  ArrowRight,
  Lightbulb,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MainLayout, PageHeader, PageTransition } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface HelpSection {
  id: string;
  icon: typeof LayoutDashboard;
  title: string;
  summary: string;
  points: string[];
  tip?: string;
  link?: { to: string; label: string };
}

const helpSections: HelpSection[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    summary:
      'Ringkasan keuanganmu dalam satu tampilan: pemasukan, pengeluaran, saldo, grafik, dan saran otomatis.',
    points: [
      'Kartu ringkasan menampilkan total pemasukan, pengeluaran, dan saldo bersih untuk periode yang dipilih (Minggu / Bulan / Tahun).',
      'Grafik batang membandingkan pemasukan vs pengeluaran dari waktu ke waktu.',
      'Ringkasan per kategori memakai pie chart plus daftar nominal, jumlah transaksi, dan persentase.',
      'Bagian AI Saran & Notice memberi peringatan jika pengeluaran melebihi pemasukan, atau apresiasi jika ada surplus.',
      'Daftar transaksi terbaru memudahkan akses cepat ke catatan terakhir.',
    ],
    tip: 'Di Dashboard, Export Excel tersedia untuk semua akun. Export PDF adalah fitur Pro.',
    link: { to: ROUTES.DASHBOARD, label: 'Buka Dashboard' },
  },
  {
    id: 'transaksi',
    icon: ArrowLeftRight,
    title: 'Transaksi',
    summary:
      'Menu Transaksi menggabungkan Pemasukan dan Pengeluaran dalam satu tempat dengan submenu.',
    points: [
      'Di sidebar desktop, klik Transaksi untuk membuka submenu Pemasukan dan Pengeluaran.',
      'Di mobile, tap Transaksi di navigasi bawah untuk memilih daftar Pemasukan atau Pengeluaran.',
      'Tombol Catat (mobile) atau tombol Tambah di halaman daftar dipakai untuk membuat transaksi baru.',
    ],
    tip: 'Biasakan catat transaksi di hari yang sama agar dashboard dan saran AI tetap akurat.',
  },
  {
    id: 'pemasukan',
    icon: TrendingUp,
    title: 'Pemasukan',
    summary: 'Catat uang masuk seperti gaji, freelance, bonus, atau transfer masuk.',
    points: [
      'Isi jumlah, deskripsi, tanggal, dan kategori pemasukan.',
      'Pakai kalkulator di samping label Jumlah jika perlu menjumlah beberapa angka dulu.',
      'Unggah struk/bukti (opsional) berupa gambar atau PDF, lalu preview lewat label Struk di daftar.',
      'Edit atau hapus transaksi dari daftar pemasukan kapan saja.',
    ],
    tip: 'Kategori pemasukan terpisah dari pengeluaran — pilih yang sesuai agar laporan tidak tercampur.',
    link: { to: ROUTES.INCOMES, label: 'Buka Pemasukan' },
  },
  {
    id: 'pengeluaran',
    icon: Receipt,
    title: 'Pengeluaran',
    summary: 'Catat uang keluar harian: makan, transport, belanja, tagihan, dan lainnya.',
    points: [
      'Form sama seperti pemasukan: jumlah, deskripsi, tanggal, kategori, dan struk opsional.',
      'Filter daftar berdasarkan kategori atau rentang tanggal untuk audit belanja.',
      'Klik Struk pada item yang punya lampiran untuk melihat preview gambar.',
      'Mode tampilan list/grid tersedia agar nyaman di desktop maupun mobile.',
    ],
    tip: 'Upload struk belanja besar membantu kamu meninjau ulang pengeluaran di kemudian hari.',
    link: { to: ROUTES.EXPENSES, label: 'Buka Pengeluaran' },
  },
  {
    id: 'kalkulator',
    icon: Calculator,
    title: 'Kalkulator Nominal',
    summary: 'Hitung cepat di form transaksi sebelum menyimpan jumlah.',
    points: [
      'Buka lewat tombol Kalkulator di sebelah label Jumlah (Rp).',
      'Mendukung tambah, kurang, kali, bagi, tombol 000, dan pembulatan ke Rupiah.',
      'Tekan Gunakan agar hasil masuk ke field Jumlah secara otomatis.',
    ],
    tip: 'Berguna saat belanja banyak item — jumlahkan dulu, baru simpan sebagai satu transaksi.',
  },
  {
    id: 'struk',
    icon: Paperclip,
    title: 'Upload & Preview Struk',
    summary: 'Lampirkan bukti transaksi berupa gambar atau PDF (maks. 5MB).',
    points: [
      'Di form tambah/edit, area Struk / Bukti bersifat opsional.',
      'Format didukung: JPG, PNG, WEBP, GIF, dan PDF.',
      'Setelah tersimpan, daftar transaksi menampilkan label Struk — klik untuk preview.',
      'Di form, klik thumbnail atau Lihat juga membuka preview yang sama.',
    ],
    tip: 'Foto struk dengan cahaya cukup supaya teks tetap terbaca saat di-preview.',
  },
  {
    id: 'kategori',
    icon: FolderOpen,
    title: 'Kategori',
    summary: 'Kelompokkan transaksi agar laporan dan grafik lebih bermakna.',
    points: [
      'Ada kategori Default (bawaan sistem) untuk pemasukan dan pengeluaran — tidak bisa dihapus.',
      'Kamu bisa menambah kategori kustom dengan nama, ikon, dan warna.',
      'Kategori kustom boleh diedit atau dihapus; transaksi terkait biasanya dialihkan ke kategori Lainnya.',
      'Filter tipe kategori (pemasukan/pengeluaran) memastikan kategori dipakai di form yang tepat.',
    ],
    tip: 'Jangan terlalu banyak kategori di awal — mulai sederhana, pecah lagi jika sudah terbiasa mencatat.',
    link: { to: ROUTES.CATEGORIES, label: 'Buka Kategori' },
  },
  {
    id: 'saran-ai',
    icon: Sparkles,
    title: 'AI Saran & Notice',
    summary: 'Pesan otomatis di Dashboard berdasarkan perbandingan pemasukan dan pengeluaran.',
    points: [
      'Peringatan muncul jika pengeluaran melebihi atau hampir menyamai pemasukan.',
      'Pesan positif muncul saat ada surplus, lengkap dengan saran alokasi tabungan.',
      'Insight kategori memberi tahu kategori mana yang mendominasi pengeluaran.',
      'Saran menyesuaikan filter periode Minggu / Bulan / Tahun.',
    ],
    tip: 'Saran bersifat panduan, bukan nasihat keuangan formal — gunakan sebagai pengingat kebiasaan belanja.',
  },
  {
    id: 'pengaturan',
    icon: Settings,
    title: 'Pengaturan & Profil',
    summary: 'Kelola identitas akun, foto profil, dan preferensi tampilan.',
    points: [
      'Lihat nama, email, dan status akun di halaman Pengaturan.',
      'Unggah atau ganti foto profil lewat tombol kamera pada avatar.',
      'Keluar dari akun memakai tombol Keluar dari Akun di bagian bawah.',
    ],
    tip: 'Foto profil ikut tampil di sidebar agar akunmu lebih mudah dikenali.',
    link: { to: ROUTES.SETTINGS, label: 'Buka Pengaturan' },
  },
  {
    id: 'tema',
    icon: Palette,
    title: 'Tema Aplikasi',
    summary: 'Tiga pilihan tampilan yang tersimpan di perangkatmu.',
    points: [
      'Neo Ledger — tema terang teal (default).',
      'Midnight — tema gelap nyaman untuk malam hari.',
      'Ocean Mist — nuansa biru laut lembut.',
      'Pilihan tema tersimpan otomatis dan diterapkan di seluruh aplikasi.',
    ],
    tip: 'Coba Midnight jika sering mencatat di malam hari agar mata lebih nyaman.',
  },
  {
    id: 'akun-keamanan',
    icon: KeyRound,
    title: 'Akun & Keamanan',
    summary: 'Daftar, masuk, dan pulihkan akses jika lupa password.',
    points: [
      'Daftar dengan nama, email, dan password (min. 8 karakter, huruf + angka).',
      'Di halaman login, gunakan Lupa password? untuk mengajukan reset.',
      'Ikuti tautan reset, buat password baru, lalu masuk kembali.',
      'Setelah password diganti, sesi lama di perangkat lain ikut diakhiri demi keamanan.',
    ],
    tip: 'Simpan password di tempat aman. Jangan bagikan tautan reset kepada orang lain.',
  },
  {
    id: 'foto-profil',
    icon: Camera,
    title: 'Foto Profil',
    summary: 'Personalisasi akun dengan foto yang kamu unggah sendiri.',
    points: [
      'Format gambar: JPG, PNG, WEBP, atau GIF (maks. 5MB).',
      'Setelah berhasil diunggah, avatar di sidebar dan pengaturan langsung berubah.',
      'Kamu bisa mengganti foto kapan saja dari halaman Pengaturan.',
    ],
  },
];

function HelpAccordion({ section, defaultOpen }: { section: HelpSection; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const Icon = section.icon;

  return (
    <Card padding="none" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-4 text-left transition hover:bg-mist/50 sm:px-5"
        aria-expanded={open}
      >
        <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-ink sm:text-lg">{section.title}</p>
          <p className="mt-1 text-sm text-muted">{section.summary}</p>
        </div>
        <ChevronDown
          className={cn(
            'mt-2 h-5 w-5 flex-shrink-0 text-muted transition',
            open && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-line px-4 py-4 sm:px-5">
              <ul className="space-y-2.5">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-ink/85">
                    <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              {section.tip && (
                <div className="flex gap-2.5 rounded-2xl bg-accent-soft/60 px-3.5 py-3 ring-1 ring-accent/15">
                  <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                  <p className="text-sm text-ink/80">
                    <span className="font-semibold text-ink">Tips: </span>
                    {section.tip}
                  </p>
                </div>
              )}

              {section.link && (
                <Link to={section.link.to} className="inline-flex">
                  <Button
                    size="sm"
                    variant="outline"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    {section.link.label}
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

export function HelpPage() {
  return (
    <PageTransition>
      <MainLayout>
        <PageHeader
          eyebrow="Panduan"
          title="Bantuan"
          description="Penjelasan singkat tiap fitur penting di Dompet Tenang agar kamu lebih cepat mahir mencatat keuangan."
        />

        <Card padding="md" className="mb-5 border-accent/20 bg-gradient-to-br from-accent-soft/50 to-surface">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-bold text-ink">Cara cepat mulai</p>
              <p className="mt-1 text-sm text-muted">
                Catat pemasukan → catat pengeluaran → cek Dashboard. Ulangi setiap hari.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link to={ROUTES.INCOME_NEW}>
                <Button size="sm" variant="outline" className="w-full sm:w-auto">
                  + Pemasukan
                </Button>
              </Link>
              <Link to={ROUTES.EXPENSE_NEW}>
                <Button size="sm" variant="gradient" className="w-full sm:w-auto">
                  + Pengeluaran
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          {helpSections.map((section, index) => (
            <HelpAccordion
              key={section.id}
              section={section}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      </MainLayout>
    </PageTransition>
  );
}
