import express from 'express'
const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'
import auth from '../auth/index.js'
import rest from '../rest.js'
import rateLimit from 'express-rate-limit'

const patchSetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 patch-set requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
})

router.route('/')
    .patch(auth.checkJwt, patchSetLimiter, controller.patchSet)
    .post(auth.checkJwt, patchSetLimiter, (req, res, next) => {
        if (rest.checkPatchOverrideSupport(req, res)) {
            controller.patchSet(req, res, next)
        }
        else {
            res.statusMessage = 'Improper request method for updating, please use PATCH to add new keys to this object.'
            res.status(405)
            next(res)
        }
    }) 
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method for updating, please use PATCH to add new keys to this object.'
        res.status(405)
        next(res)
    })

export default router
