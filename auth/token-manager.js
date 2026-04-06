/**
 * Token Manager for RERUM Auth0 integration.
 * 
 * This module handles automatic access-token refresh using the existing
 * RERUM/Auth0 refresh-token flow. It does NOT create or manage tokens
 * independently; instead it proxies token refresh requests through the
 * configured Auth0/RERUM token endpoint
 */

import config from '../config/index.js'
import fs from 'node:fs/promises'

const sourcePath = process.env.ENV_FILE_PATH ?? '.env'
let refreshInFlight = null

// Checks if a JWT token is expired based on its 'exp' claim.
const isTokenExpired = (token) => {
  if (!token) return true

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true

    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    )

    const SKEW_MS = 30 * 1000 // 30 seconds

    return !payload.exp || Date.now() >= (payload.exp * 1000 - SKEW_MS)
  } catch (err) {
    console.error('Failed to parse token:', err)
    return true
  }
}

/** Generates a new access token using the stored refresh token.
 * The refresh token must come from the Auth0 UX registration/login flow.
 * If no refresh token is available, the server cannot request a new
 * access token automatically.

*/
async function generateNewAccessToken() {
  const refreshToken = config.REFRESH_TOKEN || process.env.REFRESH_TOKEN
  const tokenUrl = config.RERUM_ACCESS_TOKEN_URL || process.env.RERUM_ACCESS_TOKEN_URL

  if (!refreshToken) {
    throw new Error(
      'No refresh token available. Please register through the Auth0 UX flow first.'
    )
  }

  if (!tokenUrl) {
    throw new Error('No token refresh URL configured.')
  }

  // Request a new access token from the Auth0/RERUM token endpoint
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  })

  let tokenObject

  try {
    tokenObject = await response.json()
  } catch (err) {
    throw new Error(`Failed to parse token response (status ${response.status})`)
  }

  // Handle HTTP or API errors
  if (!response.ok) {
    throw new Error(
      tokenObject.error_description ||
      tokenObject.error ||
      'Token refresh failed'
    )
  }

  //NOTE: We intentionally update process.env at runtime so the latest access token
  // is available across the application. Callers should prefer using
  // getValidAccessToken() instead of reading process.env directly.
  process.env.ACCESS_TOKEN = tokenObject.access_token

  // Auth0 may return a new refresh token depending on configuration
  if (tokenObject.refresh_token) {
    process.env.REFRESH_TOKEN = tokenObject.refresh_token
  }

  try {
    const data = await fs.readFile(sourcePath, { encoding: 'utf8' })

    let envContent = data

    const accessTokenLine = `ACCESS_TOKEN=${tokenObject.access_token}`

    if (envContent.includes('ACCESS_TOKEN=')) {
      envContent = envContent.replace(/ACCESS_TOKEN=.*/g, accessTokenLine)
    } else {
      envContent += `\n${accessTokenLine}`
    }

    await fs.writeFile(sourcePath, envContent)

    console.log('Access token updated successfully.')
  } catch (err) {
    console.warn('Could not update .env file. Token updated in memory only.')
  }

  return tokenObject.access_token
}

/**
 * This function checks whether the existing access token is expired.
 * If it is expired, it automatically generates a new one
 * using the stored refresh token
 */

async function checkAndRefreshAccessToken() {
  const accessToken = config.ACCESS_TOKEN || process.env.ACCESS_TOKEN
  const refreshToken = config.REFRESH_TOKEN || process.env.REFRESH_TOKEN

  if (!accessToken && refreshToken) {
    if (!refreshInFlight) {
      refreshInFlight = generateNewAccessToken().finally(() => {
        refreshInFlight = null
      })
    }

    await refreshInFlight
    return
  }

  if (accessToken && isTokenExpired(accessToken)) {
    console.log('Access token expired. Refreshing...')

    if (!refreshInFlight) {
      refreshInFlight = generateNewAccessToken().finally(() => {
        refreshInFlight = null
      })
    }

    await refreshInFlight
  }
}

/**
 * Retrieve a valid access token for use in API requests. 
 */
async function getValidAccessToken() {
  await checkAndRefreshAccessToken()
  return process.env.ACCESS_TOKEN || config.ACCESS_TOKEN
}

export default {
  isTokenExpired,
  generateNewAccessToken,
  checkAndRefreshAccessToken,
  getValidAccessToken
}