import { body, validationResult } from 'express-validator';
import { errorResponse } from "../../helpers/response.js";

/**
 * Middleware for validating the creation of a feeds.
 *
 * This middleware validates the request body for creating a feeds. It checks:
 * - `name`: must be a non-empty string.
 * - `topics`: must be an array of strings, with a length between 1 and 5.
 * - `is_favorite`: if present, must be a boolean.
 * - `is_public`: if present, must be a boolean.
 *
 * @type {Array<import('express-validator').ValidationChain>}
 */
export const createFeedValidation = [
    body('name')
        .notEmpty().withMessage('Feed name is required')
        .isString().withMessage('Feed name must be a string')
        .trim()
        .escape(),

    body('topics')
        .isArray({ min: 1, max: 5 }).withMessage('At least 1 - 5 topics are required')
        .custom((topics) => {
            if (!topics.every(topic => typeof topic === 'string')) {
                throw new Error('Each topic must be a string');
            }
            return true;
        }),

    body('is_favorite')
        .optional()
        .isBoolean().withMessage('is_favorite must be a boolean'),

    body('is_public')
        .optional()
        .isBoolean().withMessage('is_public must be a boolean'),

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
 * Middleware for validating the update of a feeds.
 *
 * This middleware validates the request body for updating a feeds. It checks:
 * - `name`: if present, must be a string.
 * - `topics`: if present, must be an array of strings, with a length between 1 and 5.
 * - `is_favorite`: if present, must be a boolean.
 * - `is_public`: if present, must be a boolean.
 *
 * @type {Array<import('express-validator').ValidationChain>}
 */
export const updateFeedValidation = [
    body('name')
        .optional()
        .isString().withMessage('Feed name must be a string'),

    body('topics')
        .optional()
        .isArray({ min: 1, max: 5 }).withMessage('At least 1 - 5 topics are required')
        .custom((topics) => {
            if (!topics.every(topic => typeof topic === 'string')) {
                throw new Error('Each topic must be a string');
            }
            return true;
        }),

    body('is_favorite')
        .optional()
        .isBoolean().withMessage('is_favorite must be a boolean'),

    body('is_public')
        .optional()
        .isBoolean().withMessage('is_public must be a boolean'),

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
