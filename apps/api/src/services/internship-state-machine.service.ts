import { InternshipStatus, UserRole } from '@internos/types';
import { BadRequestError, ForbiddenError, normalizeRole } from '@internos/shared';

export interface StateTransitionRule {
  from: InternshipStatus;
  to: InternshipStatus;
  allowedRoles: UserRole[];
  requiresReason?: boolean;
}

export const STATE_TRANSITION_RULES: StateTransitionRule[] = [
  // 1. DRAFT -> PENDING_APPROVAL (Student submitting registration)
  {
    from: InternshipStatus.DRAFT,
    to: InternshipStatus.PENDING_APPROVAL,
    allowedRoles: [UserRole.STUDENT, UserRole.ADMIN],
  },
  // 2. DRAFT -> CANCELLED
  {
    from: InternshipStatus.DRAFT,
    to: InternshipStatus.CANCELLED,
    allowedRoles: [UserRole.STUDENT, UserRole.ADMIN],
  },
  // 3. PENDING_APPROVAL -> APPROVED (Authorized approver approves)
  {
    from: InternshipStatus.PENDING_APPROVAL,
    to: InternshipStatus.APPROVED,
    allowedRoles: [UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY],
  },
  // 4. PENDING_APPROVAL -> REJECTED (Authorized approver rejects with reason)
  {
    from: InternshipStatus.PENDING_APPROVAL,
    to: InternshipStatus.REJECTED,
    allowedRoles: [UserRole.ADMIN, UserRole.HOD, UserRole.FACULTY],
    requiresReason: true,
  },
  // 5. PENDING_APPROVAL -> CANCELLED (Student withdraws)
  {
    from: InternshipStatus.PENDING_APPROVAL,
    to: InternshipStatus.CANCELLED,
    allowedRoles: [UserRole.STUDENT, UserRole.ADMIN],
  },
  // 6. REJECTED -> DRAFT (Student re-opens to address feedback)
  {
    from: InternshipStatus.REJECTED,
    to: InternshipStatus.DRAFT,
    allowedRoles: [UserRole.STUDENT, UserRole.ADMIN],
  },
  // 7. APPROVED -> ACTIVE (Internship starts / commencement)
  {
    from: InternshipStatus.APPROVED,
    to: InternshipStatus.ACTIVE,
    allowedRoles: [UserRole.STUDENT, UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN],
  },
  // 8. APPROVED -> CANCELLED
  {
    from: InternshipStatus.APPROVED,
    to: InternshipStatus.CANCELLED,
    allowedRoles: [UserRole.STUDENT, UserRole.HOD, UserRole.ADMIN],
    requiresReason: true,
  },
  // 9. APPROVED -> TERMINATED
  {
    from: InternshipStatus.APPROVED,
    to: InternshipStatus.TERMINATED,
    allowedRoles: [UserRole.HOD, UserRole.ADMIN],
    requiresReason: true,
  },
  // 10. ACTIVE -> READY_FOR_COMPLETION (Tasks/reports finished)
  {
    from: InternshipStatus.ACTIVE,
    to: InternshipStatus.READY_FOR_COMPLETION,
    allowedRoles: [UserRole.STUDENT, UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN],
  },
  // 11. ACTIVE -> TERMINATED (Early termination)
  {
    from: InternshipStatus.ACTIVE,
    to: InternshipStatus.TERMINATED,
    allowedRoles: [UserRole.HOD, UserRole.ADMIN],
    requiresReason: true,
  },
  // 12. READY_FOR_COMPLETION -> COMPLETED (Final evaluation sign-off)
  {
    from: InternshipStatus.READY_FOR_COMPLETION,
    to: InternshipStatus.COMPLETED,
    allowedRoles: [UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN],
  },
  // 13. READY_FOR_COMPLETION -> ACTIVE (Sent back for further milestone work)
  {
    from: InternshipStatus.READY_FOR_COMPLETION,
    to: InternshipStatus.ACTIVE,
    allowedRoles: [UserRole.FACULTY, UserRole.HOD, UserRole.ADMIN],
    requiresReason: true,
  },
  // 14. READY_FOR_COMPLETION -> TERMINATED
  {
    from: InternshipStatus.READY_FOR_COMPLETION,
    to: InternshipStatus.TERMINATED,
    allowedRoles: [UserRole.HOD, UserRole.ADMIN],
    requiresReason: true,
  },
];

export class InternshipStateMachineService {
  /**
   * Validate whether a transition is syntactically allowed in the state machine
   */
  isValidTransition(from: InternshipStatus, to: InternshipStatus): boolean {
    return STATE_TRANSITION_RULES.some((rule) => rule.from === from && rule.to === to);
  }

  /**
   * Get applicable rule for a state transition
   */
  getTransitionRule(from: InternshipStatus, to: InternshipStatus): StateTransitionRule | undefined {
    return STATE_TRANSITION_RULES.find((rule) => rule.from === from && rule.to === to);
  }

  /**
   * Assert that a requested transition is valid and the user is authorized.
   * Throws BadRequestError on invalid transition path, or ForbiddenError on role lack.
   */
  validateTransition(
    from: InternshipStatus,
    to: InternshipStatus,
    userRole: UserRole | string,
    reason?: string
  ): StateTransitionRule {
    const rule = this.getTransitionRule(from, to);

    if (!rule) {
      throw new BadRequestError(
        `Invalid state transition: Cannot transition internship from '${from}' to '${to}'.`
      );
    }

    const normalized = normalizeRole(userRole);
    if (!rule.allowedRoles.includes(normalized)) {
      throw new ForbiddenError(
        `Unauthorized transition: Role '${userRole}' cannot transition internship from '${from}' to '${to}'. Required one of: ${rule.allowedRoles.join(
          ', '
        )}`
      );
    }

    if (rule.requiresReason && (!reason || !reason.trim())) {
      throw new BadRequestError(
        `Transition from '${from}' to '${to}' requires a documented justification / reason.`
      );
    }

    return rule;
  }

  /**
   * Get all allowed next states for a current status and role
   */
  getAllowedNextStates(currentStatus: InternshipStatus, userRole: UserRole | string): InternshipStatus[] {
    const normalized = normalizeRole(userRole);
    return STATE_TRANSITION_RULES.filter(
      (rule) => rule.from === currentStatus && rule.allowedRoles.includes(normalized)
    ).map((rule) => rule.to);
  }
}

export const internshipStateMachine = new InternshipStateMachineService();
