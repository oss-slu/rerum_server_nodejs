import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import rateLimit from 'express-rate-limit'

const idRouteLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     standardHeaders: true,
     legacyHeaders: false
})

/**
 * Handle GET /v1/id/:_id - Retrieve object by ID or slug
 * Public endpoint, no authentication required
 *
 * @async
 * @param {object} req - Express request
 * @param {string} req.params._id - Object ID or slug
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<object>} Retrieved object or deleted object metadata
 */
export async function handleId(req, res, next) {
    return controller.id(req, res, next)
}

/**
 * Handle HEAD /v1/id/:_id - Retrieve metadata headers for an object by ID or slug
 * Public endpoint, no authentication required
 *
 * @async
 * @param {object} req - Express request
 * @param {string} req.params._id - Object ID or slug
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<void>} Head response with object metadata headers
 */
export async function handleIdHead(req, res, next) {
    return controller.idHeadRequest(req, res, next)
}

router.route('/:_id')
    .get(idRouteLimiter, handleId)
    .head(idRouteLimiter, handleIdHead)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method, please use GET.'
        res.status(405)
        next(res)
    })

export default router

