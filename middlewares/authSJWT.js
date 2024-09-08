import SJWT from "../config/SJWT.js";
import extractBearerToken from "../helpers/extractBearerToken.js";
import { errorResponse } from "../helpers/response.js";

/**
 * Middleware to validate user privileges by verifying the JWT token.
 *
 * This function extracts the encrypted token from `req.headers.authorization`.
 * The token is generated at login and must be included in every request.
 * If the token is valid, it attaches the `userId`, `userEmail` and `userName` to the request object.
 *
 * @async
 * @param {object} req - The request object containing headers.
 * @param {object} res - The response object.
 * @param {function} next - The next middleware function to call.
 * @returns {Promise<void>} If the token is invalid or missing, a response with status 403 is sent.
 */
export default async (req, res, next) => {

    if (!req.headers.authorization) {
        return res.status(403).send(errorResponse(
            "Authorization Missing")
        );
    }

    try {
        const { user_id, user_email, user_name } = (
            await SJWT.decrypt.bind(SJWT)(
                extractBearerToken(req.headers.authorization)
            )
        );

        req.userId = user_id;
        req.userEmail = user_email;
        req.userName = user_name;

    } catch (e) {

        return res.status(403).send(errorResponse(
            "Forbidden")
        );

    }

    next();
}
