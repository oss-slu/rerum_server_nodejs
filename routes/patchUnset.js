import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import auth from '../auth/index.js'
import rest from '../rest.js'
import rateLimit from 'express-rate-limit'

const patchUnsetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 patch-unset requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
})

router.route('/')
    .patch(auth.checkJwt, patchUnsetLimiter, controller.patchUnset)
    .post(auth.checkJwt, patchUnsetLimiter, (req, res, next) => {
        if (rest.checkPatchOverrideSupport(req, res)) {
            controller.patchUnset(req, res, next)
        }
        else {
            res.statusMessage = 'Improper request method for updating, please use PATCH to remove keys from this object.'
            res.status(405)
            next(res)
        }
    }) 
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for updating, please use PATCH to remove keys from this object.'
        res.status(405)
        next(res)
    })

export default router
