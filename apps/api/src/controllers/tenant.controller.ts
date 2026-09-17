import { Request, Response, NextFunction } from 'express';
import { formatSuccessResponse } from '@internos/shared';
import { tenantService } from '../services/tenant.service.js';

export async function getCurrentTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const org = await tenantService.getCurrentTenant(req.organizationId!);
    res.status(200).json(formatSuccessResponse(org));
  } catch (error) {
    next(error);
  }
}

export async function getDepartments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const departments = await tenantService.getDepartments(req.organizationId!);
    res.status(200).json(formatSuccessResponse(departments));
  } catch (error) {
    next(error);
  }
}

export async function getInternships(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const internships = await tenantService.getInternships(req.organizationId!);
    res.status(200).json(formatSuccessResponse(internships));
  } catch (error) {
    next(error);
  }
}

export async function getInternshipById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const internship = await tenantService.getInternshipById(req.organizationId!, req.params.id);
    res.status(200).json(formatSuccessResponse(internship));
  } catch (error) {
    next(error);
  }
}

export async function createInternship(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const studentId = req.user?.id || 'student-default';
    const internship = await tenantService.createInternship(req.organizationId!, studentId, req.body);
    res.status(201).json(formatSuccessResponse(internship));
  } catch (error) {
    next(error);
  }
}

export async function updateInternship(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const internship = await tenantService.updateInternship(req.organizationId!, req.params.id, req.body);
    res.status(200).json(formatSuccessResponse(internship));
  } catch (error) {
    next(error);
  }
}

export async function deleteInternship(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tenantService.deleteInternship(req.organizationId!, req.params.id);
    res.status(200).json(formatSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}

export async function getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const documents = await tenantService.getDocuments(req.organizationId!);
    res.status(200).json(formatSuccessResponse(documents));
  } catch (error) {
    next(error);
  }
}

export async function getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const doc = await tenantService.getDocumentById(req.organizationId!, req.params.id);
    res.status(200).json(formatSuccessResponse(doc));
  } catch (error) {
    next(error);
  }
}

export async function deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await tenantService.deleteDocument(req.organizationId!, req.params.id);
    res.status(200).json(formatSuccessResponse(result));
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await tenantService.getUsers(req.organizationId!);
    res.status(200).json(formatSuccessResponse(users));
  } catch (error) {
    next(error);
  }
}
