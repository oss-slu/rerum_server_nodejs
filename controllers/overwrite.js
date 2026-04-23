#!/usr/bin/env node

/**
 * Overwrite controller for RERUM operations
 * Handles overwrite operations with optimistic locking
 * @author Claude Sonnet 4, cubap, thehabes
 */

import { newID, isValidID, db } from '../database/client.js'
import { isDeleted, isReleased, isGenerator } from '../predicates.js'
import { configureWebAnnoHeadersFor } from '../headers.js'
import { _contextid, ObjectID, createError, createExpressError, getAgentClaim, parseDocumentID, idNegotiation } from './utils.js'

/**
 * Replace some existing object in MongoDB with the JSON object in the request body.
 * Order the properties to preference @context and @id.  Put __rerum and _id last. 
 * DO NOT Track History
 * Respond RESTfully
 * */
const overwrite = async function (req, res, next) {
    let errMessage = ""
    let errStatus = 0
    res.set("Content-Type", "application/json; charset=utf-8")
    let objectReceived = JSON.parse(JSON.stringify(req.body))
    let agentRequestingOverwrite = getAgentClaim(req, next)
    const receivedID = objectReceived["@id"] ?? objectReceived.id
    if (receivedID) {
        console.log("OVERWRITE")
        let id = parseDocumentID(receivedID)
        let originalObject
        try {
            originalObject = await db.findOne({"$or":[{"_id": id}, {"__rerum.slug": id}]})
        } catch (error) {
            next(createExpressError(error))
            return
        }
        if (null === originalObject) {
            errMessage = `No object with this id could be found in RERUM. Cannot overwrite. ${errMessage}`
            errStatus = 404
        }
        else if (isDeleted(originalObject)) {
            errMessage = `The object you are trying to overwrite is deleted. ${errMessage}`
            errStatus = 403
        }
        else if (isReleased(originalObject)) {
            errMessage = `The object you are trying to overwrite is released.  Fork with /update to make changes. ${errMessage}`
            errStatus = 403
        }
        else if (!isGenerator(originalObject, agentRequestingOverwrite)) {
            errMessage = `You are not the generating agent for this object. You cannot overwrite it. Fork with /update to make changes. ${errMessage}`
            errStatus = 401
        }
        else {
            // Optimistic locking check - no expected version is a brutal overwrite
            const expectedVersion = req.get('If-Overwritten-Version') ?? req.body.__rerum?.isOverwritten
            const currentVersionTS = originalObject.__rerum?.isOverwritten ?? ""
            
            if (expectedVersion !== undefined && expectedVersion !== currentVersionTS) {
                res.status(409)
                res.json({
                    currentVersion: originalObject
                })
                return
            }
            else {
                let context = objectReceived["@context"] ? { "@context": objectReceived["@context"] } : {}
                let rerumProp = { "__rerum": originalObject["__rerum"] }
                rerumProp["__rerum"].isOverwritten = new Date(Date.now()).toISOString().replace("Z", "")
                const id = originalObject["_id"]
                //Get rid of them so we can enforce the order
                delete objectReceived["@id"]
                delete objectReceived["_id"]
                delete objectReceived["__rerum"]
                // id is also protected in this case, so it can't be set.
                if(_contextid(objectReceived["@context"])) delete objectReceived.id
                delete objectReceived["@context"]
                let newObject = Object.assign(context, { "@id": originalObject["@id"] }, objectReceived, rerumProp, { "_id": id })
                let result
                try {
                    result = await db.replaceOne({ "_id": id }, newObject)
                } catch (error) {
                    next(createExpressError(error))
                    return
                }
                if (result.modifiedCount == 0) {
                    //result didn't error out, the action was not performed.  Sometimes, this is a neutral thing.  Sometimes it is indicative of an error.
                }
                // Include current version in response headers for future optimistic locking
                res.set('Current-Overwritten-Version', rerumProp["__rerum"].isOverwritten)
                res.set(configureWebAnnoHeadersFor(newObject))
                newObject = idNegotiation(newObject)
                newObject.new_obj_state = JSON.parse(JSON.stringify(newObject))
                res.location(newObject[_contextid(newObject["@context"]) ? "id":"@id"])
                res.json(newObject)
                return
            }
        }
    }
    else {
        //This is a custom one, the http module will not detect this as a 400 on its own
        errMessage = `Object in request body must have the property '@id' or 'id'. ${errMessage}`
        errStatus = 400
    }
    next(createExpressError(createError(errStatus, errMessage)))
}

export { overwrite }
