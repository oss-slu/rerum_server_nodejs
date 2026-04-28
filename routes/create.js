#!/usr/bin/env node
import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import auth from '../auth/index.js'

/**
 * Handle POST /v1/api/create - Create new object
 * Requires JWT authentication
 *
 * @async
 * @param {object} req - Express request
 * @param {object} req.body - JSON object to create
 * @param {string} [req.body.@context] - JSON-LD context (optional)
 * @param {object} req.user - Authenticated user from JWT
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<object>} Created object with @id and __rerum metadata
 */
export async function handleCreate(req, res, next) {
    return controller.create(req, res, next)
}

router.route('/')
    .post(auth.checkJwt, handleCreate)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for creating, please use POST.'
        res.status(405)
        next(res)
    })

export default router
