import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { ENV } from "../config/env";

export interface ClientJWTPayload {
  id: string;
  email: string;
  name: string;
  role: "client";
  iat?: number;
  exp?: number;
}

export const generateClientToken = (payload: Omit<ClientJWTPayload, 'iat' | 'exp' | 'role'>): string => {
  return jwt.sign({ ...payload, role: 'client' }, ENV.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const verifyClientToken = (token: string): ClientJWTPayload => {
  try {
    const payload = jwt.verify(token, ENV.JWT_SECRET) as ClientJWTPayload;
    if (payload.role !== 'client') {
      throw new Error('Invalid token type');
    }
    return payload;
  } catch (error) {
    throw new Error("Invalid token");
  }
};

// Express middleware — extracts Bearer token, verifies it, and attaches payload to req.user
export const authenticateClient = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Missing or invalid authorization header" });
      return;
    }
    const token = authHeader.split(" ")[1];
    const payload = verifyClientToken(token);
    (req as any).user = payload;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, ENV.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
