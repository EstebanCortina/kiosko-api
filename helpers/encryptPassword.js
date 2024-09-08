import bcrypt from 'bcrypt';
import { BCRYPT_SALT_ROUNDS } from "../config/env.js";

/**
 * Hashes a plain password using bcrypt.
 *
 * @param {string} plainPassword - The plain text password to be hashed.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 */
export default async (plainPassword) =>{
    console.log(BCRYPT_SALT_ROUNDS);
    return await bcrypt.hash(plainPassword, parseInt(BCRYPT_SALT_ROUNDS));
}