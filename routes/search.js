import express from 'express'
const router = express.Router()
import controller from '../db-controller.js'

/**
 * POST /v1/api/search - Full-text search by words
 * Public endpoint, no authentication required
 * 
 * @param {object} req.body - Search query payload
 * @param {string} req.body.query - Search terms to match
 * @returns {object[]} Array of matching objects
 */
router.route('/')
    .post(controller.searchAsWords)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for search.  Please use POST.'
        res.status(405)
        next(res)
    })

/**
 * POST /v1/api/search/phrase - Full-text search by phrase
 * Public endpoint, no authentication required
 * 
 * @param {object} req.body - Search query payload
 * @param {string} req.body.query - Exact phrase to match
 * @returns {object[]} Array of matching objects
 */
router.route('/phrase')
    .post(controller.searchAsPhrase)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for search.  Please use POST.'
        res.status(405)
        next(res)
    })

// Note that there are more search functions available in the controller, such as controller.searchFuzzily
// They can be used through additional endpoints here when we are ready.

export default router