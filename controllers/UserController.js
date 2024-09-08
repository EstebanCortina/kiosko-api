import bcrypt from "bcrypt";
import encryptPassword from "../helpers/encryptPassword.js";

import sequelizeErrorHandler from "../handlers/sequelizeErrorHandler.js";
import { UniqueConstraintError } from "sequelize";

import { successResponse, errorResponse } from "../helpers/response.js";
import controllerModel from '../models/user.js';

/**
 * Controller for managing user-related operations.
 */
export default class UserController {

    /**
     * Creates a new user with the provided data.
     *
     * @param {object} userData - The data for the new user.
     * @param {string} userData.name - The user's name.
     * @param {string} userData.email - The user's email.
     * @param {string} userData.password - The user's password.
     * @returns {Promise<object>} The created user.
     */
    async createNewUserAsync(userData) {
        const { name, email, password } = userData;

        const newUser = (
            await controllerModel.create({
                username: name,
                email: email,
                password: await encryptPassword(password),
            })
        );

        return newUser;
    }

    /**
     * Registers a new user and responds with the appropriate status.
     *
     * @param {object} req - The request object.
     * @param {object} res - The response object.
     * @returns {Promise<void>}
     */
    async registerAsync(req, res) {

        try {
            const user = (
                await this.createNewUserAsync(req.body)
            );

            return res.status(201).send(
                successResponse('New user created', user)
            );

        } catch (error) {
            console.error('[UserController Error]:', sequelizeErrorHandler(error));

            if (error instanceof UniqueConstraintError) {
                return res.status(400).send(
                    errorResponse('Email already in use')
                );
            }

            return res.status(500).json(errorResponse());
        }

    }

    /**
     * Logs in a user with the provided credentials.
     *
     * @param {object} req - The request object.
     * @param {object} res - The response object.
     * @returns {Promise<void>}
     */
    async loginAsync(req, res) {
        const { email, password } = req.body;

        try {
            if (await UserController.areGoodCredentialsAsync(email, password)) {
                return res.status(200).send(
                    // Should return a JWT in the 'data' field of the response
                    successResponse("Success login")
                );
            }
            return res.status(404).send(
                errorResponse('Wrong email or password')
            );

        } catch (error) {
            console.error('[UserController Error]:', sequelizeErrorHandler(error));
            return res.status(500).send(errorResponse());
        }
    }

    /**
     * Checks if the provided credentials are valid.
     *
     * @param {string} email - The user's email.
     * @param {string} password - The user's password.
     * @returns {Promise<boolean>} True if credentials are valid, otherwise false.
     */
    static async areGoodCredentialsAsync(email, password) {
        const searchedUser = (
            await controllerModel.findOne({ where: { email } })
        );
        if (!searchedUser) return false;
        return await bcrypt.compare(password, searchedUser.password);
    }
}
