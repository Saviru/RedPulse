declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        organizationId?: string;
        hospitalId?: string;
      } | any;
    }
  }
}

export {};
