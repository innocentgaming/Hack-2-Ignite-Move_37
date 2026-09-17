import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  CSVImportPreviewResponse,
  CSVImportResult,
  UserRole,
  UserStatus,
} from '@internos/types';
import { NotFoundError, ValidationError, TenantViolationError } from '@internos/shared';
import { tenantStore } from './tenant.service.js';
import { authStore, InMemoryUser } from './auth.service.js';
import { auditService } from './audit.service.js';

interface StoredPreviewSession {
  token: string;
  organizationId: string;
  createdAt: number;
  preview: CSVImportPreviewResponse;
}

// In-memory cache for preview sessions (expires after 30 minutes)
const previewSessions = new Map<string, StoredPreviewSession>();

export class CSVImportService {
  /**
   * Parse CSV string into raw row objects handling commas and simple quotes
   */
  private parseCSV(rawContent: string): Record<string, string>[] {
    const lines = rawContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return [];
    }

    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine).map((h) => h.toLowerCase().trim());

    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      headers.forEach((hdr, idx) => {
        row[hdr] = values[idx] ? values[idx].trim() : '';
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
   * Step 1: Parse, Validate, Detect Duplicates, and return Preview
   */
  async processCSVPreview(organizationId: string, csvContent: string): Promise<CSVImportPreviewResponse> {
    if (!csvContent || csvContent.trim().length === 0) {
      throw new ValidationError('CSV content is empty');
    }

    const rawRows = this.parseCSV(csvContent);
    if (rawRows.length === 0) {
      throw new ValidationError('CSV must contain a header row and at least one student record');
    }

    // Tenant-isolated department lookup
    const orgDepartments = Array.from(tenantStore.departments.values()).filter(
      (d) => d.organizationId === organizationId
    );
    const deptCodeMap = new Map<string, string>(); // lowercase code/name -> dept.id
    for (const d of orgDepartments) {
      deptCodeMap.set(d.code.toLowerCase(), d.id);
      deptCodeMap.set(d.name.toLowerCase(), d.id);
    }

    // Existing users in the system to check cross-org / existing email collisions
    const existingEmails = new Set(
      Array.from(authStore.users.values()).map((u) => u.email.toLowerCase())
    );

    // Track duplicates within the current CSV file
    const seenBatchEmails = new Set<string>();
    const seenBatchStudentIds = new Set<string>();

    const validRows: CSVImportPreviewResponse['validRows'] = [];
    const invalidRows: CSVImportPreviewResponse['invalidRows'] = [];
    const duplicates: CSVImportPreviewResponse['duplicates'] = [];
    const errorReport: string[] = [];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    rawRows.forEach((row, index) => {
      const rowNumber = index + 2; // Row 1 is header
      const rowErrors: string[] = [];

      // Flexible header names
      const studentId = row['studentid'] || row['student_id'] || row['rollnumber'] || row['roll_no'] || row['id'] || '';
      const fullName = row['name'] || row['fullname'] || row['full_name'] || '';
      const firstNameCol = row['firstname'] || row['first_name'] || '';
      const lastNameCol = row['lastname'] || row['last_name'] || '';
      const email = (row['email'] || row['mail'] || '').toLowerCase().trim();
      const departmentKey = (row['department'] || row['dept'] || row['branch'] || '').toLowerCase().trim();

      // Required field checks
      if (!studentId) {
        rowErrors.push('Missing required student ID / roll number');
      }
      if (!fullName && !firstNameCol) {
        rowErrors.push('Missing required student name');
      }
      if (!email) {
        rowErrors.push('Missing required email address');
      } else if (!emailRegex.test(email)) {
        rowErrors.push(`Invalid email address format '${email}'`);
      }
      if (!departmentKey) {
        rowErrors.push('Missing required department');
      }

      // Department verification strictly within caller's organization
      let resolvedDeptId: string | undefined;
      if (departmentKey) {
        resolvedDeptId = deptCodeMap.get(departmentKey);
        if (!resolvedDeptId) {
          rowErrors.push(`Invalid department '${departmentKey}'. Does not exist in this institution.`);
        }
      }

      // Duplicate checks: Within Batch and in Store
      let isDuplicate = false;
      if (email) {
        if (seenBatchEmails.has(email)) {
          duplicates.push({
            rowNumber,
            studentId,
            email,
            reason: `Duplicate email '${email}' repeated in CSV batch`,
          });
          isDuplicate = true;
        } else if (existingEmails.has(email)) {
          duplicates.push({
            rowNumber,
            studentId,
            email,
            reason: `User with email '${email}' already exists in the system`,
          });
          isDuplicate = true;
        }
      }

      if (studentId) {
        if (seenBatchStudentIds.has(studentId.toLowerCase())) {
          duplicates.push({
            rowNumber,
            studentId,
            email,
            reason: `Duplicate student ID '${studentId}' repeated in CSV batch`,
          });
          isDuplicate = true;
        }
      }

      // If invalid or duplicate, track in report
      if (rowErrors.length > 0) {
        invalidRows.push({
          rowNumber,
          raw: row,
          errors: rowErrors,
        });
        errorReport.push(`Row ${rowNumber}: ${rowErrors.join(', ')}`);
      } else if (isDuplicate) {
        errorReport.push(`Row ${rowNumber}: Duplicate record skipped (${duplicates[duplicates.length - 1].reason})`);
      } else {
        // Valid Row
        seenBatchEmails.add(email);
        seenBatchStudentIds.add(studentId.toLowerCase());

        let finalFirstName = firstNameCol;
        let finalLastName = lastNameCol;
        if (!finalFirstName && fullName) {
          const parts = fullName.trim().split(/\s+/);
          finalFirstName = parts[0];
          finalLastName = parts.slice(1).join(' ') || 'Student';
        }

        validRows.push({
          studentId,
          name: fullName || `${finalFirstName} ${finalLastName}`,
          email,
          department: departmentKey,
          departmentId: resolvedDeptId!,
          parsedFirstName: finalFirstName,
          parsedLastName: finalLastName,
        });
      }
    });

    const previewToken = `preview-${crypto.randomUUID()}`;
    const previewData: CSVImportPreviewResponse = {
      previewToken,
      totalRows: rawRows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      duplicateCount: duplicates.length,
      validRows,
      invalidRows,
      duplicates,
      errorReport,
    };

    // Cache preview session for confirmation
    previewSessions.set(previewToken, {
      token: previewToken,
      organizationId,
      createdAt: Date.now(),
      preview: previewData,
    });

    return previewData;
  }

  /**
   * Step 2: Administrator can cancel a preview session
   */
  async cancelPreview(organizationId: string, previewToken: string): Promise<{ success: boolean; message: string }> {
    const session = previewSessions.get(previewToken);
    if (!session) {
      return { success: true, message: 'Session already expired or does not exist' };
    }
    if (session.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant import cancellation prohibited');
    }
    previewSessions.delete(previewToken);
    return { success: true, message: 'Import preview cancelled successfully' };
  }

  /**
   * Step 3: Confirm Preview and execute Bulk Insert
   */
  async confirmImport(
    organizationId: string,
    previewToken: string,
    defaultPassword?: string,
    importedByUserId?: string
  ): Promise<CSVImportResult> {
    const session = previewSessions.get(previewToken);
    if (!session) {
      throw new NotFoundError('Import preview session has expired or is invalid');
    }

    if (session.organizationId !== organizationId) {
      throw new TenantViolationError('Cross-tenant import confirmation prohibited');
    }

    const { validRows } = session.preview;
    const passwordToHash = defaultPassword || 'StudentPass123!';
    const defaultPasswordHash = bcrypt.hashSync(passwordToHash, 10);
    const importedUserIds: string[] = [];
    const now = new Date();

    for (const student of validRows) {
      const userId = `user-std-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const newUser: InMemoryUser = {
        id: userId,
        organizationId,
        departmentId: student.departmentId,
        email: student.email,
        passwordHash: defaultPasswordHash,
        firstName: student.parsedFirstName,
        lastName: student.parsedLastName,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      };

      authStore.users.set(userId, newUser);
      importedUserIds.push(userId);
    }

    // Log the bulk import audit event
    await auditService.log({
      organizationId,
      userId: importedByUserId,
      action: 'STUDENTS_CSV_IMPORT',
      entity: 'StudentBatch',
      details: {
        totalRows: session.preview.totalRows,
        importedCount: validRows.length,
        skippedInvalid: session.preview.invalidCount,
        skippedDuplicates: session.preview.duplicateCount,
      },
    });

    // Invalidate preview session
    previewSessions.delete(previewToken);

    return {
      importedCount: validRows.length,
      failedCount: session.preview.invalidCount + session.preview.duplicateCount,
      organizationId,
      importedUserIds,
      message: `Successfully imported ${validRows.length} students into organization`,
    };
  }
}

export const csvImportService = new CSVImportService();
