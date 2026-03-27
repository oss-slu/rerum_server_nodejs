#!/usr/bin/env node

/**
 * PATCH Unset controller for RERUM operations
 * Handles PATCH operations that remove keys
 * @author Claude Sonnet 4, cubap, thehabes
 */

import { basePatchOperation } from './patchBase.js'
import { _contextid } from './utils.js'

/**
 * Process function for PATCH unset operation
 * Removes keys that are set to null in the request
 */
const processPatchUnset = (originalObject, objectReceived, patchedObject) => {
    patchedObject = JSON.parse(JSON.stringify(originalObject))
    delete objectReceived._id //can't unset this
    delete objectReceived.__rerum //can't unset this
    delete objectReceived["@id"] //can't unset this
    // id is also protected in this case, so it can't be unset.
    if(_contextid(originalObject["@context"])) delete objectReceived.id

    /**
     * unset does not alter an existing key.  It removes an existing key.
     * The request payload had {key:null} to flag keys to be removed.
     * Everything else is ignored.
    */
    for (let k in objectReceived) {
        if (originalObject.hasOwnProperty(k) && objectReceived[k] === null) {
            delete patchedObject[k]
        }
        else {
            //Note the possibility of notifying the user that these keys were not processed.
            delete objectReceived[k]
        }
    }
    return { noChanges: Object.keys(objectReceived).length === 0, patchedObject }
}

/**
 * Update some existing object in MongoDB by removing the keys noted in the JSON object in the request body.
 * Note that if a key on the request object does not match a key on the object in MongoDB, that key will be ignored.
 * Order the properties to preference @context and @id.  Put __rerum and _id last.
 * This cannot change existing keys or set new keys.
 * Track History
 * Respond RESTfully
 * */
const patchUnset = async function (req, res, next) {
    await basePatchOperation(req, res, next, processPatchUnset, "PATCH UNSET")
}

export { patchUnset }
