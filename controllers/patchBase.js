#!/usr/bin/env node

/**
 * Base PATCH controller for RERUM operations
 * Provides shared logic for patchSet, patchUnset, and patchUpdate operations
 * @author Claude Sonnet 4, cubap, thehabes
 */

import { newID, isValidID, db } from '../database/client.js'
import { isDeleted } from '../predicates.js'
import { configureRerumOptions } from '../versioning.js'
import { configureWebAnnoHeadersFor } from '../headers.js'
import config from '../config/index.js'
import { _contextid, ObjectID, createExpressError, getAgentClaim, parseDocumentID, idNegotiation, alterHistoryNext } from './utils.js'

/**
 * Base function for PATCH operations that handles common logic
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 * @param {Function} processObject - Function that processes the object (set/unset/update specific logic)
 * @param {string} operationName - Name of the operation for logging
 * @returns {Promise<void>}
 */
const basePatchOperation = async function (req, res, next, processObject, operationName = "PATCH") {
    let err = { message: `` }
    res.set("Content-Type", "application/json; charset=utf-8")
    let objectReceived = JSON.parse(JSON.stringify(req.body))
    let patchedObject = {}
    let generatorAgent = getAgentClaim(req, next)
    const receivedID = objectReceived["@id"] ?? objectReceived.id

    if (receivedID) {
        let id = parseDocumentID(receivedID)
        let originalObject
        try {
            originalObject = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
        } catch (error) {
            next(createExpressError(error))
            return
        }

        if (null === originalObject) {
            //This object is not in RERUM, they want to import it.  Do that automatically.
            //updateExternalObject(objectReceived)
            err = Object.assign(err, {
                message: `This object is not from RERUM and will need imported. This is not automated yet. You can make a new object with create. ${err.message}`,
                status: 501
            })
        }
        else if (isDeleted(originalObject)) {
            err = Object.assign(err, {
                message: `The object you are trying to update is deleted. ${err.message}`,
                status: 403
            })
        }
        else {
            // Call the specific processing function
            const result = processObject(originalObject, objectReceived, patchedObject)

            if (result.noChanges) {
                // No changes were made, return original object
                res.set(configureWebAnnoHeadersFor(originalObject))
                originalObject = idNegotiation(originalObject)
                originalObject.new_obj_state = JSON.parse(JSON.stringify(originalObject))
                res.location(originalObject[_contextid(originalObject["@context"]) ? "id":"@id"])
                res.status(200)
                res.json(originalObject)
                return
            }

            // Use the processed object
            patchedObject = result.patchedObject

            // Create new version
            const id = ObjectID()
            let context = patchedObject["@context"] ? { "@context": patchedObject["@context"] } : {}
            let rerumProp = { "__rerum": configureRerumOptions(generatorAgent, originalObject, true, false)["__rerum"] }
            delete patchedObject["__rerum"]
            delete patchedObject["_id"]
            delete patchedObject["@id"]
            delete patchedObject["@context"]
            let newObject = Object.assign(context, { "@id": config.RERUM_ID_PREFIX + id }, patchedObject, rerumProp, { "_id": id })

            console.log(operationName)
            try {
                let result = await db.insertOne(newObject)
                if (alterHistoryNext(originalObject, newObject["@id"])) {
                    //Success, the original object has been updated.
                    res.set(configureWebAnnoHeadersFor(newObject))
                    newObject = idNegotiation(newObject)
                    newObject.new_obj_state = JSON.parse(JSON.stringify(newObject))
                    res.location(newObject[_contextid(newObject["@context"]) ? "id":"@id"])
                    res.status(200)
                    res.json(newObject)
                    return
                }
                err = Object.assign(err, {
                    message: `Unable to alter the history next of the originating object.  The history tree may be broken. See ${originalObject["@id"]}. ${err.message}`,
                    status: 500
                })
            }
            catch (error) {
                //WriteError or WriteConcernError
                next(createExpressError(error))
                return
            }
        }
    }
    else {
        //The http module will not detect this as a 400 on its own
        err = Object.assign(err, {
            message: `Object in request body must have the property '@id' or 'id'. ${err.message}`,
            status: 400
        })
    }
    next(createExpressError(err))
}

export { basePatchOperation }