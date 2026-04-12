import { promisify } from "node:util";
import bcrypt from "bcryptjs";

const ROUNDS = 12;

const hashAsync = promisify(bcrypt.hash) as (data: string, saltOrRounds: number) => Promise<string>;
const compareAsync = promisify(bcrypt.compare) as (data: string, encrypted: string) => Promise<boolean>;

export async function hashPassword(plain: string): Promise<string> {
  return hashAsync(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return compareAsync(plain, hash);
}
