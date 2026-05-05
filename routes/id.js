import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'

/**
 * GET /v1/id/:_id - Retrieve object by ID or slug
 * HEAD /v1/id/:_id - Retrieve metadata headers for an object
 * Public endpoint, no authentication required
 * 
 * @param {string} req.params._id - Object ID or slug
 * @returns {object} Retrieved object or deleted object metadata
 */
router.route('/:_id')
    .get(controller.id)
    .head(controller.idHeadRequest)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method, please use GET.'
        res.status(405)
        next(res)
    })

export default router

