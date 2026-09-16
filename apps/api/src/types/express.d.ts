import { AuthenticatedUser } from '@internos/types';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      organizationId?: string;
    }
  }
}
