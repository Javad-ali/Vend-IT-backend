import bcrypt from 'bcryptjs';
export const hashPassword = async (plain) => bcrypt.hash(plain, 12);
export const comparePassword = async (plain, hash) => bcrypt.compare(plain, hash);
