import SJWT from "../config/SJWT.js";
import extractBearerToken from "../helpers/extractBearerToken.js";
import {errorResponse, successResponse} from "../helpers/response.js";

/**
 * Middleware to validate user privileges by verifying the JWT token.
 *
 * This function extracts the encrypted token from `req.headers.authorization`.
 * The token is generated at login and must be included in every request.
 * If the token is valid, it attaches the `userId`, `userEmail` and `userName` to the request object.
 *
 * @async
 * @returns {Promise<void>} If the token is invalid or missing, a response with status 403 is sent.
 * @param authHeader
 */
export default async (authHeader) => {
    console.log("authHeader", authHeader);
    if (!authHeader) {
        return {
            status: 400,
            body: JSON.stringify(errorResponse("Authorization missing",)),
            headers: {
                "Content-Type": "application/json"
            }
        };
    }

    try {
        return (
            await SJWT.decrypt.bind(SJWT)(
                extractBearerToken(authHeader)
            )
        );

    } catch (e) {
        console.log(e)
        return {
            status: 400,
            body: JSON.stringify(errorResponse("Forbidden",)),
            headers: {
                "Content-Type": "application/json"
            }
        };

    }

}
