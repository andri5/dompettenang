import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { sendCreated, sendError, sendNotFound, sendForbidden } from '../utils/response.js';
import { AVATARS_DIR, PROOFS_DIR, RECEIPTS_DIR } from '../middlewares/upload.middleware.js';
import type { AuthenticatedRequest } from '../types/index.js';

export class UploadController {
  async uploadReceipt(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user?.userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const file = req.file;
      if (!file) {
        sendError(res, 'File struk wajib diunggah', 400, 'FILE_REQUIRED');
        return;
      }

      const url = `/uploads/receipts/${file.filename}`;

      sendCreated(
        res,
        {
          url,
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        },
        'Receipt uploaded successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload receipt';
      sendError(res, message, 400, 'UPLOAD_FAILED');
    }
  }

  async uploadAvatar(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as AuthenticatedRequest).user;
      if (!authUser?.userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const file = req.file;
      if (!file) {
        sendError(res, 'Foto profil wajib diunggah', 400, 'FILE_REQUIRED');
        return;
      }

      const avatar = `/uploads/avatars/${file.filename}`;

      const user = await prisma.user.update({
        where: { id: authUser.userId },
        data: { avatar },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      sendCreated(
        res,
        {
          url: avatar,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            currency: user.currency,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
        'Avatar uploaded successfully'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload avatar';
      sendError(res, message, 400, 'UPLOAD_FAILED');
    }
  }

  /**
   * Serve upload only if the authenticated user owns the file.
   */
  async serveFile(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as AuthenticatedRequest).user;
      if (!authUser?.userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const kind = String(req.params.kind || '');
      const filename = path.basename(String(req.params.filename || ''));

      if (!['receipts', 'avatars', 'proofs'].includes(kind) || !filename) {
        sendNotFound(res, 'File not found');
        return;
      }

      const publicPath = `/uploads/${kind}/${filename}`;
      const diskRoot =
        kind === 'receipts' ? RECEIPTS_DIR : kind === 'avatars' ? AVATARS_DIR : PROOFS_DIR;
      const absolute = path.resolve(diskRoot, filename);

      if (!absolute.startsWith(path.resolve(diskRoot))) {
        sendForbidden(res, 'Invalid path');
        return;
      }

      if (!fs.existsSync(absolute)) {
        sendNotFound(res, 'File not found');
        return;
      }

      if (kind === 'avatars') {
        const owner = await prisma.user.findFirst({
          where: { id: authUser.userId, avatar: publicPath },
          select: { id: true },
        });
        const ownedByName = filename.startsWith(`${authUser.userId}-`);
        if (!owner && !ownedByName) {
          sendForbidden(res, 'You do not have access to this file');
          return;
        }
      } else if (kind === 'proofs') {
        const isAdmin = authUser.role === 'ADMIN';
        const request = await prisma.proPurchaseRequest.findFirst({
          where: {
            proofPath: publicPath,
            ...(isAdmin ? {} : { userId: authUser.userId }),
          },
          select: { id: true },
        });
        const ownedByName = filename.startsWith(`${authUser.userId}-`);
        if (!request && !ownedByName && !isAdmin) {
          sendForbidden(res, 'You do not have access to this file');
          return;
        }
      } else {
        const expense = await prisma.expense.findFirst({
          where: {
            userId: authUser.userId,
            receiptUrl: publicPath,
            deletedAt: null,
          },
          select: { id: true },
        });
        const ownedByName = filename.startsWith(`${authUser.userId}-`);
        if (!expense && !ownedByName) {
          sendForbidden(res, 'You do not have access to this file');
          return;
        }
      }

      res.sendFile(absolute);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to serve file';
      sendError(res, message, 400, 'FILE_SERVE_FAILED');
    }
  }
}

export const uploadController = new UploadController();
