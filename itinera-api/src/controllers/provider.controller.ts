import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * POST /api/providers
 * Provider creates their business profile (linked to their user account)
 */
export const createProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { provider_type, business_name, description, phone } = req.body;

    const existing = await prisma.provider.findUnique({
      where: { user_id: req.user!.id },
    });
    if (existing) {
      res.status(409).json({ success: false, message: 'Provider profile already exists' });
      return;
    }

    const provider = await prisma.provider.create({
      data: {
        user_id: req.user!.id,
        provider_type,
        business_name,
        description: description || '',
        phone: phone || null,
        documents: [],
        status: 'pending',
      },
      include: { user: { select: { id: true, email: true, full_name: true } } },
    });

    res.status(201).json({ success: true, data: provider });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create provider profile', error });
  }
};

/**
 * GET /api/providers
 * Admin: Get all providers, filterable by status and type
 */
export const getProviders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, provider_type, page = 1, per_page = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(per_page);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (provider_type) where.provider_type = provider_type;

    const [providers, total] = await Promise.all([
      prisma.provider.findMany({
        where,
        skip,
        take: Number(per_page),
        include: { user: { select: { id: true, email: true, full_name: true } } },
        orderBy: { created_at: 'desc' },
      }),
      prisma.provider.count({ where }),
    ]);

    res.json({
      success: true,
      data: providers,
      total,
      page: Number(page),
      per_page: Number(per_page),
      last_page: Math.ceil(total / Number(per_page)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch providers', error });
  }
};

/**
 * GET /api/providers/me
 * Provider gets their own profile
 */
export const getMyProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { user_id: req.user!.id },
      include: { user: { select: { id: true, email: true, full_name: true } } },
    });
    if (!provider) {
      res.status(404).json({ success: false, message: 'Provider profile not found' });
      return;
    }
    res.json({ success: true, data: provider });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch provider', error });
  }
};

/**
 * GET /api/providers/:id
 * Admin: Get provider by ID
 */
export const getProviderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const provider = await prisma.provider.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        user: { select: { id: true, email: true, full_name: true } },
        services: true,
      },
    });
    if (!provider) {
      res.status(404).json({ success: false, message: 'Provider not found' });
      return;
    }
    res.json({ success: true, data: provider });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch provider', error });
  }
};

/**
 * PATCH /api/providers/:id/approve
 * Admin: Approve a provider application
 */
export const approveProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const provider = await prisma.provider.update({
      where: { id: Number(req.params.id) },
      data: { status: 'approved' },
    });
    res.json({ success: true, data: provider, message: 'Provider approved successfully' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to approve provider' });
  }
};

/**
 * PATCH /api/providers/:id/reject
 * Admin: Reject a provider application with an optional reason
 */
export const rejectProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    const provider = await prisma.provider.update({
      where: { id: Number(req.params.id) },
      data: { status: 'rejected' },
    });
    res.json({
      success: true,
      data: provider,
      message: reason ? `Provider rejected: ${reason}` : 'Provider rejected',
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to reject provider' });
  }
};

/**
 * POST /api/providers/:id/documents
 * Provider: Upload business documents
 */
export const uploadDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    const newDocs = files.map(f => ({
      name: f.originalname,
      url: `/uploads/${f.filename}`,
      type: f.mimetype,
    }));

    const provider = await prisma.provider.findFirst({
      where: { id: Number(req.params.id), user_id: req.user!.id },
    });
    if (!provider) {
      res.status(403).json({ success: false, message: 'Not authorized' });
      return;
    }

    const existingDocs = Array.isArray(provider.documents) ? provider.documents : [];
    const updated = await prisma.provider.update({
      where: { id: Number(req.params.id) },
      data: { documents: [...(existingDocs as object[]), ...newDocs] },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Document upload failed', error });
  }
};
