import { jest } from "@jest/globals"
import controller from '../../db-controller.js'
import config from '../../config/index.js'

it("Functional '@id-id' negotiation on objects returned.", async () => {
  let negotiate = {
    "@context": "http://iiif.io/api/presentation/3/context.json",
    "_id": "example",
    "@id": `${config.RERUM_ID_PREFIX}example`,
    "test": "item"
  }
  negotiate = controller.idNegotiation(negotiate)
  expect(negotiate._id).toBeUndefined()
  expect(negotiate["@id"]).toBeUndefined()
  expect(negotiate.id).toBe(`${config.RERUM_ID_PREFIX}example`)
  expect(negotiate.test).toBe("item")

  let nonegotiate = {
    "@context":"http://example.org/context.json",
    "_id": "example",
    "@id": `${config.RERUM_ID_PREFIX}example`,
    "id": "test_example",
    "test":"item"
  }
  nonegotiate = controller.idNegotiation(nonegotiate)
  expect(nonegotiate._id).toBeUndefined()
  expect(nonegotiate["@id"]).toBe(`${config.RERUM_ID_PREFIX}example`)
  expect(nonegotiate.id).toBe("test_example")
  expect(nonegotiate.test).toBe("item")
})
