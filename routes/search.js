import express from 'express'
const router = express.Router()
import controller from '../db-controller.js'
import rateLimit from 'express-rate-limit'

const searchRateLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per window
     standardHeaders: true,
     legacyHeaders: false
})

/**
 * Handle POST /v1/api/search - Full-text search by words
 * Public endpoint, no authentication required
 *
 * @async
 * @param {object} req - Express request
 * @param {object} req.body - Search query payload
 * @param {string} req.body.query - Search terms to match
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<object[]>} Array of matching objects
 */
export async function handleSearchAsWords(req, res, next) {
    return controller.searchAsWords(req, res, next)
}

router.route('/')
    .post(searchRateLimiter, handleSearchAsWords)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for search.  Please use POST.'
        res.status(405)
        next(res)
    })

/**
 * Handle POST /v1/api/search/phrase - Full-text search by phrase
 * Public endpoint, no authentication required
 *
 * @async
 * @param {object} req - Express request
 * @param {object} req.body - Search query payload
 * @param {string} req.body.query - Exact phrase to match
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<object[]>} Array of matching objects
 */
export async function handleSearchAsPhrase(req, res, next) {
    return controller.searchAsPhrase(req, res, next)
}

router.route('/phrase')
    .post(searchRateLimiter, handleSearchAsPhrase)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for search.  Please use POST.'
        res.status(405)
        next(res)
    })

// Note that there are more search functions available in the controller, such as controller.searchFuzzily
// They can be used through additional endpoints here when we are ready.

export default router