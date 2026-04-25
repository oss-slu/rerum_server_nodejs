import express from 'express'
import rateLimit from 'express-rate-limit'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import auth from '../auth/index.js'
import rest from '../rest.js'

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
})

router.use(limiter)
router.use(auth.checkJwt, auth.authRateLimiter)

router.route('/')
     .patch(controller.patchUnset)
     .post((req, res, next) => {
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
