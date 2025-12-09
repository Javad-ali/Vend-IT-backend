/**
 * Express Session Type Augmentation
 *
 * Extends the express-session types to include our custom session data.
 */
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    admin?: {
      id: string;
      email: string;
      name: string | null;
      role: string;
    };
    returnTo?: string;
  }
}
