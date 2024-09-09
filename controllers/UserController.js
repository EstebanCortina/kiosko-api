import { JWT_EXPIRATION_DATE } from "../config/env.js";

import bcrypt from "bcrypt";
import encryptPassword from "../helpers/encryptPassword.js";

import sequelizeErrorHandler from "../handlers/sequelizeErrorHandler.js";
import { UniqueConstraintError } from "sequelize";

import { successResponse, errorResponse } from "../helpers/response.js";
import controllerModel from '../models/user.js';
import SJWT from "../config/sjwt.js";

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
        )?.dataValues;
        delete newUser.id;
        delete newUser.password;
        delete newUser.createdAt;
        delete newUser.updatedAt;
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
            console.error('[UserController]:', sequelizeErrorHandler(error));

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

        // Find the requested user
        const searchedUser = (
            await controllerModel.findOne({ where: { email } })
        );

        try {
            // Check if the email and password are correct
            if (searchedUser && (
                await UserController.areGoodCredentialsAsync(searchedUser.password, password)
            )) {

                return res.status(200).send(
                    successResponse("Success login", {
                        jwt: await UserController.createSjwtAsync({
                            user_id: searchedUser.id,
                            user_email: searchedUser.email,
                            user_name: searchedUser.username,
                        })
                    })

                );

            }

            return res.status(404).send(
                errorResponse('Wrong email or password')
            );

        } catch (error) {
            console.error('[UserController]:', sequelizeErrorHandler(error));
            return res.status(500).send(errorResponse());
        }
    }

    /**
     * Checks if the provided credentials are valid.
     *
     * @param searchedPassword - The input password from a user
     * @param {string} password - The user's password.
     * @returns {Promise<boolean>} True if credentials are valid, otherwise false.
     */
    static async areGoodCredentialsAsync(searchedPassword, password) {
        return await bcrypt.compare(password, searchedPassword);
    }

    /**
     * Generates a signed JSON Web Token (JWT) with the provided payload encrypted.
     *
     * @param {object} payload - The data to be included in the JWT payload.
     * @returns {Promise<string>} A promise that resolves to the generated JWT.
     */
    static async createSjwtAsync(payload) {
        return await SJWT.getJWT(payload, JWT_EXPIRATION_DATE)
    }
}
