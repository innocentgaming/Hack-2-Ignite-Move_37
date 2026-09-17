import { Router } from 'express';
import { documentController } from '../controllers/document.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All document management routes require authentication
router.use(authenticate);

// GET /api/v1/documents
router.get('/', documentController.getDocuments.bind(documentController));

// GET /api/v1/documents/:id
router.get('/:id', documentController.getDocumentById.bind(documentController));

// GET /api/v1/documents/:id/download
router.get('/:id/download', documentController.downloadDocument.bind(documentController));

// POST /api/v1/documents/upload
router.post('/upload', documentController.uploadDocument.bind(documentController));

// DELETE /api/v1/documents/:id
router.delete('/:id', documentController.deleteDocument.bind(documentController));

export const documentRouter = router;
