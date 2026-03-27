#!/usr/bin/env node

/**
 * PATCH Update controller for RERUM operations
 * Handles PATCH updates that modify existing keys
 * @author Claude Sonnet 4, cubap, thehabes
 */

import { basePatchOperation } from './patchBase.js'
import { _contextid } from './utils.js'

/**
 * Process function for PATCH update operation
 * Modifies existing keys, ignores non-existing keys
 */
const processPatchUpdate = (originalObject, objectReceived, patchedObject) => {
    patchedObject = JSON.parse(JSON.stringify(originalObject))
    delete objectReceived.__rerum //can't patch this
    delete objectReceived._id //can't patch this
    delete objectReceived["@id"] //can't patch this
    // id is also protected in this case, so it can't be set.
    if(_contextid(objectReceived["@context"])) delete objectReceived.id
    //A patch only alters existing keys.  Remove non-existent keys from the object received in the request body.
    for (let k in objectReceived) {
        if (originalObject.hasOwnProperty(k)) {
            if (objectReceived[k] === null) {
                delete patchedObject[k]
            }
            else {
                patchedObject[k] = objectReceived[k]
            }
        }
        else {
            //Note the possibility of notifying the user that these keys were not processed.
            delete objectReceived[k]
        }
    }
    return { noChanges: Object.keys(objectReceived).length === 0, patchedObject }
}

/**
 * Update some existing object in MongoDB by changing the keys from the JSON object in the request body.
 * Keys in the request body that do not exist in the original object will be ignored.
 * Order the properties to preference @context and @id.  Put __rerum and _id last.
 * Track History
 * Respond RESTfully
 * */
const patchUpdate = async function (req, res, next) {
    await basePatchOperation(req, res, next, processPatchUpdate, "PATCH UPDATE")
}

export { patchUpdate }
