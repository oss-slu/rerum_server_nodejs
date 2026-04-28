import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'

/**
 * POST /v1/api/query - Query objects by matching properties
 * HEAD /v1/api/query - Query head request for matching objects
 * Public endpoint, no authentication required
 * 
 * @param {object} req.body - Query object with properties to match
 * @returns {object[]} Array of matching objects
 */
router.route('/')
    .post(controller.query)
    .head(controller.queryHeadRequest)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for requesting objects with matching properties.  Please use POST.'
        res.status(405)
        next(res)
    })

export default router
