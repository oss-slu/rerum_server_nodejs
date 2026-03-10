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

const sourcePath = '.env'

// Checks if a JWT token is expired based on its 'exp' claim.
const isTokenExpired = (token) => {
  if (!token) return true

  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    )

    return !payload.exp || Date.now() >= payload.exp * 1000
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

  const tokenObject = await response.json()

  // Handle HTTP or API errors
  if (!response.ok) {
    throw new Error(
      tokenObject.error_description ||
      tokenObject.error ||
      'Token refresh failed'
    )
  }

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
    await generateNewAccessToken()
    return
  }

  if (accessToken && isTokenExpired(accessToken)) {
    console.log('Access token expired. Refreshing...')
    await generateNewAccessToken()
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