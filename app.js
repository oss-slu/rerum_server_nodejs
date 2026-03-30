#!/usr/bin/env node

import express from 'express'
import path from 'path'
import cookieParser from 'cookie-parser'
import logger from 'morgan'
import cors from 'cors'
import csrf from 'csurf'
import indexRouter from './routes/index.js'
import apiRouter from './routes/api-routes.js'
import clientRouter from './routes/client.js'
import _gog_fragmentsRouter from './routes/_gog_fragments_from_manuscript.js';
import _gog_glossesRouter from './routes/_gog_glosses_from_manuscript.js';
import rest from './rest.js'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Creates and configures an Express application for the RERUM API server.
 * @param {Object} [options] - Configuration options to override environment variables
 * @param {string} [options.mongoConnectionString] - MongoDB connection string
 * @param {string} [options.mongoDbName] - MongoDB database name
 * @param {string} [options.mongoCollection] - MongoDB collection name
 * @param {boolean|string} [options.down] - Whether the server is in maintenance mode
 * @param {boolean|string} [options.readonly] - Whether the server is in readonly mode
 * @param {string} [options.clientId] - Auth0 client ID
 * @param {string} [options.clientSecret] - Auth0 client secret
 * @param {string} [options.rerumPrefix] - RERUM API prefix URL
 * @param {string} [options.rerumIdPrefix] - RERUM ID prefix URL
 * @param {string} [options.rerumAgentClaim] - RERUM agent claim URL
 * @param {string} [options.rerumContext] - RERUM context URL
 * @param {string} [options.rerumApiVersion] - RERUM API version
 * @param {string} [options.botAgent] - Bot agent URL
 * @param {string} [options.audience] - Auth0 audience
 * @param {string} [options.issuerBaseUrl] - Auth0 issuer base URL
 * @param {string} [options.botToken] - Bot token
 * @param {number} [options.port] - Server port
 * @returns {express.Application} Configured Express application
 */
export async function createApp(options = {}) {
  // Override environment variables with provided options
  if (options.mongoConnectionString) process.env.MONGO_CONNECTION_STRING = options.mongoConnectionString
  if (options.mongoDbName) process.env.MONGODBNAME = options.mongoDbName
  if (options.mongoCollection) process.env.MONGODBCOLLECTION = options.mongoCollection
  if (options.down !== undefined) process.env.DOWN = String(options.down)
  if (options.readonly !== undefined) process.env.READONLY = String(options.readonly)
  if (options.clientId) process.env.CLIENTID = options.clientId
  if (options.clientSecret) process.env.RERUMSECRET = options.clientSecret
  if (options.rerumPrefix) process.env.RERUM_PREFIX = options.rerumPrefix
  if (options.rerumIdPrefix) process.env.RERUM_ID_PREFIX = options.rerumIdPrefix
  if (options.rerumAgentClaim) process.env.RERUM_AGENT_CLAIM = options.rerumAgentClaim
  if (options.rerumContext) process.env.RERUM_CONTEXT = options.rerumContext
  if (options.rerumApiVersion) process.env.RERUM_API_VERSION = options.rerumApiVersion
  if (options.botAgent) process.env.BOT_AGENT = options.botAgent
  if (options.audience) process.env.AUDIENCE = options.audience
  if (options.issuerBaseUrl) process.env.ISSUER_BASE_URL = options.issuerBaseUrl
  if (options.botToken) process.env.BOT_TOKEN = options.botToken
  if (options.port) process.env.PORT = String(options.port)

  const app = express()

//Middleware to use

/**
 * Get the various CORS headers right
 * "methods" : Allow 
 * "allowedMethods" : Access-Control-Allow-Methods  (Allow ALL the methods)
 * "allowedHeaders" : Access-Control-Allow-Headers  (Allow custom headers)
 * "exposedHeaders" : Access-Control-Expose-Headers (Expose the custom headers)
 * "origin" : "*"   : Access-Control-Allow-Origin   (Allow ALL the origins)
 * "maxAge" : "600" : Access-Control-Max-Age        (how long to cache preflight requests, 10 mins)
 */
app.use(
  cors({
    "methods" : "GET,OPTIONS,HEAD,PUT,PATCH,DELETE,POST",
    "allowedHeaders" : [
      'Content-Type',
      'Content-Length',
      'Allow',
      'Authorization',
      'Location',
      'ETag',
      'Connection',
      'Keep-Alive',
      'Date',
      'Cache-Control',
      'Last-Modified',
      'Link',
      'X-HTTP-Method-Override',
      'Origin',
      'Referrer',
      'User-Agent'
    ],
    "exposedHeaders" : "*",
    "origin" : "*",
    "maxAge" : "600"
  })
)

  // Import config after environment variables are set
  const { default: config } = await import('./config/index.js')

  app.use(logger('dev'))
  app.use(express.json())
  app.use(express.text())
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(csrf())

//Publicly available scripts, CSS, and HTML pages.
app.use(express.static(path.join(__dirname, 'public')))

/**
 * For any request that comes through to the app, check whether or not we are in maintenance mode.
 * If we are, then show the sad puppy.  Otherwise, continue on.
 * This is without middleware
 */
app.all('*_', (req, res, next) => {
  if(config.DOWN === "true"){
      res.status(503).json({"message":"RERUM v1 is down for updates or maintenance at this time.  We apologize for the inconvenience.  Try again later."})
  }
  else{
      next() //pass on to the next app.use
  }
})

app.use('/', indexRouter)

app.use('/v1', apiRouter)

app.use('/client', clientRouter)

app.use('/gog/fragmentsInManuscript', _gog_fragmentsRouter)
app.use('/gog/glossesInManuscript', _gog_glossesRouter)

/**
 * Handle API errors and warnings RESTfully.  All routes that don't end in res.send() will end up here.
 * Important to note that res.json() will fail to here
 * Important to note api-routes.js handles all the 405s without failing to here - they res.send()
 * Important to note that failures in the controller from the mongo client will fail to here
 * 
 * */
app.use(rest.messenger)

//catch 404 because of an invalid site path
app.use((req, res, next) => {
    let msg = res.statusMessage ?? "This page does not exist"
    res.status(404).send(msg)  
    res.end()
})

  return app
}

/**
 * Default export creates an app with default configuration.
 * For backward compatibility and simple usage.
 */
const app = await createApp()
export default app
