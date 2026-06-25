import bcrypt from "bcryptjs";
import crypto from "crypto";
import { appConfig } from "../config/index.config";

const algorithm = "aes-256-cbc";
const secretKey = Buffer.from(appConfig.app.secretKey, "hex");

// Hashes the password
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

// Compares the password with the hashed password
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Hash cryptorized password for smtp storage
export const encryptPassword = (password: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(password), cipher.final()]);
  return {
    iv: iv.toString("hex"),
    encryptedData: encrypted.toString("hex"),
  };
};

// Decrypt cryptorized password for smtp usage
export const decryptPasword = (hash: any) => {
  if (!hash || !hash.iv || !hash.encryptedData) {
    throw new Error("Invalid hash provided for decryption.");
  }
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(hash.iv, "hex"),
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(hash.encryptedData, "hex")),
    decipher.final(),
  ]);
  const decryptedPassword = decrypted.toString();

  return decryptedPassword;
};
