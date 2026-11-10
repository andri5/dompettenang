/** Map axios/upload failures to short Indonesian copy. */

export function receiptUploadErrorMessage(err: unknown): string {
  const anyErr = err as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: { message?: string } };
  };

  const status = anyErr?.response?.status;
  const serverMsg = anyErr?.response?.data?.message || '';

  if (status === 401) return 'Sesi berakhir. Silakan login ulang, lalu unggah lagi.';
  if (status === 413) return 'Foto terlalu besar. Coba foto ulang atau pilih gambar lebih kecil.';
  if (status === 429) return 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.';
  if (
    /file too large|ukuran|maksimal|LIMIT_FILE_SIZE/i.test(serverMsg) ||
    /file too large/i.test(anyErr?.message || '')
  ) {
    return 'Foto terlalu besar untuk server. Coba foto ulang lebih dekat.';
  }
  if (anyErr?.code === 'ECONNABORTED' || /timeout/i.test(anyErr?.message || '')) {
    return 'Koneksi timeout saat mengunggah. Coba lagi (lebih baik pakai Wi-Fi).';
  }
  if (status && status >= 500) {
    return 'Server sedang bermasalah saat menerima struk. Coba lagi sebentar.';
  }
  return serverMsg || 'Gagal mengunggah struk. Coba lagi.';
}
