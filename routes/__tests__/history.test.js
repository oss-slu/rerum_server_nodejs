import { jest } from "@jest/globals"

// Only real way to test an express route is to mount it and call it so that we can use the req, res, next.
import express from "express"
import request from "supertest"
import rateLimit from "express-rate-limit"
import controller from '../../db-controller.js'

const routeTester = new express()
routeTester.use(express.json())
routeTester.use(express.urlencoded({ extended: false }))

const historyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
})

// Mount our own /history route without auth that will use controller.history
routeTester.get("/history/:_id", historyLimiter, controller.history)

it("'/history/:id' route functions", async () => {

  const response = await request(routeTester)
    .get("/history/11111")
    .set("Content-Type", "application/json")
    .then(resp => resp)
    .catch(err => err)
  expect(response.statusCode).toBe(200)
  expect(response.headers["content-length"]).toBeTruthy()
  expect(response.headers["content-type"]).toBeTruthy()
  expect(response.headers["date"]).toBeTruthy()
  expect(response.headers["etag"]).toBeTruthy()
  expect(response.headers["allow"]).toBeTruthy()
  expect(response.headers["link"]).toBeTruthy()
  expect(Array.isArray(response.body)).toBe(true)
})