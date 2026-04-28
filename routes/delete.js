import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import auth from '../auth/index.js'

/**
 * DELETE /v1/api/delete or DELETE /v1/api/delete/:_id - Delete an object
 * Requires JWT authentication
 * 
 * @param {string} [req.params._id] - Optional object ID from URL
 * @param {object} req.body - Object containing delete instructions
 * @param {object} req.user - Authenticated user from JWT token
 * @returns {object} Deleted object metadata or status information
 */
router.route('/')
    .delete(auth.checkJwt, controller.deleteObj)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for deleting, please use DELETE.'
        res.status(405)
        next(res)
    })

router.route('/:_id')
    .delete(auth.checkJwt, controller.deleteObj)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for deleting, please use DELETE.'
        res.status(405)
        next(res)
    })

export default router
