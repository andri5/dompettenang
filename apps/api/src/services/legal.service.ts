import { prisma } from '../utils/prisma.js';

export type LegalDocumentKey = 'terms' | 'privacy';

const DEFAULT_DOCS: Array<{
  key: LegalDocumentKey;
  title: string;
  body: string;
}> = [
  {
    key: 'terms',
    title: 'Syarat & Ketentuan',
    body: [
      'Dengan mendaftar dan menggunakan Dompet Tenang, Anda menyetujui untuk memakai aplikasi sebagai catatan keuangan pribadi secara wajar dan sesuai hukum yang berlaku.',
      'Anda bertanggung jawab menjaga kerahasiaan akun (email dan password). Dompet Tenang tidak bertanggung jawab atas kerugian akibat kelalaian menjaga kredensial atau penggunaan perangkat yang tidak aman.',
      'Data transaksi yang Anda masukkan milik Anda. Kami menyediakan layanan penyimpanan dan tampilan untuk membantu pengelolaan keuangan pribadi, tanpa jaminan hasil investasi atau saran keuangan profesional.',
      'Kami dapat memperbarui ketentuan ini dari waktu ke waktu. Penggunaan berkelanjutan setelah pembaruan dianggap sebagai persetujuan terhadap ketentuan terbaru.',
    ].join('\n\n'),
  },
  {
    key: 'privacy',
    title: 'Kebijakan Privasi',
    body: [
      'Dompet Tenang menyimpan data akun (nama, email, preferensi) dan data keuangan yang Anda catat (transaksi, kategori, unggahan struk/avatar) untuk menyediakan fitur aplikasi.',
      'Data digunakan untuk autentikasi, sinkronisasi antar perangkat, dan menampilkan ringkasan dashboard. Kami tidak menjual data pribadi Anda kepada pihak ketiga untuk iklan.',
      'Unggahan (struk, avatar) dilindungi di server dan hanya dapat diakses oleh akun yang berwenang. Anda dapat meminta penghapusan akun dengan menghubungi pengelola layanan.',
      'Keamanan: password di-hash; sesi memakai token yang dapat dibatalkan. Tetap gunakan password yang kuat dan jangan bagikan tautan reset password.',
    ].join('\n\n'),
  },
];

export async function ensureDefaultLegalDocuments() {
  for (const doc of DEFAULT_DOCS) {
    await prisma.legalDocument.upsert({
      where: { key: doc.key },
      create: {
        key: doc.key,
        title: doc.title,
        body: doc.body,
      },
      update: {},
    });
  }
}

export async function listLegalDocuments() {
  await ensureDefaultLegalDocuments();
  return prisma.legalDocument.findMany({
    orderBy: { key: 'asc' },
    select: {
      key: true,
      title: true,
      body: true,
      updatedAt: true,
      updatedById: true,
    },
  });
}

export async function getLegalDocument(key: string) {
  await ensureDefaultLegalDocuments();
  return prisma.legalDocument.findUnique({
    where: { key },
    select: {
      key: true,
      title: true,
      body: true,
      updatedAt: true,
    },
  });
}

export async function updateLegalDocument(
  key: string,
  data: { title?: string; body?: string },
  updatedById?: string
) {
  await ensureDefaultLegalDocuments();
  const existing = await prisma.legalDocument.findUnique({ where: { key } });
  if (!existing) {
    throw new Error('NOT_FOUND');
  }

  const title = data.title?.trim();
  const body = data.body?.trim();

  if (title !== undefined && title.length < 3) {
    throw new Error('TITLE_INVALID');
  }
  if (body !== undefined && body.length < 20) {
    throw new Error('BODY_INVALID');
  }

  return prisma.legalDocument.update({
    where: { key },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(body !== undefined ? { body } : {}),
      ...(updatedById ? { updatedById } : {}),
    },
    select: {
      key: true,
      title: true,
      body: true,
      updatedAt: true,
      updatedById: true,
    },
  });
}
