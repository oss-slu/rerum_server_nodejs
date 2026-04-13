import http from 'http'
import { createApp } from './app.js'

/**
 * Creates a configured Express application instance.
 * @param {Object} [options] - Configuration options (see createApp in app.js)
 * @returns {Promise<import('express').Application>} Configured Express application
 */
export async function createRerumApp(options = {}) {
  return await createApp(options)
}

/**
 * Express application instance with default configuration.
 * Exported primarily for testing or embedding inside another server.
 *
 * ```js
 * import { app } from 'rerum_server_nodejs'
 * ```
 */
export const app = await createApp()

/**
 * Default export is the express app largely for backwards compatibility
 * with consumers that do `import app from 'rerum_server_nodejs'`.
 */
export default app

/**
 * Helper that creates an HTTP server for the configured express app.
 * The returned server is **not** listening yet; caller may attach
 * additional listeners or configure timeouts before calling
 * `server.listen(...)`.
 *
 * For backwards compatibility, this function accepts a numeric port
 * as `createServer(0)` and returns the `Server` instance directly.
 *
 * @param {number|Object} [portOrOptions=process.env.PORT||3001] port override or options object.
 * @returns {import('http').Server} http server instance
 */
export function createServer(portOrOptions = process.env.PORT ?? 3001) {
  let port = process.env.PORT ?? 3001

  if (typeof portOrOptions === 'object' && portOrOptions !== null) {
    port = portOrOptions.port ?? port
  } else {
    port = portOrOptions
  }

  app.set('port', port)
  const server = http.createServer(app)

  server.keepAliveTimeout = 8 * 1000
  server.headersTimeout = 8.5 * 1000

  return server
}

/**
 * Async helper to create a server from custom options.
 * @param {Object} [options] - Configuration options for the app and port
 * @returns {Promise<import('http').Server>} http server instance
 */
export async function createServerAsync(options = {}) {
  const port = options.port ?? process.env.PORT ?? 3001
  const rerumApp = await createRerumApp(options)
  rerumApp.set('port', port)
  const server = http.createServer(rerumApp)

  server.keepAliveTimeout = 8 * 1000
  server.headersTimeout = 8.5 * 1000

  return server
}

/**
 * Convenience function to start the server immediately. Returns http server.
 * For backwards compatibility, this accepts a port number and returns a server.
 *
 * @param {number|Object} [portOrOptions] port or options object
 * @returns {import('http').Server}
 */
export function start(portOrOptions) {
  let port = process.env.PORT ?? 3001

  if (typeof portOrOptions === 'object' && portOrOptions !== null) {
    port = portOrOptions.port ?? port
  } else if (typeof portOrOptions !== 'undefined') {
    port = portOrOptions
  }

  const server = createServer(port)
  server.listen(port)
  server.on('listening', () => {
    console.log('LISTENING ON ' + port)
  })
  return server
}

/**
 * Async convenience start for custom options.
 * @param {Object} [options]
 * @returns {Promise<import('http').Server>}
 */
export async function startAsync(options = {}) {
  const port = options.port ?? process.env.PORT ?? 3001
  const server = await createServerAsync(options)
  server.listen(port)
  server.on('listening', () => {
    console.log('LISTENING ON ' + port)
  })
  return server
}
