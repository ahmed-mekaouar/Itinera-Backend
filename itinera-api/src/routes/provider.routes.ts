import { Router } from 'express';
import {
  createProvider, getProviders, getProviderById,
  approveProvider, rejectProvider, getMyProvider, uploadDocuments
} from '../controllers/provider.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { upload } from '../utils/upload.utils';

const router = Router();

// Provider registers their business profile
router.post('/', authenticate, authorize('provider'), createProvider);

// Provider gets their own profile
router.get('/me', authenticate, authorize('provider'), getMyProvider);

// Provider uploads business documents
router.post('/:id/documents', authenticate, authorize('provider'),
  upload.array('documents', 5), uploadDocuments);

// Admin: list all providers with status filter
router.get('/', authenticate, authorize('admin'), getProviders);

// Admin: view specific provider
router.get('/:id', authenticate, authorize('admin'), getProviderById);

// Admin: approve/reject provider
router.patch('/:id/approve', authenticate, authorize('admin'), approveProvider);
router.patch('/:id/reject', authenticate, authorize('admin'), rejectProvider);

export default router;
