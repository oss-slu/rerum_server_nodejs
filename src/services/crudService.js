/**
 * CRUD Service - Business logic and database operations for CRUD operations
 * This service handles all business logic and database interactions,
 * separate from HTTP request/response handling.
 *
 * @author thehabes, cubap, RERUM team
 */
import { db } from '../db/index.js'
import { _contextid } from '../controllers/utils.js'

/**
 * Get an object by its ID or slug
 * Business logic: Query database and return the object if found
 *
 * @param {string} id - The _id or slug to search for
 * @returns {Promise<Object>} The found object or null if not found
 * @throws {Error} Database errors
 * @throws {{ message: string, status: number }} 400 when id is falsy (explicit validation; /v1/id/{blank} is handled by 404 elsewhere)
 */
const getIdById = async function(id) {
    if (!id) {
        throw {
            message: "ID parameter is required",
            status: 400
        }
    }
    
    const match = await db.findOne({
        "$or": [
            {"_id": id}, 
            {"__rerum.slug": id}
        ]
    })
    
    return match
}

/**
 * Get the location header value for an object
 * Determines whether to use 'id' or '@id' based on context
 *
 * @param {Object} match - The object to get location for
 * @returns {string} The location URL
 */
const getLocationHeader = function(match) {
    return _contextid(match["@context"]) ? match.id : match["@id"]
}

export {
    getIdById,
    getLocationHeader
}
