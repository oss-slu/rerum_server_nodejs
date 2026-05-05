import express from 'express'
import rateLimit from 'express-rate-limit'

const router = express.Router()
//This controller will handle all MongoDB interactions.
import controller from '../db-controller.js'

const sinceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
})

router.route('/:_id')
    .get(sinceLimiter, controller.since)
    .head(sinceLimiter, controller.sinceHeadRequest)
    .all((req, res, next) => {
        res.statusMessage = 'Improper request method, please use GET.'
        res.status(405)
        next(res)
    })

export default router