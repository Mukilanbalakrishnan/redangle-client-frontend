import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, ENV.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};
