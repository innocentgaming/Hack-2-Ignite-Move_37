import { Request, Response, NextFunction } from 'express';
import { documentService } from '../services/document.service.js';
import { ValidationError } from '@internos/shared';

export class DocumentController {
  /**
   * GET /api/v1/documents
   * List documents accessible to the caller within their organization
   */
  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const entityType = req.query.entityType as string | undefined;
      const entityId = req.query.entityId as string | undefined;
      const ownerId = req.query.ownerId as string | undefined;

      const result = await documentService.getDocuments(user, {
        page,
        limit,
        entityType,
        entityId,
        ownerId,
      });

      res.status(200).json({
        success: true,
        data: result.documents,
        meta: {
          total: result.total,
          page,
          limit,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/documents/:id
   * Get metadata for a specific document with authorization check
   */
  async getDocumentById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;

      const doc = await documentService.getDocumentById(user, id);

      res.status(200).json({
        success: true,
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/documents/:id/download
   * Stream / download private binary document file with backend authorization check
   */
  async downloadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;

      const file = await documentService.downloadDocument(user, id);

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.filename)}"`);
      res.setHeader('Content-Length', file.buffer.length);
      res.status(200).send(file.buffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/documents/upload
   * Upload file and save document metadata (accepts multipart file or JSON base64/content)
   */
  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      let buffer: Buffer;
      let filename: string;
      let mimeType: string;

      // Check if uploaded via multer (req.file)
      if (req.file) {
        buffer = req.file.buffer;
        filename = req.file.originalname;
        mimeType = req.file.mimetype;
      } else if (req.body.content || req.body.base64) {
        // Fallback for direct JSON payloads
        filename = req.body.filename || req.body.name || 'document.pdf';
        mimeType = req.body.mimeType || 'application/pdf';
        const raw = req.body.base64 || req.body.content;
        buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, req.body.base64 ? 'base64' : 'utf-8');
      } else {
        throw new ValidationError('File is required for document upload (file upload or content string)');
      }

      const entityRelation = req.body.entityType && req.body.entityId ? {
        entityType: req.body.entityType,
        entityId: req.body.entityId,
      } : (req.body.internshipId ? {
        entityType: 'INTERNSHIP',
        entityId: req.body.internshipId,
      } : undefined);

      const isPrivate = req.body.isPrivate !== undefined
        ? req.body.isPrivate === true || req.body.isPrivate === 'true'
        : true;

      const doc = await documentService.uploadDocument({
        organizationId: user.organizationId,
        ownerId: user.id || (user as any).userId,
        filename,
        mimeType,
        buffer,
        entityRelation,
        isPrivate,
      });

      res.status(201).json({
        success: true,
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/documents/:id
   * Delete document metadata and underlying storage file
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { id } = req.params;

      const result = await documentService.deleteDocument(user, id);

      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}

export const documentController = new DocumentController();
