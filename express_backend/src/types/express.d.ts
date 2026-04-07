// Augments Express Request to include `req.user` — set by auth.middleware.ts
declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id:   number;
        tenant_id: number;
        role:      string;
        tier:      string;
        email:     string;
        name:      string;
        status:    string;
      };
    }
  }
}
export {};
