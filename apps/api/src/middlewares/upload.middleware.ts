/**
 * Multer middleware for receipt and avatar uploads
 */

import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { config } from '../config/index.js';

const receiptsDir = path.resolve(config.upload.dir, 'receipts');
const avatarsDir = path.resolve(config.upload.dir, 'avatars');
const proofsDir = path.resolve(config.upload.dir, 'proofs');

for (const dir of [receiptsDir, avatarsDir, proofsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const RECEIPT_MIME = new Set([...IMAGE_MIME, 'application/pdf']);

function makeStorage(destination: string) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.bin';
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'].includes(ext)
        ? ext
        : file.mimetype === 'application/pdf'
          ? '.pdf'
          : '.jpg';
      const userId =
        (req as { user?: { userId?: string } }).user?.userId?.replace(/[^a-zA-Z0-9-]/g, '') ||
        'anon';
      const unique = `${userId}-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${safeExt}`);
    },
  });
}

export const receiptUpload = multer({
  storage: makeStorage(receiptsDir),
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (_req, file, cb) => {
    if (!RECEIPT_MIME.has(file.mimetype)) {
      cb(new Error('Hanya file gambar (JPG, PNG, WEBP, GIF) atau PDF yang diizinkan'));
      return;
    }
    cb(null, true);
  },
});

export const avatarUpload = multer({
  storage: makeStorage(avatarsDir),
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIME.has(file.mimetype)) {
      cb(new Error('Hanya file gambar (JPG, PNG, WEBP, GIF) yang diizinkan'));
      return;
    }
    cb(null, true);
  },
});

export const proofUpload = multer({
  storage: makeStorage(proofsDir),
  limits: {
    fileSize: config.upload.maxFileSize,
  },
  fileFilter: (_req, file, cb) => {
    if (!IMAGE_MIME.has(file.mimetype) && file.mimetype !== 'application/pdf') {
      cb(new Error('Hanya file gambar atau PDF yang diizinkan untuk bukti transfer'));
      return;
    }
    cb(null, true);
  },
});

export const RECEIPTS_DIR = receiptsDir;
export const AVATARS_DIR = avatarsDir;
export const PROOFS_DIR = proofsDir;
