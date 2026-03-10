
/**
 * Middleware to automatically check and refresh the server's Auth0/RERUM access token
 * before processing authenticated operations. Uses the existing token manager to
 * preserve the Auth0 refresh-token workflow.
 * 
 * This runs before client JWT validation to ensure the backend's token is fresh
 * for any internal authenticated calls.
 */

import tokenManager from './token-manager.js'

/**
 * Middleware function to refresh the server's access token if expired.
 * Logs errors but does not fail the request to avoid blocking client operations.
 */
const tokenRefreshMiddleware = async (req, res, next) => {
  try {
    await tokenManager.checkAndRefreshAccessToken()
    next()
  } catch (error) {
    console.error('Server token refresh failed:', error.message)
    // Continue processing the request even if refresh fails
    next()
  }
}

export default tokenRefreshMiddleware