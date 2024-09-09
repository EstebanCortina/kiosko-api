import { body, validationResult } from 'express-validator';
import { errorResponse } from "../../helpers/response.js";

/**
 * Validates the registration data for a new user.
 *
 * This middleware validates the request body for user registration. It checks:
 * - `name`: must be a non-empty string.
 * - `email`: must be a valid email format and normalized.
 * - `password`: must be a non-empty string with a length between 6 and 255 characters.
 *
 * @type {Array<import('express-validator').ValidationChain>}
 */
export const registerValidation = [
    body('name')
        .notEmpty().withMessage('Name is required')
        .isString().withMessage('Name must be a string'),

    body('email')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6, max: 255 }).withMessage('Password must be at least 6 characters long'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(
                errorResponse('Bad request', errors.array())
            );
        }
        next();
    }
];

/**
 * Validates the login data for a user.
 *
 * This middleware validates the request body for user login. It checks:
 * - `email`: must be a valid email format and normalized.
 * - `password`: must be a non-empty string.
 *
 * @type {Array<import('express-validator').ValidationChain>}
 */
export const loginValidation = [
    body('email')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).send(
                errorResponse('Bad request', errors.array())
            );
        }
        next();
    }
];
