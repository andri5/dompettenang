/**
 * Compress camera/gallery images before upload (mobile photos are often >5MB).
 */

const MAX_EDGE = 1400;
const JPEG_QUALITY = 0.78;
const TARGET_BYTES = 1.2 * 1024 * 1024;

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Gagal kompres gambar'))),
      type,
      quality
    );
  });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Gambar tidak bisa dibaca'));
    };
    img.src = url;
  });
}

/** True for raster images we can draw to canvas (not PDF/HEIC). */
export function canCompressImage(file: File): boolean {
  const type = (file.type || '').toLowerCase();
  if (type === 'image/jpeg' || type === 'image/jpg' || type === 'image/png' || type === 'image/webp') {
    return true;
  }
  // Some Android browsers send empty MIME for camera shots
  if (!type && /\.(jpe?g|png|webp)$/i.test(file.name || '')) {
    return true;
  }
  return false;
}

/**
 * Downscale + JPEG-encode large photos. Returns original file if already small / not compressible.
 */
export async function compressImageForUpload(file: File): Promise<File> {
  if (!canCompressImage(file)) return file;
  if (file.size <= TARGET_BYTES && file.size <= 5 * 1024 * 1024) {
    // Still normalize huge-dimension small-filesize photos for faster OCR
    // Continue only if larger than target OR bigger than ~3MB
  }
  if (file.size <= 900 * 1024) return file;

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    let quality = JPEG_QUALITY;
    let blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    while (blob.size > TARGET_BYTES && quality > 0.5) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    }

    const baseName = (file.name || 'struk').replace(/\.[^.]+$/, '') || 'struk';
    return new File([blob], `${baseName}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
