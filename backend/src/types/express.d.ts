import { User, Session } from 'better-auth';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      session?: Session;
      userPermissions?: Set<string>;
      isAdmin?: boolean;
    }
  }
}
