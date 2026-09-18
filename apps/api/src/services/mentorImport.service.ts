import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  MentorCsvRowDto,
  MentorCsvPreviewResponse,
  MentorCsvImportResult,
  UserRole,
  UserStatus,
} from '@internos/types';
import { ValidationError } from '@internos/shared';
import { tenantStore } from './tenant.service.js';
import { authStore, InMemoryUser } from './auth.service.js';
import { auditService } from './audit.service.js';
import { groqService } from './groq.service.js';
import { env } from '../config/env.js';

interface StoredMentorPreviewSession {
  token: string;
  organizationId: string;
  createdAt: number;
  preview: MentorCsvPreviewResponse;
}

const mentorPreviewSessions = new Map<string, StoredMentorPreviewSession>();

export class MentorImportService {
  /**
   * Parse CSV content into an array of string dictionaries
   */
  private parseCSV(rawContent: string): Record<string, string>[] {
    const lines = rawContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) return [];

    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine).map((h) => h.trim());

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((hdr, idx) => {
        row[hdr] = values[idx] !== undefined ? values[idx].trim() : '';
      });
      rows.push(row);
    }
    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Generate CSV Template for Mentor Bulk Import
   */
  getCSVTemplate(): string {
    return [
      'first_name,last_name,email,phone,company,designation,department,specialization,linkedin_url',
      'Rahul,Mehta,rahul.mehta@example.com,9876543210,TechNova Solutions,Senior Software Engineer,Computer Science & Engineering,Backend Engineering,https://linkedin.com/in/rahulmehta',
      'Priya,Nair,priya.nair@example.com,9876543211,CloudWorks India,Cloud Architect,Information Technology,Cloud Computing,https://linkedin.com/in/priyanair',
      'Vikram,Shah,vikram.shah@example.com,9876543212,DataGrid Labs,Engineering Manager,Computer Science & Engineering,Data Engineering,https://linkedin.com/in/vikramshah',
    ].join('\n');
  }

  /**
   * Parse, validate rows, detect duplicates, normalize with Groq if available, and return preview
   */
  async processMentorCSVPreview(
    organizationId: string,
    csvContent: string
  ): Promise<MentorCsvPreviewResponse> {
    if (!csvContent || csvContent.trim().length === 0) {
      throw new ValidationError('CSV content is empty');
    }

    const rawRows = this.parseCSV(csvContent);
    if (rawRows.length === 0) {
      throw new ValidationError('CSV must contain a header row and at least one mentor record');
    }

    // AI column mapping suggestion via Groq or deterministic fallback
    const rawHeaders = Object.keys(rawRows[0] || {});
    const headerMapping = await groqService.suggestColumnMapping(rawHeaders);

    // Tenant departments lookup
    const orgDepartments = Array.from(tenantStore.departments.values()).filter(
      (d) => d.organizationId === organizationId
    );
    const deptMap = new Map<string, string>(); // code/name lowercase -> dept.id
    for (const d of orgDepartments) {
      deptMap.set(d.code.toLowerCase(), d.id);
      deptMap.set(d.name.toLowerCase(), d.id);
    }

    // Existing system emails
    const existingEmails = new Set(
      Array.from(authStore.users.values()).map((u) => u.email.toLowerCase())
    );

    const validRows: Array<MentorCsvRowDto & { departmentId?: string }> = [];
    const errorRows: Array<{ rowNumber: number; raw: Record<string, string>; errors: string[] }> = [];
    const seenEmailsInCSV = new Set<string>();

    rawRows.forEach((raw, index) => {
      const rowNum = index + 2; // header is row 1
      const rowErrors: string[] = [];

      // Extract canonical values using header mapping or direct keys
      const getValue = (canonicalKey: string): string => {
        // Direct key
        if (raw[canonicalKey] !== undefined && raw[canonicalKey] !== '') {
          return raw[canonicalKey];
        }
        // Via mapped header
        for (const [hdr, mappedKey] of Object.entries(headerMapping)) {
          if (mappedKey === canonicalKey && raw[hdr]) {
            return raw[hdr];
          }
        }
        return '';
      };

      const firstName = getValue('first_name');
      const lastName = getValue('last_name');
      const email = getValue('email').toLowerCase().trim();
      const phone = getValue('phone');
      const company = getValue('company');
      const designation = getValue('designation');
      const department = getValue('department');
      const specialization = getValue('specialization');
      const linkedinUrl = getValue('linkedin_url');

      if (!firstName) rowErrors.push('First name is required');
      if (!lastName) rowErrors.push('Last name is required');

      if (!email) {
        rowErrors.push('Email is required');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          rowErrors.push(`Malformed email address: '${email}'`);
        } else if (seenEmailsInCSV.has(email)) {
          rowErrors.push(`Duplicate email within this CSV file: '${email}'`);
        } else if (existingEmails.has(email)) {
          rowErrors.push(`User with email '${email}' already exists in the system`);
        }
      }

      if (!company) rowErrors.push('Company / host organization is required');
      if (!designation) rowErrors.push('Designation is required');

      // Phone validation if present
      if (phone) {
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 13) {
          rowErrors.push(`Invalid phone number format: '${phone}'`);
        }
      }

      // Department matching
      let departmentId: string | undefined = undefined;
      if (department) {
        departmentId = deptMap.get(department.toLowerCase().trim());
        if (!departmentId) {
          rowErrors.push(
            `Department '${department}' does not exist in your institution. Available: ${orgDepartments.map((d) => d.name).join(', ')}`
          );
        }
      }

      if (rowErrors.length > 0) {
        errorRows.push({
          rowNumber: rowNum,
          raw,
          errors: rowErrors,
        });
      } else {
        seenEmailsInCSV.add(email);
        validRows.push({
          firstName,
          lastName,
          email,
          phone: phone || undefined,
          company,
          designation,
          department,
          departmentId,
          specialization: specialization || undefined,
          linkedinUrl: linkedinUrl || undefined,
        });
      }
    });

    const previewToken = crypto.randomBytes(24).toString('hex');
    const preview: MentorCsvPreviewResponse = {
      token: previewToken,
      totalRows: rawRows.length,
      validRows,
      errorRows,
      summary: {
        total: rawRows.length,
        valid: validRows.length,
        errors: errorRows.length,
      },
    };

    mentorPreviewSessions.set(previewToken, {
      token: previewToken,
      organizationId,
      createdAt: Date.now(),
      preview,
    });

    return preview;
  }

  /**
   * Confirm and commit valid previewed mentors into the database / in-memory store
   */
  async confirmMentorCSVImport(
    organizationId: string,
    token: string,
    actorId?: string
  ): Promise<MentorCsvImportResult> {
    const session = mentorPreviewSessions.get(token);
    if (!session) {
      throw new ValidationError('Invalid or expired import preview session. Please re-upload CSV.');
    }
    if (session.organizationId !== organizationId) {
      throw new ValidationError('Tenant mismatch for preview session.');
    }

    const { validRows } = session.preview;
    if (validRows.length === 0) {
      throw new ValidationError('No valid mentor rows to import.');
    }

    const createdUsers: Array<{ id: string; email: string; activationUrl?: string }> = [];

    for (const mentor of validRows) {
      // Re-verify email doesn't collide
      if (authStore.findUserByEmailAndOrg(mentor.email, organizationId)) {
        continue;
      }

      const userId = `user-mentor-csv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const activationToken = jwt.sign(
        {
          sub: 'account_activation',
          userId,
          email: mentor.email,
          organizationId,
        },
        env.JWT_SECRET,
        { expiresIn: '72h' }
      );

      const newUser: InMemoryUser = {
        id: userId,
        organizationId,
        departmentId: mentor.departmentId || null,
        email: mentor.email,
        passwordHash: '',
        firstName: mentor.firstName,
        lastName: mentor.lastName,
        role: UserRole.MENTOR,
        status: UserStatus.PENDING_VERIFICATION,
        activationToken,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      authStore.users.set(userId, newUser);

      createdUsers.push({
        id: userId,
        email: mentor.email,
        activationUrl: `${env.FRONTEND_URL}/activate?token=${activationToken}`,
      });
    }

    mentorPreviewSessions.delete(token);

    await auditService.log({
      organizationId,
      userId: actorId,
      action: 'MENTOR_CSV_IMPORT' as any,
      entity: 'User',
      details: {
        totalAttempted: validRows.length,
        importedCount: createdUsers.length,
      },
    });

    return {
      importedCount: createdUsers.length,
      skippedCount: validRows.length - createdUsers.length,
      users: createdUsers,
    };
  }
}

export const mentorImportService = new MentorImportService();
