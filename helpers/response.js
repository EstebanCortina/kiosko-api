/**
 * Creates a standardized success response object.
 *
 * @param {string} [message='Success'] - A message to include in the response. Defaults to 'Success'.
 * @param {any} [data=null] - Optional data to include in the response. Defaults to null.
 * @returns {object} The response object containing the status, message, and data.
 */
export const successResponse = (message='Success', data=null)=> {
    return {
        "status": "OK",
        "message": message,
        "data": data
    }
}

/**
 * Creates a standardized error response object.
 *
 * @param {string} [message='Server error'] - A message to include in the response. Defaults to 'Server error'.
 * @returns {object} The response object containing the status and message.
 */
export const errorResponse = (message='Server error')=> {
    return {
        "status": "NOT OK",
        "message": message,
    }
}
