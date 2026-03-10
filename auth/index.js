import { auth } from 'express-oauth2-jwt-bearer'
import config from '../config/index.js'

/**
 * Parse and decode the JWT payload from the Authorization header.
 * @param {Object} req - Express request object
 * @returns {Object} decoded JWT payload
 */
const parseAuthHeaderPayload = (req) => {
    const token = req.header('authorization').split(' ')[1]
    const payload = token.split('.')[1]
    return JSON.parse(Buffer.from(payload, 'base64').toString())
}

/**
 * Request a token object from Auth0 using the provided form payload.
 * @param {Object} form - Auth0 token request payload
 * @returns {Object} token response object or error object
 */
const requestTokenFromAuth0 = async (form) => {
    return await fetch('https://cubap.auth0.com/oauth/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
    })
        .then(resp => resp.json())
        .catch(err => {
            console.error(err)
            return { error: true, error_description: err }
        })
}

/**
 * Handles invalid token errors from express-oauth2-jwt-bearer.
 * If the error is not an invalid_token, passes it to next.
 * Otherwise, checks if the user is a bot; if so, allows the request.
 * If not, passes the error to next.
 * @param {Error} err - The error from the auth middleware.
 * @param {Object} req - The request object.
 * @param {Object} res - Unused response object.
 * @param {Function} next - The next middleware function.
 */
const _tokenError = function (err, req, res, next) {
    if (!err.code || err.code !== 'invalid_token') {
        next(err)
        return
    }

    try {
        const user = parseAuthHeaderPayload(req)
        if (isBot(user)) {
            console.log('Request allowed via bot check')
            next()
            return
        }
    }
    catch (e) {
        e.message = e.statusMessage = 'This token did not contain a known RERUM agent.'
        e.status = 401
        e.statusCode = 401
        next(e)
        return
    }

    next(err)
}

/**
 * Extracts the user object from the JWT in the Authorization header.
 * Parses the JWT payload and sets req.user.
 * If parsing fails, passes an error to next.
 * @param {Object} req - The request object.
 * @param {Object} res - Unused response object.
 * @param {Function} next - The next middleware function.
 */
const _extractUser = (req, res, next) => {
    try {
        req.user = parseAuthHeaderPayload(req)
        next()
    }
    catch (e) {
        e.message = e.statusMessage = 'This token did not contain a known RERUM agent.'
        e.status = 401
        e.statusCode = 401
        next(e)
    }
}

/**
 * Use like:
 * app.get('/api/private', checkJwt, function(req, res) {
 *   // do authorized things
 * });
 */
const checkJwt = [READONLY, auth(), _tokenError, _extractUser]

/**
 * Public API proxy to generate new access tokens through Auth0
 * with a refresh token when original access has expired.
 * @param {ExpressRequest} req from registered server application.
 * @param {ExpressResponse} res to return the new token.
 */
const generateNewAccessToken = async (req, res, next) => {
    console.log('RERUM v1 is generating a proxy access token.')

    const form = {
        grant_type: 'refresh_token',
        client_id: config.CLIENT_ID,
        client_secret: config.CLIENT_SECRET,
        refresh_token: req.body.refresh_token,
        redirect_uri: config.RERUM_PREFIX
    }

    try {
        const tokenObj = await requestTokenFromAuth0(form)

        if (tokenObj.error) {
            console.error(tokenObj.error_description)
            res.status(500).send(tokenObj.error_description)
        }
        else {
            res.status(200).send(tokenObj)
        }
    }
    catch (e) {
        console.error(e.response ? e.response.body : e.message ? e.message : e)
        res.status(500).send(e)
    }
}

/**
 * Used by RERUM to renew the refresh token upon user request.
 * @param {ExpressRequest} req from registered server application.
 * @param {ExpressResponse} res to return the new token.
 */
const generateNewRefreshToken = async (req, res, next) => {
    console.log('RERUM v1 is generating a new refresh token.')

    const form = {
        grant_type: 'authorization_code',
        client_id: config.CLIENT_ID,
        client_secret: config.CLIENT_SECRET,
        code: req.body.authorization_code,
        redirect_uri: config.RERUM_PREFIX
    }

    try {
        const tokenObj = await requestTokenFromAuth0(form)

        if (tokenObj.error) {
            console.error(tokenObj.error_description)
            res.status(500).send(tokenObj.error_description)
        }
        else {
            res.status(200).send(tokenObj)
        }
    }
    catch (e) {
        console.error(e.response ? e.response.body : e.message ? e.message : e)
        res.status(500).send(e)
    }
}

/**
 * Upon requesting an action, confirm the request has a valid token.
 * @param {(Base64)String} secret access_token from `Bearer` header in request
 * @returns decoded payload of JWT if successful
 * @throws Error if token, signature, or date is invalid
 */
const verifyAccess = (secret) => {
    return jwt({
        secret,
        audience: 'http://rerum.io/api',
        issuer: 'https://rerum.io/',
        algorithms: ['RS256']
    })
}

/**
 *
 * @param {Object} obj RERUM database entry
 * @param {Object} userObj User object discerned from token
 * @returns Boolean match between encoded Generator Agent and obj generator
 */
const isGenerator = (obj, userObj) => {
    return userObj[config.RERUM_AGENT_CLAIM] === obj.__rerum.generatedBy
}

/**
 * Even expired tokens may be accepted if the Agent is a known bot. This is a
 * dangerous thing to include, but may be a useful convenience.
 * @param {Object} userObj User object discerned from token
 * @returns Boolean for matching ID.
 */
const isBot = (userObj) => {
    return config.BOT_AGENT === userObj[config.RERUM_AGENT_CLAIM]
}

function READONLY(req, res, next) {
    if (config.READONLY === 'true') {
        res.status(503).json({ message: 'RERUM v1 is read only at this time.  We apologize for the inconvenience.  Try again later.' })
        return
    }

    next()
}

export default {
    checkJwt,
    generateNewAccessToken,
    generateNewRefreshToken,
    verifyAccess,
    isBot,
    isGenerator,
    READONLY
}