import { Request, Response, NextFunction } from 'express';
import { internshipService } from '../services/internship.service.js';
import { formatSuccessResponse } from '@internos/shared';
import {
  InternshipRegistrationDto,
  UpdateInternshipRegistrationDto,
  StateTransitionDto,
  ApprovalDecisionDto,
  AssignFacultyDto,
  AssignMentorDto,
  CreateCompanyDto,
  InternshipStatus,
} from '@internos/types';

export class InternshipController {
  // ==========================================
  // Companies
  // ==========================================

  async getCompanies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const companies = await internshipService.getCompanies(orgId);
      res.status(200).json(formatSuccessResponse(companies));
    } catch (err) {
      next(err);
    }
  }

  async createCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const dto: CreateCompanyDto = req.body;
      const company = await internshipService.createCompany(orgId, dto, req.user!.id);
      res.status(201).json(formatSuccessResponse(company));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Internships
  // ==========================================

  async getInternships(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const status = req.query.status as InternshipStatus | undefined;
      const search = req.query.search as string | undefined;

      const internships = await internshipService.getInternships(orgId, req.user!, {
        status,
        search,
      });
      res.status(200).json(formatSuccessResponse(internships));
    } catch (err) {
      next(err);
    }
  }

  async getInternshipById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const internship = await internshipService.getInternshipById(orgId, id);
      res.status(200).json(formatSuccessResponse(internship));
    } catch (err) {
      next(err);
    }
  }

  async registerInternship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const studentId = req.user!.id;
      const dto: InternshipRegistrationDto = req.body;

      const internship = await internshipService.registerInternship(orgId, studentId, dto);
      res.status(201).json(formatSuccessResponse(internship));
    } catch (err) {
      next(err);
    }
  }

  async updateInternship(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const dto: UpdateInternshipRegistrationDto = req.body;

      const updated = await internshipService.updateInternship(orgId, id, req.user!, dto);
      res.status(200).json(formatSuccessResponse(updated));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Lifecycle & State Machine Transitions
  // ==========================================

  async submitForApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;

      const result = await internshipService.submitForApproval(orgId, id, req.user!);
      res.status(200).json(formatSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async decideApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const dto: ApprovalDecisionDto = req.body;

      const result = await internshipService.decideApproval(orgId, id, req.user!, dto);
      res.status(200).json(formatSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async transitionState(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const dto: StateTransitionDto = req.body;

      const result = await internshipService.transitionState(orgId, id, req.user!, dto);
      res.status(200).json(formatSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Assignments
  // ==========================================

  async assignFaculty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const dto: AssignFacultyDto = req.body;

      const result = await internshipService.assignFaculty(orgId, id, req.user!, dto);
      res.status(200).json(formatSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  async assignMentor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;
      const dto: AssignMentorDto = req.body;

      const result = await internshipService.assignMentor(orgId, id, req.user!, dto);
      res.status(200).json(formatSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  // ==========================================
  // Outcome Versions
  // ==========================================

  async getOutcomeVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const orgId = req.user!.organizationId;
      const { id } = req.params;

      const versions = await internshipService.getOutcomeVersions(orgId, id);
      res.status(200).json(formatSuccessResponse(versions));
    } catch (err) {
      next(err);
    }
  }
}

export const internshipController = new InternshipController();
