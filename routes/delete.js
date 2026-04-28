import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import auth from '../auth/index.js'

/**
 * Handle DELETE /v1/api/delete - Delete an object by body or ID
 * Requires JWT authentication
 *
 * @async
 * @param {object} req - Express request
 * @param {string} [req.params._id] - Optional object ID from the URL
 * @param {object} req.body - Object containing delete instructions
 * @param {object} req.user - Authenticated user from JWT
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<object>} Deleted object metadata or status information
 */
export async function handleDelete(req, res, next) {
    return controller.deleteObj(req, res, next)
}

router.route('/')
    .delete(auth.checkJwt, handleDelete)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for deleting, please use DELETE.'
        res.status(405)
        next(res)
    })

router.route('/:_id')
    .delete(auth.checkJwt, handleDelete)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for deleting, please use DELETE.'
        res.status(405)
        next(res)
    })

export default router
