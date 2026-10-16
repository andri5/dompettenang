/**
 * Dompet Tenang - Receipt file upload (image / PDF)
 */

import { useEffect, useRef, useState } from 'react';
import { FileText, ImagePlus, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { uploadReceipt } from '@/services/upload.service';
import { useAuthenticatedFileUrl } from '@/hooks/useAuthenticatedFileUrl';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { ReceiptPreviewModal } from './ReceiptPreviewModal';
import { FieldTooltip } from './FieldTooltip';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface ReceiptUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  error?: string;
  disabled?: boolean;
}

function isPdf(url: string) {
  return url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');
}

export function ReceiptUpload({ value, onChange, error, disabled }: ReceiptUploadProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { url: remotePreview } = useAuthenticatedFileUrl(localPreview ? null : value);

  const displayUrl = localPreview || remotePreview;

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const handleFile = async (file: File | undefined) => {
    if (!file || disabled) return;

    if (!ACCEPT.split(',').includes(file.type)) {
      toast.error('Format harus gambar (JPG, PNG, WEBP, GIF) atau PDF');
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    if (localPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview);
    }

    const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setLocalPreview(preview);
    setIsUploading(true);

    try {
      const result = await uploadReceipt(file);
      onChange(result.url);
      toast.success('Struk berhasil diunggah');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Gagal mengunggah struk. Coba lagi.';
      toast.error(message);
      if (preview) URL.revokeObjectURL(preview);
      setLocalPreview(null);
      onChange(null);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const clear = () => {
    if (localPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview);
    }
    setLocalPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
        <span>
          Struk / Bukti <span className="font-medium text-muted">(opsional)</span>
        </span>
        <FieldTooltip content="Unggah foto atau PDF bukti transaksi (maks. 5MB). Bisa di-preview dari daftar transaksi lewat label Struk." />
      </label>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={disabled || isUploading}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {!value && !localPreview ? (
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-mist/40 px-4 py-8 text-center transition hover:border-accent hover:bg-accent-soft/40',
            (disabled || isUploading) && 'pointer-events-none opacity-60',
            error && 'border-coral'
          )}
        >
          {isUploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          ) : (
            <ImagePlus className="h-8 w-8 text-accent" />
          )}
          <div>
            <p className="text-sm font-semibold text-ink">
              {isUploading ? 'Mengunggah...' : 'Unggah gambar atau PDF'}
            </p>
            <p className="mt-1 text-xs text-muted">JPG, PNG, WEBP, GIF, PDF · maks. 5MB</p>
          </div>
        </button>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-stretch gap-3 p-3">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-mist">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
              ) : displayUrl && !isPdf(displayUrl) && !isPdf(value || '') ? (
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="h-full w-full"
                  aria-label="Preview struk"
                >
                  <img
                    src={displayUrl}
                    alt="Preview struk"
                    className="h-full w-full object-cover"
                  />
                </button>
              ) : (
                <FileText className="h-8 w-8 text-coral" />
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
              <p className="truncate text-sm font-semibold text-ink">
                {isUploading
                  ? 'Mengunggah struk...'
                  : value && isPdf(value)
                    ? 'Dokumen PDF'
                    : 'Gambar struk'}
              </p>
              <div className="flex flex-wrap gap-2">
                {displayUrl && !isUploading && (
                  <button
                    type="button"
                    onClick={() => setShowPreview(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                  >
                    Lihat
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isUploading}
                  onClick={() => inputRef.current?.click()}
                >
                  Ganti
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={isUploading}
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={clear}
                  className="text-coral hover:text-coral"
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-sm text-coral">{error}</p>}

      <ReceiptPreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        receiptUrl={localPreview || value}
        title="Preview Struk"
      />
    </div>
  );
}
