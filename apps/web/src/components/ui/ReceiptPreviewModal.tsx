/**
 * Dompet Tenang - Receipt image / PDF preview modal
 */

import { ExternalLink, FileText } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useAuthenticatedFileUrl } from '@/hooks/useAuthenticatedFileUrl';
import { Spinner } from './Spinner';

export interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl?: string | null;
  title?: string;
}

function isPdf(path: string) {
  return path.toLowerCase().includes('.pdf');
}

export function ReceiptPreviewModal({
  isOpen,
  onClose,
  receiptUrl,
  title = 'Preview Struk',
}: ReceiptPreviewModalProps) {
  const { url, isLoading, error } = useAuthenticatedFileUrl(
    isOpen ? receiptUrl : null
  );
  const pdf = receiptUrl ? isPdf(receiptUrl) : false;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" showBrand={false}>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : error || !url ? (
        <p className="text-sm text-muted">Struk tidak tersedia.</p>
      ) : pdf ? (
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-mist/70 px-4 py-10 text-center">
            <FileText className="h-12 w-12 text-coral" />
            <p className="text-sm font-semibold text-ink">Dokumen PDF</p>
            <p className="max-w-sm text-xs text-muted">
              Preview PDF dibuka di tab baru agar tampilan lebih jelas.
            </p>
          </div>
          <a href={url} target="_blank" rel="noreferrer" className="block">
            <Button
              type="button"
              variant="gradient"
              className="w-full"
              rightIcon={<ExternalLink className="h-4 w-4" />}
            >
              Buka PDF
            </Button>
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-line bg-mist/40">
            <img
              src={url}
              alt="Preview struk"
              className="mx-auto max-h-[70vh] w-full object-contain"
            />
          </div>
          <a href={url} target="_blank" rel="noreferrer" className="block">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              rightIcon={<ExternalLink className="h-4 w-4" />}
            >
              Buka ukuran penuh
            </Button>
          </a>
        </div>
      )}
    </Modal>
  );
}
