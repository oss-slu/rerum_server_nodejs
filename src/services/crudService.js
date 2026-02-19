#!/usr/bin/env node

/**
 * CRUD Service - Business logic and database operations for CRUD operations
 * This service handles all business logic and database interactions,
 * separate from HTTP request/response handling.
 * 
 * @author Refactored for separation of concerns
 */
import { db } from '../db/index.js'
import { idNegotiation, _contextid } from '../controllers/utils.js'

/**
 * Get an object by its ID or slug
 * Business logic: Query database and return the object if found
 * 
 * @param {string} id - The _id or slug to search for
 * @returns {Promise<Object>} The found object or null if not found
 * @throws {Error} Database errors
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
 * Get multiple objects matching query criteria
 * Business logic: Query database with filters, limit, and skip
 * 
 * @param {Object} props - Query properties to match
 * @param {number} limit - Maximum number of results
 * @param {number} skip - Number of results to skip
 * @returns {Promise<Array>} Array of matching objects
 * @throws {Error} Database errors
 */
const queryObjects = async function(props, limit = 100, skip = 0) {
    if (Object.keys(props).length === 0) {
        throw {
            message: "Detected empty JSON object. You must provide at least one property in the /query request body JSON.",
            status: 400
        }
    }
    
    const matches = await db.find(props)
        .limit(limit)
        .skip(skip)
        .toArray()
    
    // Apply id negotiation to each result
    return matches.map(o => idNegotiation(o))
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
    queryObjects,
    getLocationHeader
}
