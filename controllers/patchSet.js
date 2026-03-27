#!/usr/bin/env node

/**
 * PATCH Set controller for RERUM operations
 * Handles PATCH operations that add new keys only
 * @author Claude Sonnet 4, cubap, thehabes
 */

import { basePatchOperation } from './patchBase.js'
import { _contextid } from './utils.js'

/**
 * Process function for PATCH set operation
 * Adds new keys only, ignores existing keys
 */
const processPatchSet = (originalObject, objectReceived, patchedObject) => {
    patchedObject = JSON.parse(JSON.stringify(originalObject))
    if(_contextid(originalObject["@context"])) {
        // If the original object has a context that needs id protected, make sure you don't set it.
        delete objectReceived.id
        delete originalObject.id
        delete patchedObject.id
    }
    //A set only adds new keys.  If the original object had the key, it is ignored here.
    delete objectReceived._id
    for (let k in objectReceived) {
        if (originalObject.hasOwnProperty(k)) {
            //Note the possibility of notifying the user that these keys were not processed.
            delete objectReceived[k]
        }
        else {
            patchedObject[k] = objectReceived[k]
        }
    }
    return { noChanges: Object.keys(objectReceived).length === 0, patchedObject }
}

/**
 * Update some existing object in MongoDB by adding the keys from the JSON object in the request body.
 * Note that if a key on the request object matches a key on the object in MongoDB, that key will be ignored.
 * Order the properties to preference @context and @id.  Put __rerum and _id last.
 * This cannot change or unset existing keys.
 * Track History
 * Respond RESTfully
 * */
const patchSet = async function (req, res, next) {
    await basePatchOperation(req, res, next, processPatchSet, "PATCH SET")
}

export { patchSet }
