import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        role: "admin" | "agent" | "user";
        [key: string]: any;
      };
    }
  }
}

export function identifier(
  req: Request,
  res: Response,
  next: NextFunction
): void;

export function isAdmin(req: Request, res: Response, next: NextFunction): void;

export function isAgent(req: Request, res: Response, next: NextFunction): void;

export function requireRole(
  roles: string[]
): (req: Request, res: Response, next: NextFunction) => void;

// ✅ NOUVEAU: Types pour ServiceClient
export interface ServiceClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

export class ServiceClient {
  constructor(serviceName: string, options?: ServiceClientOptions);
  call(endpoint: string, options?: any): Promise<any>;
  post(endpoint: string, data?: any): Promise<any>;
  get(endpoint: string): Promise<any>;
  put(endpoint: string, data?: any): Promise<any>;
  delete(endpoint: string): Promise<any>;
}

export function createServiceClient(
  serviceName: string,
  options?: ServiceClientOptions
): ServiceClient;
