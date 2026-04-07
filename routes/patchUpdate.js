#!/usr/bin/env node
import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import rest from '../rest.js'
import auth from '../auth/index.js'
import rateLimit from 'express-rate-limit'

const patchUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 patch-update requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
})

router.route('/')
    .patch(auth.checkJwt, patchUpdateLimiter, controller.patchUpdate) 
    .post(auth.checkJwt, patchUpdateLimiter, (req, res, next) => {
        if (rest.checkPatchOverrideSupport(req, res)) {
            controller.patchUpdate(req, res, next)
        }
        else {
            res.statusMessage = 'Improper request method for updating, please use PATCH to alter the existing keys this object.'
            res.status(405)
            next(res)
        }
    }) 
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for updating, please use PATCH to alter existing keys on this object.'
        res.status(405)
        next(res)
    })

export default router
