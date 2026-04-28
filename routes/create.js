#!/usr/bin/env node
import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import auth from '../auth/index.js'

/**
 * POST /v1/api/create - Create new object
 * Requires JWT authentication
 * 
 * @param {object} req.body - JSON object to create
 * @param {string} [req.body.@context] - JSON-LD context (optional)
 * @param {object} req.user - Authenticated user from JWT token
 * @returns {object} Created object with @id and __rerum metadata
 */
router.route('/')
    .post(auth.checkJwt, controller.create)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for creating, please use POST.'
        res.status(405)
        next(res)
    })

export default router
