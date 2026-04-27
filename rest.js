#!/usr/bin/env node

/**
 * This module is used for any REST support functionality.  It is used as middleware and so
 * has access to the http module request and response objects, as well as next()
 * It is in charge of responding to the client. 
 * 
 * @author thehabes 
 */

/**
 * Since programming languages with HTTP packages don't all support PATCH, we have to detect the workaround.
 * There are 3 conditions leading to a boolean outcome.  error messaging is handled upstream.  
 * This is routed to by a res.post() so the request method is ALWAYS POST
 *
 *  X-HTTP-Method-Override header is not present means "no", there is no override support, POST is the wrong method so 405
 *  X-HTTP-Method-Override header is present, !== PATCH means "no", you have done a POST and are not emulating it as a PATCH, so 405
 *  X-HTTP-Method-Override header is present, == PATCH, and method request is POST means "yes", you are emulating a POST as a PATCH, correct method 200
 *
 *  The error handler sits a level up, so do not res.send() here.  Just give back a boolean
 */
import config from './config/index.js'

const checkPatchOverrideSupport = function (req, res) {
    const override = req.header("X-HTTP-Method-Override")
    return undefined !== override && override === "PATCH"
}

/**
 * Throughout the routes are certain warning, error, and hard fail scenarios.
 * REST is all about communication.  The response code and the textual body are particular.
 * RERUM is all about being clear.  It will build custom responses sometimes for certain scenarios, will remaining RESTful.
 * 
 * You have likely reached this with a next(createExpressError(err)) call.  End here and send the error.
 */
const messenger = function (err, req, res, next) {
    if (res.headersSent) {
        return
    }
    let error = {}
    error.message = err.statusMessage ?? err.message ?? ``
    error.status = err.statusCode ?? err.status ?? 500
    if (error.status === 401) {
        //Special handler for token errors from the oauth module
        //Token errors come through with a message that we want.  That message is in the error's WWW-Authenticate header
        //Other 401s from our app come through with a status message.  They may not have headers.
        if (err.headers?.["WWW-Authenticate"]) {
            error.message += err.headers["WWW-Authenticate"]
        }
    }
    let token = req.header("Authorization")
    if(token && !token.startsWith("Bearer ")){
        error.message +=`
Your token is not in the correct format.  It should be a Bearer token formatted like: "Bearer <token>"`
    }
    switch (error.status) {
        case 400:
            //"Bad Request", most likely because the body and Content-Type are not aligned.  Could be bad JSON.
            error.message = error.message || 
                 "Invalid request: Ensure your request body and Content-Type are correct. If sending JSON, verify it is valid.";
            break
        case 401:
            //The requesting agent is known from the request.  That agent does not match __rerum.generatedBy.  Unauthorized.
            if (token) {
                error.message = error.message || 
                    "Unauthorized: The provided token is invalid or expired. Verify your Bearer token.";
            }
            else {
                error.message = error.message || 
                    `Unauthorized: Missing Authorization header. Include a Bearer token (Authorization: Bearer <token>). Register at ${config.RERUM_PREFIX}.`;
            }
            break
        case 403:
            //Forbidden to use this.  The provided Bearer does not have the required privileges. 
            if (token) {
                error.message = error.message ||
`You are Forbidden from performing this action.  Check your privileges.
Token: ${token}`
            }
            else {
                //If there was no Token, this would be a 401.  If you made it here, you didn't REST.
                error.message = error.message ||
                    `Forbidden: No Authorization token provided. Ensure you are authenticated via ${config.RERUM_PREFIX}.`;
            }
            break
        case 404:
            error.message = error.message || 
                "Not Found: The requested resource does not exist or the endpoint is incorrect.";
            break
        case 405:
            error.message = error.message || 
                "Method Not Allowed: Check the HTTP method used for this endpoint.";
            break
        case 409:
            error.message = error.message || 
                "Conflict: The request could not be completed due to a conflict with the current state of the resource.";
            break
        case 501:
            error.message = error.message || 
                "Not Implemented: This functionality is not yet supported.";
            break
        case 503:
            error.message = error.message || 
                "Service Unavailable: The server is temporarily unable to handle the request.";
            break
        case 500:
        default:  
            error.message = error.message ||
                 "Internal Server Error: An unexpected error occurred. Please try again later.";
    }
    console.error(error)
    res.set("Content-Type", "text/plain; charset=utf-8")
    res.status(error.status).send(error.message)
}

export default { checkPatchOverrideSupport, messenger }
