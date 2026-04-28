import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'

/**
 * Handle POST /v1/api/query - Query objects by matching properties
 * Public endpoint, no authentication required
 *
 * @async
 * @param {object} req - Express request
 * @param {object} req.body - Query object with properties to match
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<object[]>} Array of matching objects
 */
export async function handleQuery(req, res, next) {
    return controller.query(req, res, next)
}

/**
 * Handle HEAD /v1/api/query - Query head request for matching objects
 * Public endpoint, no authentication required
 *
 * @async
 * @param {object} req - Express request
 * @param {object} req.body - Query object with properties to match
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<void>} Head response with matching object count headers
 */
export async function handleQueryHead(req, res, next) {
    return controller.queryHeadRequest(req, res, next)
}

router.route('/')
    .post(handleQuery)
    .head(handleQueryHead)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for requesting objects with matching properties.  Please use POST.'
        res.status(405)
        next(res)
    })

export default router
