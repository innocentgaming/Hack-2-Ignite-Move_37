import { Request, Response, NextFunction } from 'express';
import { submissionService } from '../services/submission.service.js';
import { formatSuccessResponse, ValidationError } from '@internos/shared';
import { CreateSubmissionDto, CreateReviewDto, SubmissionStatus } from '@internos/types';

export async function uploadSubmissionFile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { filename, mimeType, contentBase64, content, internshipId, taskId, submissionId, isPublic } = req.body;

    if (!filename) {
      throw new ValidationError('Filename is required');
    }

    let buffer: Buffer;
    if (contentBase64) {
      buffer = Buffer.from(contentBase64, 'base64');
    } else if (typeof content === 'string') {
      buffer = Buffer.from(content, 'utf-8');
    } else {
      throw new ValidationError('File content (contentBase64 or content string) is required');
    }

    const fileDto = await submissionService.uploadFile(
      req.organizationId!,
      req.user!,
      buffer,
      filename,
      mimeType || 'application/octet-stream',
      {
        internshipId,
        taskId,
        submissionId,
        isPublic: !!isPublic,
      }
    );

    res.status(201).json(formatSuccessResponse(fileDto));
  } catch (error) {
    next(error);
  }
}

export async function downloadSubmissionFile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const fileId = req.params.fileId;
    const fileData = await submissionService.getFileForDownload(
      req.organizationId!,
      req.user!,
      fileId
    );

    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileData.filename)}"`
    );
    res.send(fileData.buffer);
  } catch (error) {
    next(error);
  }
}

export async function createSubmission(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = req.body as CreateSubmissionDto;
    const submission = await submissionService.createOrReviseSubmission(
      req.organizationId!,
      req.user!,
      dto
    );

    res.status(201).json(formatSuccessResponse(submission));
  } catch (error) {
    next(error);
  }
}

export async function getSubmissions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const filters = {
      internshipId: req.query.internshipId as string | undefined,
      taskId: req.query.taskId as string | undefined,
      status: req.query.status as SubmissionStatus | undefined,
    };

    const submissions = await submissionService.getSubmissions(
      req.organizationId!,
      req.user!,
      filters
    );

    res.status(200).json(formatSuccessResponse(submissions));
  } catch (error) {
    next(error);
  }
}

export async function getSubmissionById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const submission = await submissionService.getSubmissionById(
      req.organizationId!,
      req.params.id
    );

    res.status(200).json(formatSuccessResponse(submission));
  } catch (error) {
    next(error);
  }
}

export async function getSubmissionTimeline(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const timeline = await submissionService.getSubmissionTimeline(
      req.organizationId!,
      req.params.id
    );

    res.status(200).json(formatSuccessResponse(timeline));
  } catch (error) {
    next(error);
  }
}

export async function createReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const dto = {
      ...req.body,
      submissionId: req.params.id || req.body.submissionId,
    } as CreateReviewDto;

    const review = await submissionService.createReview(
      req.organizationId!,
      req.user!,
      dto
    );

    res.status(201).json(formatSuccessResponse(review));
  } catch (error) {
    next(error);
  }
}
