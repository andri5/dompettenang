import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller.js';
import { authMiddleware } from '../middlewares/index.js';
import { avatarUpload, receiptUpload } from '../middlewares/upload.middleware.js';
import { sendError } from '../utils/response.js';

const router = Router();

router.use(authMiddleware);

function handleMulter(upload: ReturnType<typeof receiptUpload.single>) {
  return (req: any, res: any, next: any) => {
    upload(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        sendError(res, message, 400, 'UPLOAD_FAILED');
        return;
      }
      next();
    });
  };
}

/**
 * @route   POST /api/v1/uploads/receipt
 * @desc    Upload receipt image or PDF
 * @access  Private
 */
router.post(
  '/receipt',
  handleMulter(receiptUpload.single('receipt')),
  (req, res) => uploadController.uploadReceipt(req, res)
);

/**
 * @route   POST /api/v1/uploads/avatar
 * @desc    Upload profile photo
 * @access  Private
 */
router.post(
  '/avatar',
  handleMulter(avatarUpload.single('avatar')),
  (req, res) => uploadController.uploadAvatar(req, res)
);

/**
 * @route   GET /api/v1/uploads/content/:kind/:filename
 * @desc    Auth-gated download for receipts/avatars
 * @access  Private
 */
router.get('/content/:kind/:filename', (req, res) =>
  uploadController.serveFile(req, res)
);

export default router;
